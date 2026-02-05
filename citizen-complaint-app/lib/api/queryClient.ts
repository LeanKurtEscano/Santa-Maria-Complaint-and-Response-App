/**
 * React Query Client Configuration
 *
 * This QueryClient is configured for optimal handling of online/offline scenarios
 * and server request retries. It works well with apps that need:
 *  - Offline support
 *  - Controlled retry logic
 *  - Cached data for performance
 *
 * Queries Options:
 *  - retry: Custom retry logic. This example prevents retries if the device is offline
 *           and otherwise retries up to 3 times on failure.
 *  - staleTime: 5 minutes. Data is considered fresh for 5 minutes.
 *  - gcTime (cacheTime in older versions): 10 minutes. Unused data is garbage collected
 *    after this period.
 *  - refetchOnReconnect: Automatically refetch queries when the device comes back online.
 *  - networkMode: 'offlineFirst' tells React Query to use cached data first when offline.
 *
 * Mutations Options:
 *  - retry: Mutations do NOT retry by default to avoid duplicate side effects.
 *  - networkMode: 'online' ensures mutations are executed only when online.
 *
 * Notes:
 *  - navigator.onLine is used here to detect offline status. For React Native, you may
 *    want to use NetInfo instead.
 *  - This setup is ideal for apps that want a smooth offline experience while ensuring
 *    data consistency when reconnecting.
 */

import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry if offline
        if (!navigator.onLine) return false;
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnReconnect: true, // Auto-refetch when back online
      networkMode: 'offlineFirst', // Use cache when offline
    },
    mutations: {
      retry: false,
      networkMode: 'online', // Only execute mutations when online
    },
  },
});

export default queryClient;
