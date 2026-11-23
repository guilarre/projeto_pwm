import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, FlatList, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BACK4APP_CONFIG } from '@/config/back4app';
import ClockIcon from '../../../assets/figma.icons/clock-icon.svg';

interface BusRoute {
  objectId: string; //id único gerado pelo back4app
  route_id: string; //id da rota (num do bus específico escolhido)
  route_long_name: string; //nome do bus
  arrival_time?: string; //se houver horário previsto
  trip_headsign?: string; //destino do bus pra mostrar entre parênteses
  trip_id: string;
}

export default function BusStopScreen() {
  // Captura os parâmetros passados na navegação ([id] da parada selecionada)
  const { stopId } = useLocalSearchParams();
  const [buses, setBuses] = useState<BusRoute[]>([]);
  const [stopAddress, setStopAddress] = useState<string>('Carregando endereço...');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!stopId) return;

    async function fetchData() {
      setLoading(true);

      try {
        // função cloud code que busca o endereço correspondente à stop_id
        const addressResponse = await fetch(`${BACK4APP_CONFIG.baseUrl}/functions/getAddressForStop`, {
          method: 'POST',
          headers: {
            'X-Parse-Application-Id': BACK4APP_CONFIG.appId,
            'X-Parse-REST-API-Key': BACK4APP_CONFIG.restKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stopId: stopId }),
        });
        const addressData = await addressResponse.json();

        if (addressData.result && addressData.result.address) {
          const parts = addressData.result.address.split(',');
          const finalAddress = parts.slice(0, 3).join(',').trim();
          setStopAddress(finalAddress);
        } else {
          setStopAddress(`Parada #${stopId}`);
        }

        // chamamos a função de cloud code definida no back4app,
        // que irá retornar apenas os ônibus da parada selecionada,
        // com arrival_time no período que definimos, a partir da
        // hora atual
        const busesResponse = await fetch(`${BACK4APP_CONFIG.baseUrl}/functions/getBusesForStop`, {
          method: 'POST',
          headers: {
            'X-Parse-Application-Id': BACK4APP_CONFIG.appId,
            'X-Parse-REST-API-Key': BACK4APP_CONFIG.restKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stopId: stopId }),
        });

        const busesData = await busesResponse.json();

        if (busesData.result) {
          // NOTE: passa para buses da nossa interface BusRoute
          setBuses(busesData.result);
        }
      } catch (error) {
        console.error('Erro ao buscar ônibus da parada:', error);
        setStopAddress(`Parada #${stopId}`);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [stopId]);

  return (
    <View style={styles.container}>
      {/* Barra superior com botão de voltar no canto superior esquerdo */}
      <View style={styles.topBar}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111" />
        </Pressable>
      </View>

      {/* Cabeçalho com os dados da parada */}
      <View style={styles.header}>
        <Text style={styles.title}>Parada {stopId}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {stopAddress}
        </Text>
      </View>

      {/* TODO: ajeitar esse texto...*/}
      <Text style={styles.sectionTitle}>Próximas chegadas (próximas 2h):</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : buses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum ônibus programado para este horário.</Text>
        </View>
      ) : (
        <FlatList
          data={buses}
          // cada 'item' é um dos bus em buses:
          keyExtractor={(item) => item.objectId}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            /* TODO: onclick mostra tela do bus escolhido em detalhe (horários de saíde, lista de paradas em ordem + posteriormente um mapa com os shapes) */
            <Pressable
              style={({ pressed }) => [
                styles.busCard,
                pressed && { opacity: 0.2, backgroundColor: '#000000' }
              ]}
              onPress={() => {
                router.push({
                  pathname: `/route/${item.route_id}`,
                  params: {
                    longName: item.route_long_name,
                    headsign: item.trip_headsign || '',
                    tripId: item.trip_id
                  }
                });
              }}
            >
              <View style={styles.busInfoLeft}>
                <Text style={styles.busNumber}>{item.route_id}</Text>
                <Text style={styles.busTime}>
                  <ClockIcon width={10} height={10} fill="#fff" />
                  {' '}{item.arrival_time ? item.arrival_time.substring(0, 5) : '--:--'}
                </Text>
              </View>
              <Text style={styles.busName} numberOfLines={2}>
                {item.route_long_name}
                {item.trip_headsign !== undefined && item.trip_headsign !== null && (
                  <Text style={styles.tripHeadsignText}> ({item.trip_headsign})</Text>
                )}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa', 
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#111', 
    marginBottom: 4 
  },
  subtitle: { 
    fontSize: 14, 
    color: '#666',
    lineHeight: 18,
  },
  sectionTitle: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#444',
    marginBottom: 12 
  },
  listContainer: {
    paddingBottom: 20,
  },
  busCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  busInfoLeft: {
    marginRight: 16,
    alignItems: 'flex-start',
    width: 70,
  },
  busNumber: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#007AFF',
    marginBottom: 2
  },
  busTime: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  busName: { 
    fontSize: 14, 
    color: '#333', 
    flex: 1 
  },
  tripHeadsignText: {
    color: '#888',
    fontWeight: '600',
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#888', 
    fontSize: 14 
  },
});