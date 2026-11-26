import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FavoriteRoute {
  routeId: string;
  nome: string;
  headsign?: string;
  tripId?: string;
}

const STORAGE_KEY = '@busmap:favorites';

// Estado inicial compartilhado entre as telas
let globalFavorites: FavoriteRoute[] = [];
let isLoaded = false;

type Listener = (items: FavoriteRoute[]) => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((listener) => listener([...globalFavorites]));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteRoute[]>(globalFavorites);

  useEffect(() => {
    listeners.add(setFavorites);

    // Carrega do AsyncStorage apenas na primeira vez que o hook é montado no app
    if (!isLoaded) {
      isLoaded = true;
      AsyncStorage.getItem(STORAGE_KEY)
        .then((jsonValue) => {
          if (jsonValue !== null) {
            globalFavorites = JSON.parse(jsonValue);
            notifyListeners();
          }
        })
        .catch((err) => console.error('Erro ao carregar favoritos:', err));
    }

    return () => {
      listeners.delete(setFavorites);
    };
  }, []);

  const isFavorite = (routeId: string) =>
    favorites.some((item) => item.routeId === routeId);

  const toggleFavorite = async (route: FavoriteRoute) => {
    const exists = globalFavorites.some((item) => item.routeId === route.routeId);
    if (exists) {
      globalFavorites = globalFavorites.filter((item) => item.routeId !== route.routeId);
    } else {
      globalFavorites = [route, ...globalFavorites];
    }

    // atualiza a interface através dos listeners
    notifyListeners();

    // salva em disco em segundo plano
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(globalFavorites));
    } catch (err) {
      console.error('Erro ao salvar favorito:', err);
    }
  };


  return { favorites, isFavorite, toggleFavorite };
}
