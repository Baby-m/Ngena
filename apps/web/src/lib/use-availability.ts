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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001/api';

const REFRESH_MS = 5000;

export function useAvailability(eventId: string) {
  const [data, setData] = useState<Availability | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(
          `${API_URL}/events/${eventId}/availability`,
          {
            cache: 'no-store',
          },
        );

        if (!res.ok) {
          throw new Error('Failed to load availability');
        }

        const json = (await res.json()) as Availability;

        if (active) {
          setData(json);
          setError(false);
        }
      } catch {
        if (active) {
          setError(true);
        }
      }
    }

    void load();

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void load();
      }
    }, REFRESH_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [eventId]);

  const byId: Record<string, AreaAvailability> = {};

  for (const area of data?.ticketTypes ?? []) {
    byId[area.id] = area;
  }

  return { data, byId, error };
}
