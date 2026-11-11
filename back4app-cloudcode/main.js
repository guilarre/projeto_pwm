// NOTE: Migrando os dados stop_lat e stop_lon (string) de Stops para lat e lon (numeric)
// pq vamos precisar realizar operações sobre eles
Parse.Cloud.define("migrarLatLong", async (request) => {
    const query = new Parse.Query("Stops");
    query.limit(1000); //temos 756 registros

    const stops = await query.find({ useMasterKey: true });
    let atualizados = 0;

    for (let stop of stops) {
        const latStr = stop.get("stop_lat");
        const lonStr = stop.get("stop_lon");

        const latNum = parseFloat(latStr); //converte
        const lonNum = parseFloat(lonStr); //converte

        if (!isNaN(latNum) && !isNaN(lonNum)) {
            stop.set("lat", latNum);
            stop.set("lon", lonNum);
            // passamos useMasterKey pra ter acesso sem restrições ao BD
            // (é seguro se for apenas no ambiente do Cloud Code)
            await stop.save(null, { useMasterKey: true });
            atualizados++;
        }
    }

    return `Migração concluída! Total de registros salvos nas novas colunas numéricas (lat/lon): ${atualizados}`;
});

// NOTE: Usamos para retornar lista de ônibus para uma parada escolhida
Parse.Cloud.define("getBusesForStop", async (request) => {
    const { stopId } = request.params;
    
    if (!stopId) {
        throw new Parse.Error(400, "O parâmetro stopId é obrigatório.");
    }

    try {
        // 1. Pega a hora atual e dia atual, e ajusta para o fuso de Recife (UTC-3)
        const now = new Date();
        const recifeTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        
        const currentHours = recifeTime.getUTCHours();
        const currentMinutes = recifeTime.getUTCMinutes();
        const currentSeconds = recifeTime.getUTCSeconds();

        // Converte a hora atual para total de segundos desde a meia-noite
        const currentTotalSeconds = (currentHours * 3600) + (currentMinutes * 60) + currentSeconds;
        
        // Define a janela de tempo: entre agora e daqui a 2h
        const windowStart = currentTotalSeconds;
        const windowEnd = currentTotalSeconds + 7200;

        // Identifica o tipo de dia baseado na semana (0 = Domingo, 1-5 = Seg-Sex, 6 = Sábado)
        const dayOfWeek = recifeTime.getUTCDay();
        let targetServiceType = "DUT"; // Padrão Dias Úteis
        if (dayOfWeek === 0) {
            targetServiceType = "DOM";
        } else if (dayOfWeek === 6) {
            targetServiceType = "SAB";
        }


        // Função auxiliar para converter "HH:MM:SS" em segundos
        function timeToSeconds(timeStr) {
            if (!timeStr) return 0;
            const parts = timeStr.split(':').map(Number);
            return (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
        }

        // 2. Busca todos os stop_times daquela parada
        const stopTimesQuery = new Parse.Query("StopTimes");
        stopTimesQuery.equalTo("stop_id", stopId);
        stopTimesQuery.ascending("arrival_time");
        stopTimesQuery.limit(1000); // Limite seguro para abranger os horários do dia
        const stopTimes = await stopTimesQuery.find({ useMasterKey: true });

        if (stopTimes.length === 0) return [];

        // 3. Filtra em memória (horários na janela definida + tipo de dia no trip_id)
        const filteredStopTimes = stopTimes.filter(st => {
            const tripId = st.get("trip_id") || "";
            const arrivalTimeStr = st.get("arrival_time");
            const arrSeconds = timeToSeconds(arrivalTimeStr);

            const isInTimeWindow = arrSeconds >= windowStart && arrSeconds <= windowEnd;
            const isCorrectDayType = tripId.toUpperCase().includes(targetServiceType);

            return isInTimeWindow && isCorrectDayType;
        });

        if (filteredStopTimes.length === 0) return [];

        // Extrai os trip_ids únicos dos horários filtrados
        const tripIds = [...new Set(filteredStopTimes.map(st => st.get("trip_id")))];

        // 4. Busca as trips correspondentes para pegar route_id e trip_headsign
        const tripsQuery = new Parse.Query("Trips");
        tripsQuery.containedIn("trip_id", tripIds);
        tripsQuery.limit(1000);
        const trips = await tripsQuery.find({ useMasterKey: true });

        const tripDetailsMap = {};
        const routeIds = [];

        trips.forEach(trip => {
            const tId = trip.get("trip_id");
            const rId = trip.get("route_id");
            const tripHeadsign = trip.get("trip_headsign"); //destino do bus

            tripDetailsMap[tId] = {
                routeId: rId,
                trip_headsign: tripHeadsign
            };
            if (rId && !routeIds.includes(rId)) {
                routeIds.push(rId);
            }
        });

        if (routeIds.length === 0) return [];

        // 5. Busca as routes correspondentes
        const routesQuery = new Parse.Query("Routes");
        routesQuery.containedIn("route_id", routeIds);
        routesQuery.limit(1000);
        const routes = await routesQuery.find({ useMasterKey: true });

        const routeMap = {};
        routes.forEach(route => {
            routeMap[route.get("route_id")] = {
                route_short_name: route.get("route_short_name"),
                route_long_name: route.get("route_long_name"),
            };
        });

        // 6. Monta o resultado final combinando a linha com o horário exato da passagem
        const results = [];

        filteredStopTimes.forEach(st => {
            const tId = st.get("trip_id");

            const tripInfo = tripDetailsMap[tId];
            const arrivalTime = st.get("arrival_time");

            if (tripInfo && routeMap[tripInfo.routeId]) {
                const route = routeMap[tripInfo.routeId];
                results.push({
                    objectId: st.id,
                    arrival_time: arrivalTime,
                    route_short_name: route.route_short_name,
                    route_long_name: route.route_long_name,
                    trip_headsign: tripInfo.trip_headsign,
                });
            }
        });

        // Ordena por horário de chegada mais próximo
        results.sort((a, b) => timeToSeconds(a.arrival_time) - timeToSeconds(b.arrival_time));

        return results;

    } catch (error) {
        throw new Parse.Error(500, "Erro ao processar horários: " + error.message);
    }
});

// NOTE: Passamos o stop_id e a função retorna o endereço
Parse.Cloud.define("getAddressForStop", async (request) => {
    const { stopId } = request.params;

    if (!stopId) {
        throw new Parse.Error(400, "O parâmetro stopId é obrigatório.");
    }

    try {
        const addressQuery = new Parse.Query("Addresses");
        addressQuery.equalTo("stop_id", stopId);

        // como o stop_id é único, pegamos usando .first(), já que o
        // .find() retornaria um array, mesmo que tenha apenas 1 elem
        const address = await addressQuery.first({ useMasterKey: true });

        // retorna endereço, ou null caso não encontre um endereço
        return address || null;
    } catch (error) {
        throw new Parse.Error(500, `Erro ao processar endereço da parada de ID ${stopId}: ` + error.message);
    }
});
