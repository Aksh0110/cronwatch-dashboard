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
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
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
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                mb: 1 
              }}
            >
              {title}
            </Typography>
            <Typography variant="h2" sx={{ color: 'text.primary', fontWeight: 800 }}>
              {value}
            </Typography>
          </Box>
          <Avatar 
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.dark`,
              width: 44,
              height: 44,
              borderRadius: 2,
            }}
          >
            {icon}
          </Avatar>
        </Box>
        {description && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1.5 }}>
            {description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
