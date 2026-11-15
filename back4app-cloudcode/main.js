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

// NOTE: uma versão generalista da função anterior, que migra qualquer colunaString de alguma classe className no banco para colunaNumeric
// OBS: se não concluir 100% é só rodar de novo que ele continua de onde parou 
Parse.Cloud.define("migrarStringNumeric", async (request) => {
    const {
        className,
        colunaString,
        colunaNumeric,
        limitePorExecucao = 5000
    } = request.params;

    if (!className || !colunaString || !colunaNumeric) {
        throw new Parse.Error(
            400,
            "Os parâmetros 'className', 'colunaString' e 'colunaNumeric' são obrigatórios."
        );
    }

    let totalAtualizados = 0;
    const chunkSize = 200; // Salva em lotes de 200 para evitar timeout no Back4App

    try {
        while (totalAtualizados < limitePorExecucao) {
            const query = new Parse.Query(className);
            // Busca apenas registros que ainda não possuem a nova coluna numérica
            query.doesNotExist(colunaNumeric);
            query.exists(colunaString);
            query.limit(chunkSize);

            const registros = await query.find({ useMasterKey: true });

            if (registros.length === 0) {
                break; // Todos os registros válidos já foram migrados
            }

            const paraSalvar = [];

            for (const item of registros) {
                const rawVal = item.get(colunaString);

                // Evita converter strings vazias ("") em 0
                if (rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== "") {
                    const numVal = Number(String(rawVal).trim().replace(",", ".")); // CHECK: acho q n precisa

                    if (!isNaN(numVal)) {
                        item.set(colunaNumeric, numVal);
                        paraSalvar.push(item);
                    }
                }
            }

            if (paraSalvar.length > 0) {
                await Parse.Object.saveAll(paraSalvar, { useMasterKey: true });
                totalAtualizados += paraSalvar.length;
            } else {
                // Interrompe caso sobrem apenas registros com valores não-numéricos
                break;
            }
        }

        // OBS: Conta quantos ainda faltam para saber se precisa rodar outro lote
        const countQuery = new Parse.Query(className);
        countQuery.doesNotExist(colunaNumeric);
        countQuery.exists(colunaString);
        const restantes = await countQuery.count({ useMasterKey: true });

        return {
            mensagem: `Migração de '${colunaString}' -> '${colunaNumeric}' na classe '${className}'.`,
            atualizadosNestaExecucao: totalAtualizados,
            restantes: restantes,
            concluido: restantes === 0
        };
    } catch (error) {
        throw new Parse.Error(
            500,
            `Erro ao migrar '${colunaString}' em '${className}': ${error.message}`
        );
    }
});

// NOTE: Usamos para retornar lista de ônibus FILTRADOS para uma parada escolhida
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
        stopTimesQuery.limit(1000);
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
            const tripId = trip.get("trip_id"); //pega o trip_id
            const routeId = trip.get("route_id"); //pega os ids do bus
            const tripHeadsign = trip.get("trip_headsign"); //destino do bus

            tripDetailsMap[tripId] = {
                routeId: routeId,
                trip_headsign: tripHeadsign
            };
            if (routeId && !routeIds.includes(routeId)) {
                routeIds.push(routeId);
            }
        });

        if (routeIds.length === 0) return [];

        // 5. Busca as routes correspondentes
        const routesQuery = new Parse.Query("Routes");
        routesQuery.containedIn("route_id",routeIds);
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
            const tripId = st.get("trip_id");

            const tripInfo = tripDetailsMap[tripId];
            const arrivalTime = st.get("arrival_time");

            if (tripInfo && routeMap[tripInfo.routeId]) {
                const route = routeMap[tripInfo.routeId];
                results.push({
                    objectId: st.id,
                    arrival_time: arrivalTime,
                    route_id: tripInfo.routeId,
                    route_short_name: route.route_short_name,
                    route_long_name: route.route_long_name,
                    trip_headsign: tripInfo.trip_headsign,
                    trip_id: tripId
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

// NOTE: retorna a lista ordenada de paradas (com endereços) e os pontos do shape para o mapa
Parse.Cloud.define("getItineraryForBus", async (request) => {
    const { tripId } = request.params; //recebemos o route_id pra depois puxar o trip_id

    if (!tripId) {
        throw new Parse.Error(400, "O parâmetro tripId é obrigatório.");
    }

    try {
        // 1. Pega a viagem correta a partir do trip_id, que usaremos em
        // Trips, pra pegar o shape_id
        const tripQuery = new Parse.Query("Trips"); //pega a classe Trips do banco
        tripQuery.equalTo("trip_id", tripId); //filtra pelo trip_id
        const trip = await tripQuery.first({ useMasterKey: true }); //recebe o primeiro correto (.first())

        if (!trip) {
            return { stops: [], shapes: [] };
        }

        const shapeId = trip.get("shape_id"); //extrai o shape_id da trip

        // 2. Busca os stop_times dessa viagem específica, ordenados por stop_sequence
        const stopTimesQuery = new Parse.Query("StopTimes");
        stopTimesQuery.equalTo("trip_id", tripId);
        // NOTE: ascending funciona corretamente após migrar dados para serem numeric
        stopTimesQuery.ascending("stop_sequence_num");
        stopTimesQuery.limit(1000);
        const stopTimes = await stopTimesQuery.find({ useMasterKey: true });

        if (stopTimes.length === 0) {
            return { stops: [], shapes: [] };
        }

        // Extrai a lista ordenada das stop_ids a partir de stopTimes
        const stopIds = stopTimes.map(st => st.get("stop_id")); //array com stop_id de cada parada, em ordem

        // 3. Busca os endereços/detalhes dessas paradas na nossa tabela de Addresses
        const addressQuery = new Parse.Query("Addresses");
        addressQuery.containedIn("stop_id", stopIds);
        addressQuery.limit(1000);
        const addresses = await addressQuery.find({ useMasterKey: true }); //array com os endereços relevantes

        // Cria um mapa para busca rápida por stop_id
        const addressMap = {};
        addresses.forEach(addr => {
            addressMap[addr.get("stop_id")] = {
                address: addr.get("address"),
                stop_name: addr.get("stop_name"),
                location: addr.get("location")
            };
        });

        // 4. Reconstrói a lista de paradas respeitando exatamente a ordem original do itinerário
        const orderedStops = stopIds.map(stopId => {
            const stopInfo = addressMap[stopId] || {};
            return {
                stop_id: stopId,
                stop_name: stopInfo.stop_name || "Parada de Ônibus",
                address: stopInfo.address || "Endereço não mapeado",
                location: stopInfo.location || null
            };
        });

        // 5. Busca os pontos do shape (caso você tenha a tabela Shapes populada no Back4App)
        let shapePoints = [];
        if (shapeId) {
            const shapesQuery = new Parse.Query("Shapes");
            shapesQuery.equalTo("shape_id", shapeId);
            shapesQuery.ascending("shape_pt_sequence_num"); // Garante o traçado em ordem da linha
            shapesQuery.limit(3000);
            const shapes = await shapesQuery.find({ useMasterKey: true });

            shapePoints = shapes.map(pt => ({
                latitude: Number(pt.get("lat") ?? pt.get("shape_pt_lat")), //garante-se a conversão
                longitude: Number(pt.get("lon") ?? pt.get("shape_pt_lon"))
            })).filter(pt => !isNaN(pt.latitude) && !isNaN(pt.longitude)); // só os que não vierem nulos..
        }

        // Retorna o pacote completo para o app renderizar a lista e o mapa
        return {
            stops: orderedStops,
            shapes: shapePoints
        };

    } catch (error) {
        throw new Parse.Error(500, `Erro ao processar itinerário da viagem (trip_id) ${tripId}: ` + error.message);
    }
});
