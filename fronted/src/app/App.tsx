import { QueryProvider } from './providers/QueryProvider';
import { AppRouter } from './providers/Router';
import '@/shared/styles/global.css';
import '@/shared/styles/globals.css';

export default function App() {
  return (
    <QueryProvider>
      <AppRouter />
    </QueryProvider>
  );
}

