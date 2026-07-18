import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    refetchInterval: 15000, // Poll every 15 seconds to keep stats updated
  });
};
