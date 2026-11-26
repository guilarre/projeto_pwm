import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BACK4APP_CONFIG } from '@/config/back4app';
import { BusTheme } from '@/constants/theme';
import { SharedStyles } from '@/styles/shared';
import ClockIcon from '../../../assets/figma.icons/clock-icon.svg';

const { colors, radius } = BusTheme;

interface BusRoute {
  objectId: string;
  route_id: string;
  route_long_name: string;
  arrival_time?: string;
  trip_headsign?: string;
  trip_id: string;
}

export default function BusStopScreen() {
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
          setStopAddress('');
        }

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
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [SharedStyles.floatingBackButton, pressed && { opacity: 0.8 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Parada {stopId}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {stopAddress}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Próximas chegadas (próximas 2h):</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.brand} style={{ marginTop: 40 }} />
        ) : buses.length === 0 ? (
          <View style={SharedStyles.emptyContainer}>
            <Text style={SharedStyles.emptyText}>Nenhum ônibus programado para este horário.</Text>
          </View>
        ) : (
          <FlatList
            data={buses}
            keyExtractor={(item) => item.objectId}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  SharedStyles.card,
                  styles.busCardRow,
                  pressed && SharedStyles.cardPressed,
                ]}
                onPress={() => {
                  router.push({
                    pathname: `/route/${item.route_id}` as any,
                    params: {
                      longName: item.route_long_name,
                      headsign: item.trip_headsign || '',
                      tripId: item.trip_id,
                    },
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  header: {
    backgroundColor: colors.brand,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.liveSoft,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.liveSoft,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  listContainer: {
    paddingBottom: 20,
    gap: 10,
  },
  busCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  busInfoLeft: {
    marginRight: 16,
    alignItems: 'flex-start',
    width: 70,
  },
  busNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.brand,
    marginBottom: 2,
  },
  busTime: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  busName: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  tripHeadsignText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
});


