import { useState, useEffect } from 'react';

export interface FavoriteRoute {
  routeId: string;
  nome: string;
  headsign?: string;
  tripId?: string;
}

// Estado inicial compartilhado entre as telas
let globalFavorites: FavoriteRoute[] = [
  { routeId: '1981', nome: 'T.I. Rio Doce / T.I. Joana Bezerra', headsign: 'Ida' },
  { routeId: '030', nome: 'Recife / Boa Viagem', headsign: 'Principal' },
];

type Listener = (items: FavoriteRoute[]) => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((listener) => listener([...globalFavorites]));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteRoute[]>(globalFavorites);

  useEffect(() => {
    listeners.add(setFavorites);
    return () => {
      listeners.delete(setFavorites);
    };
  }, []);

  const isFavorite = (routeId: string) =>
    favorites.some((item) => item.routeId === routeId);

  const toggleFavorite = (route: FavoriteRoute) => {
    const exists = globalFavorites.some((item) => item.routeId === route.routeId);
    if (exists) {
      globalFavorites = globalFavorites.filter((item) => item.routeId !== route.routeId);
    } else {
      globalFavorites = [route, ...globalFavorites];
    }
    notifyListeners();
  };

  return { favorites, isFavorite, toggleFavorite };
}