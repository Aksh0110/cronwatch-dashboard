import React from 'react';
import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import WifiRoundedIcon from '@mui/icons-material/WifiRounded';
import WifiOffRoundedIcon from '@mui/icons-material/WifiOffRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded';

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
      icon = <WifiRoundedIcon sx={{ fontSize: '0.85rem' }} />;
      break;
    case 'OFFLINE':
      color = 'error';
      label = 'Offline';
      icon = <WifiOffRoundedIcon sx={{ fontSize: '0.85rem' }} />;
      break;
    case 'STOPPED':
      color = 'default';
      label = 'Stopped';
      icon = <WifiOffRoundedIcon sx={{ fontSize: '0.85rem' }} />;
      break;
    case 'ERRORED':
      color = 'error';
      label = 'Errored';
      icon = <CancelRoundedIcon sx={{ fontSize: '0.85rem' }} />;
      break;

    // Execution status
    case 'SUCCESS':
    case 'COMPLETED':
      color = 'success';
      label = 'Success';
      icon = <CheckCircleRoundedIcon sx={{ fontSize: '0.85rem' }} />;
      break;
    case 'FAILED':
      color = 'error';
      label = 'Failed';
      icon = <CancelRoundedIcon sx={{ fontSize: '0.85rem' }} />;
      break;
    case 'SKIPPED':
      color = 'default';
      label = 'Skipped';
      icon = <SkipNextRoundedIcon sx={{ fontSize: '0.85rem' }} />;
      break;
    case 'STARTED':
    case 'RUNNING':
      color = 'info';
      label = 'Running';
      icon = <HourglassEmptyRoundedIcon sx={{ fontSize: '0.85rem' }} />;
      break;

    // Alert severity
    case 'CRITICAL':
      color = 'error';
      label = 'Critical';
      icon = <CancelRoundedIcon sx={{ fontSize: '0.85rem' }} />;
      break;
    case 'WARNING':
      color = 'warning';
      label = 'Warning';
      icon = <WarningAmberRoundedIcon sx={{ fontSize: '0.85rem' }} />;
      break;
    case 'INFO':
      color = 'info';
      label = 'Info';
      icon = <InfoOutlinedIcon sx={{ fontSize: '0.85rem' }} />;
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
      variant={normalized === 'SKIPPED' ? 'outlined' : 'filled'}
      sx={{
        fontWeight: 600,
        borderRadius: '6px',
        fontSize: size === 'small' ? '0.75rem' : '0.85rem',
        height: size === 'small' ? 24 : 28,
        letterSpacing: '0.02em',
        ...(normalized === 'SUCCESS' || normalized === 'COMPLETED'
          ? { bgcolor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }
          : normalized === 'FAILED' || normalized === 'CRITICAL' || normalized === 'OFFLINE'
          ? { bgcolor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }
          : normalized === 'WARNING'
          ? { bgcolor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }
          : normalized === 'RUNNING' || normalized === 'INFO'
          ? { bgcolor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
          : normalized === 'ONLINE'
          ? { bgcolor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }
          : { bgcolor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }),
        '& .MuiChip-icon': {
          color: 'inherit',
          ml: 0.75,
          mr: -0.25,
        },
        '& .MuiChip-label': {
          px: 1,
        },
      }}
    />
  );
};

export default StatusChip;
