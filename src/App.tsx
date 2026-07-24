import { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from './theme';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Servers from './pages/Servers';
import Executions from './pages/Executions';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import AuthPage from './pages/AuthPage';

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
  const [token, setToken] = useState<string | null>(localStorage.getItem('cronwatch_token'));

  const handleLoginSuccess = (newToken: string, user: any) => {
    localStorage.setItem('cronwatch_token', newToken);
    localStorage.setItem('cronwatch_user', JSON.stringify(user));
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('cronwatch_token');
    localStorage.removeItem('cronwatch_user');
    setToken(null);
    setCurrentPage('dashboard');
  };

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
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {!token ? (
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          <DashboardLayout
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            onLogout={handleLogout}
          >
            {renderPage()}
          </DashboardLayout>
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
