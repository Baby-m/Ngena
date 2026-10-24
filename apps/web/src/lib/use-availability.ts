'use client';

import { useEffect, useState } from 'react';

export type AreaAvailability = {
  id: string;
  name: string;
  percentSold: number;
  soldOut: boolean;
};

type Availability = {
  eventId: string;
  soldOutAll: boolean;
  ticketTypes: AreaAvailability[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const REFRESH_MS = 5000; // pergunta a API de 5 em 5 segundos

export function useAvailability(eventId: string) {
  const [data, setData] = useState<Availability | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(`${API_URL}/events/${eventId}/availability`, {
          cache: 'no-store',
        });

        if (!res.ok) throw new Error('bad status');

        const json = (await res.json()) as Availability;

        if (active) {
          setData(json);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      }
    }

    load();

    const timer = setInterval(() => {
      // so atualiza se o separador estiver visivel
      if (document.visibilityState === 'visible') load();
    }, REFRESH_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [eventId]);

  // dicionario por id, para ligar facilmente ao botao Comprar
  const byId: Record<string, AreaAvailability> = {};
  for (const area of data?.ticketTypes ?? []) {
    byId[area.id] = area;
  }

  return { data, byId, error };
}
