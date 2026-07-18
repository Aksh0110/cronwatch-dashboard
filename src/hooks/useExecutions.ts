import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { GetExecutionsParams } from '../types';

export const useExecutions = (params?: GetExecutionsParams) => {
  return useQuery({
    queryKey: ['executions', params],
    queryFn: () => api.getExecutions(params),
    refetchInterval: 10000, // Poll every 10 seconds to catch running execution updates
  });
};
