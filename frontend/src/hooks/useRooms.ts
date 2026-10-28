'use client';

import { useEffect, useState } from 'react';
import { apiRequest, formatApiError } from '@/lib/api';
import type { RoomFilters, RoomListResult, RoomSummary } from '@/types';

interface RoomsState {
  rooms: RoomSummary[];
  loading: boolean;
  error: string | null;
  total: number;
}

export function useRooms(filters: RoomFilters): RoomsState {
  const [state, setState] = useState<RoomsState>({
    rooms: [],
    loading: true,
    error: null,
    total: 0,
  });
  const hostel = filters.hostel ?? '';
  const roomType = filters.roomType ?? '';
  const minPrice = filters.minPrice ?? '';
  const maxPrice = filters.maxPrice ?? '';
  const available = filters.available ?? '';
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;

  useEffect(() => {
    const params = new URLSearchParams();
    if (hostel) params.set('hostel', hostel);
    if (roomType) params.set('roomType', roomType);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (available) params.set('available', available);
    params.set('page', String(page));
    params.set('limit', String(limit));

    let cancelled = false;
    apiRequest<RoomListResult>(`/api/v1/rooms?${params.toString()}`)
      .then((data) => {
        if (!cancelled) {
          setState({
            rooms: data.rooms,
            loading: false,
            error: null,
            total: data.pagination.total,
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({ rooms: [], loading: false, error: formatApiError(error), total: 0 });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hostel, roomType, minPrice, maxPrice, available, page, limit]);

  return state;
}
