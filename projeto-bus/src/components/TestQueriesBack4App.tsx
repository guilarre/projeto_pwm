import React, { useState } from 'react';
import { View, Button, Alert, ActivityIndicator } from 'react-native';
import { Region } from 'react-native-maps';

const APP_ID = process.env.EXPO_PUBLIC_BACK4APP_APP_ID;
const REST_KEY = process.env.EXPO_PUBLIC_BACK4APP_REST_KEY;

export default function TestQueriesBack4App() {
    const [loading, setLoading] = useState(false);

    // const initialRegion: Region = { // Recife
    //     latitude: -8.0476,
    //     longitude: -34.8770,
    //     latitudeDelta: 0.02,
    //     longitudeDelta: 0.02,
    // };

    const testConn = async () => {
        setLoading(true);

        const minLat = -7.89;
        const maxLat = -7.87;
        const minLon = -34.85;
        const maxLon = -34.82;

        const whereQuery = {
            lat: { $gte: minLat, $lte: maxLat },
            lon: { $gte: minLon, $lte: maxLon },
        };

        try {
            const url = `https://parseapi.back4app.com/classes/Stops?where=${encodeURIComponent(
                JSON.stringify(whereQuery)
            )}&limit=100`;

            const response = await fetch(url, {
                headers: {
                    'X-Parse-Application-Id': `${APP_ID}`,
                    'X-Parse-REST-API-Key': `${REST_KEY}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro na resposta do servidor');
            }

            if (data.results) {
                console.log(data.results);
                Alert.alert(
                    'Sucesso!', 
                    `Conexão bem-sucedida. Encontradas ${data.results.length} paradas.`
                );
            }
        } catch (error: any) {
            console.error('Erro ao buscar paradas da região:', error);
            Alert.alert('Erro na conexão', error.message || 'Não foi possível conectar ao Back4App.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ padding: 20, justifyContent: 'center', alignItems: 'center' }}>
            {loading ? (
                <ActivityIndicator size="large" color="#27ae60" />
            ) : (
                <Button
                    title="Rodar teste"
                    onPress={testConn}
                    color="#27ae60"
                />
            )}
        </View>
    );
}
