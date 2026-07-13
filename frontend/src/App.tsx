import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './app/theme';
import { RunProvider } from './app/RunContext';
import { router } from './app/routes';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RunProvider>
          <RouterProvider router={router} />
        </RunProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
