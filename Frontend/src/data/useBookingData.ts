import { useQuery } from '@tanstack/react-query';
import { StallBooking } from '../domain/models';
import { apiClient } from './api/apiClient';
import { repositories } from './repositoryFactory';

export const BOOKINGS_KEY = ['bookings'] as const;
export const STALLS_KEY = ['stalls'] as const;

export function useBookingsQuery() {
  return useQuery({
    queryKey: BOOKINGS_KEY,
    queryFn: () => apiClient.get<StallBooking[]>('/admin/events/current/bookings'),
  });
}
export function useStallsQuery() {
  return useQuery({
    queryKey: STALLS_KEY,
    queryFn: () => repositories.stalls.list(),
    staleTime: 60_000, 
  });
}