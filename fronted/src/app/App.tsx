import { QueryProvider } from './providers/QueryProvider';
import { AppRouter } from './providers/Router';
import '@/shared/styles/global.css';

export default function App() {
  return (
    <QueryProvider>
      <AppRouter />
    </QueryProvider>
  );
}

