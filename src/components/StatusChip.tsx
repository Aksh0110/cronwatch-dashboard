import React from 'react';
import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';

interface StatusChipProps {
  value: string;
  size?: 'small' | 'medium';
}

export const StatusChip: React.FC<StatusChipProps> = ({ value, size = 'small' }) => {
  const normalized = value ? value.toUpperCase() : '';

  let color: ChipProps['color'] = 'default';
  let label = value;
  let icon: React.ReactElement | undefined = undefined;

  switch (normalized) {
    // Agent status
    case 'ONLINE':
      color = 'success';
      label = 'Online';
      icon = <WifiIcon sx={{ fontSize: '0.875rem' }} />;
      break;
    case 'OFFLINE':
      color = 'error';
      label = 'Offline';
      icon = <WifiOffIcon sx={{ fontSize: '0.875rem' }} />;
      break;
    case 'STOPPED':
      color = 'default';
      label = 'Stopped';
      icon = <WifiOffIcon sx={{ fontSize: '0.875rem' }} />;
      break;
    case 'ERRORED':
      color = 'error';
      label = 'Errored';
      icon = <CancelIcon sx={{ fontSize: '0.875rem' }} />;
      break;

    // Execution status
    case 'SUCCESS':
    case 'COMPLETED':
      color = 'success';
      label = 'Success';
      icon = <CheckCircleIcon sx={{ fontSize: '0.875rem' }} />;
      break;
    case 'FAILED':
      color = 'error';
      label = 'Failed';
      icon = <CancelIcon sx={{ fontSize: '0.875rem' }} />;
      break;
    case 'STARTED':
    case 'RUNNING':
      color = 'info';
      label = 'Running';
      icon = <HourglassEmptyIcon sx={{ fontSize: '0.875rem' }} />;
      break;

    // Alert severity
    case 'CRITICAL':
      color = 'error';
      label = 'Critical';
      icon = <CancelIcon sx={{ fontSize: '0.875rem' }} />;
      break;
    case 'WARNING':
      color = 'warning';
      label = 'Warning';
      icon = <WarningAmberIcon sx={{ fontSize: '0.875rem' }} />;
      break;
    case 'INFO':
      color = 'info';
      label = 'Info';
      icon = <InfoIcon sx={{ fontSize: '0.875rem' }} />;
      break;

    default:
      color = 'default';
      label = value;
  }

  return (
    <Chip
      icon={icon}
      label={label}
      color={color}
      size={size}
      variant="outlined"
      sx={{
        fontWeight: 600,
        borderRadius: '6px',
        px: 0.5,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
};

export default StatusChip;
