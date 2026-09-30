import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          flexDirection: { xs: 'column', sm: 'row' },
          mb: 1.5, 
          gap: 1.5,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              color: 'text.primary',
              fontWeight: 800,
              fontSize: { xs: '1.4rem', sm: '1.75rem' },
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', mt: 0.25, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>{action}</Box>}
      </Box>
      <Divider sx={{ borderColor: '#e2e8f0' }} />
    </Box>
  );
};

export default PageHeader;
