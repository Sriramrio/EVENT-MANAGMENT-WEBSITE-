import type { PropsWithChildren } from 'react'; 
import { Provider } from 'react-redux'; 
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 
import { Toaster } from 'react-hot-toast';

import { SessionBridge } from './SessionBridge';
import { store } from '../store/store';
import { AppErrorBoundary } from '../errors/AppErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, error) => {
        const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status?: number }).status) : 0;
        return ![401, 403, 404, 409, 412, 422].includes(status) && count < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      gcTime: 10 * 60_000
    },
    mutations: { retry: false }
  }
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppErrorBoundary>
          <SessionBridge />
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          {children}
        </AppErrorBoundary>
      </QueryClientProvider>
    </Provider>
  );
}
