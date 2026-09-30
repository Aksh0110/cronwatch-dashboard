import React from 'react';
import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  description?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'primary', description }) => {
  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2.5,
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        },
      }}
    >
      <Box 
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          bgcolor: `${color}.main`,
        }} 
      />
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.06em', 
                display: 'block',
                mb: 0.5,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                color: 'text.primary',
                fontWeight: 800,
                fontSize: { xs: '1.6rem', sm: '1.85rem' },
                lineHeight: 1.2,
              }}
            >
              {value}
            </Typography>
          </Box>
          <Avatar 
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.dark`,
              width: 42,
              height: 42,
              borderRadius: 2,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            }}
          >
            {icon}
          </Avatar>
        </Box>
        {description && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
              mt: 1.25,
              fontWeight: 500,
              fontSize: '0.75rem',
            }}
          >
            {description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
