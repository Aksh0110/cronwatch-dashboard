import { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from './theme';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Servers from './pages/Servers';
import Executions from './pages/Executions';
import Alerts from './pages/Alerts';

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'servers':
        return <Servers />;
      case 'executions':
        return <Executions />;
      case 'alerts':
        return <Alerts />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DashboardLayout currentPage={currentPage} setCurrentPage={setCurrentPage}>
          {renderPage()}
        </DashboardLayout>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
