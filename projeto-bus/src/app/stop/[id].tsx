import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet, Text, ActivityIndicator, FlatList } from 'react-native';
import { BACK4APP_CONFIG } from '@/config/back4app';

interface BusRoute {
    objectId: string;
    route_short_name: string; //num do bus
    route_long_name: string; //nome do bus
    arrival_time?: string; //se houver horário previsto
}

export default function BusStopScreen() {
    // Captura os parâmetros passados na navegação
    const { id, name, stopId } = useLocalSearchParams();
    const [buses, setBuses] = useState<BusRoute[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBusesForStop() {
            if (!stopId) return;

            try {
                // chamamos a função de cloud code definida no back4app,
                // que irá retornar apenas os ônibus da parada selecionada,
                // com arrival_time no período entre -1h e +1h a partir da
                // hora atual
                const response = await fetch(`${BACK4APP_CONFIG.baseUrl}/functions/getBusesForStop`, {
                    method: 'POST',
                    headers: {
                        'X-Parse-Application-Id': BACK4APP_CONFIG.appId,
                        'X-Parse-REST-API-Key': BACK4APP_CONFIG.restKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ stopId: stopId }),
                });

                const data = await response.json();
                
                if (data.result) {
                    setBuses(data.result);
                }
            } catch (error) {
                console.error('Erro ao buscar ônibus da parada:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchBusesForStop();
    }, [stopId]);

    return (
        <View style={styles.container}>
            {/* Cabeçalho com os dados da parada */}
            <View style={styles.header}>
                <Text style={styles.title}>{name || 'Parada de Ônibus'}</Text>
                <Text style={styles.subtitle}>Código da Parada: {stopId}</Text>
            </View>

            <Text style={styles.sectionTitle}>Próximos horários (-1h / +1h):</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
            ) : buses.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Nenhum ônibus programado para este horário próximo.</Text>
                </View>
            ) : (
                <FlatList
                    data={buses}
                    keyExtractor={(item) => item.objectId}
                    contentContainerStyle={styles.listContainer}
                    renderItem={({ item }) => (
                        <View style={styles.busCard}>
                            <View style={styles.busInfoLeft}>
                                <Text style={styles.busNumber}>{item.route_short_name}</Text>
                                <Text style={styles.busTime}>
                                    🕒 {item.arrival_time ? item.arrival_time.substring(0, 5) : '--:--'}
                                </Text>
                            </View>
                            <Text style={styles.busName} numberOfLines={2}>
                                {item.route_long_name}
                            </Text>
                        </View>
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
        paddingTop: 16 
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
        color: '#666' 
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
