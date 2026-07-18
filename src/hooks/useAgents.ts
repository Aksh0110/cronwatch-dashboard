import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useAgents = () => {
  return useQuery({
    queryKey: ['agents'],
    queryFn: api.getAgents,
    refetchInterval: 30000, // Poll every 30 seconds to update online status
  });
};
