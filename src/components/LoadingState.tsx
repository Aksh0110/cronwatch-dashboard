import React from 'react';
import { Box, Skeleton, Grid, Paper } from '@mui/material';

interface LoadingStateProps {
  variant?: 'card' | 'table' | 'list';
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ variant = 'card', count = 3 }) => {
  if (variant === 'card') {
    return (
      <Grid container spacing={3}>
        {Array.from({ length: count }).map((_, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Paper sx={{ p: 3, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ width: '60%' }}>
                  <Skeleton variant="text" width="100%" height={20} />
                  <Skeleton variant="text" width="50%" height={32} />
                </Box>
                <Skeleton variant="rectangular" width={44} height={44} sx={{ borderRadius: 1 }} />
              </Box>
              <Skeleton variant="text" width="80%" height={16} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (variant === 'table') {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <Skeleton variant="rectangular" width="100%" height={48} sx={{ mb: 1, borderRadius: '4px' }} />
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton key={index} variant="rectangular" width="100%" height={56} sx={{ mb: 1, borderRadius: '4px' }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Paper key={index} sx={{ p: 2, mb: 2, border: '1px solid #e2e8f0' }}>
          <Skeleton variant="text" width="30%" height={24} />
          <Skeleton variant="text" width="80%" height={16} sx={{ mt: 1 }} />
        </Paper>
      ))}
    </Box>
  );
};

export default LoadingState;
