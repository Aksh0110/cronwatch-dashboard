import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Paper,
} from '@mui/material';
import DnsRoundedIcon from '@mui/icons-material/DnsRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ComputerRoundedIcon from '@mui/icons-material/ComputerRounded';
import LanRoundedIcon from '@mui/icons-material/LanRounded';
import SettingsApplicationsRoundedIcon from '@mui/icons-material/SettingsApplicationsRounded';

import { useAgents } from '../hooks/useAgents';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import StatusChip from '../components/StatusChip';

export const Servers: React.FC = () => {
  const { data: agents, isLoading, refetch } = useAgents();

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Monitored Server Hosts" subtitle="Server infrastructure actively monitored by CronWatch" />
        <LoadingState variant="card" count={4} />
      </Box>
    );
  }

  const handleRefresh = () => {
    refetch();
  };

  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Never';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) return 'Just now (< 1m ago)';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <Box>
      <PageHeader
        title="Monitored Server Hosts"
        subtitle="Live health states, IP bindings, and PM2 process daemons registered across your infrastructure"
        action={
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={handleRefresh}
            sx={{ borderRadius: '8px', fontWeight: 600 }}
          >
            Refresh Hosts
          </Button>
        }
      />

      {!agents || agents.length === 0 ? (
        <EmptyState
          title="No Servers Registered"
          description="No servers have connected to this CronWatch coordinator yet. Ensure the remote agent is pointed to this server."
          actionLabel="Refresh List"
          onAction={handleRefresh}
        />
      ) : (
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          {agents.map((agent) => {
            const isOnline = agent.status === 'ONLINE';
            const env = agent.environment || 'production';
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={agent._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: isOnline ? 'divider' : '#fecaca',
                    boxShadow: 'none',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 2.5 } }}>
                    {/* Top Row: Server Name & Status */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '8px',
                            bgcolor: isOnline ? '#ecfdf5' : '#fef2f2',
                            color: isOnline ? '#047857' : '#b91c1c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <DnsRoundedIcon sx={{ fontSize: '1.25rem' }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                            {agent.serverName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {agent.serverId}
                          </Typography>
                        </Box>
                      </Box>
                      <StatusChip value={agent.status} size="small" />
                    </Box>

                    {/* Environment and Backend badges */}
                    <Box sx={{ display: 'flex', gap: 0.75, mb: 2.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={env.toUpperCase()}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          height: 22,
                          fontSize: '0.65rem',
                          borderRadius: '4px',
                          bgcolor: env === 'production' ? '#fef2f2' : env === 'staging' ? '#fffbeb' : '#f0f9ff',
                          color: env === 'production' ? '#b91c1c' : env === 'staging' ? '#b45309' : '#0369a1',
                          border: '1px solid',
                          borderColor: env === 'production' ? '#fecaca' : env === 'staging' ? '#fde68a' : '#bae6fd',
                        }}
                      />
                      <Chip
                        label={agent.backend || 'PM2'}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          height: 22,
                          fontSize: '0.65rem',
                          borderRadius: '4px',
                          bgcolor: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                        }}
                      />
                    </Box>

                    {/* Network & Host Details */}
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: '#f8fafc',
                        mb: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ComputerRoundedIcon sx={{ fontSize: '0.95rem', color: 'text.secondary' }} />
                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                            HOSTNAME
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              color: 'text.primary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {agent.hostname || 'Unknown'}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LanRoundedIcon sx={{ fontSize: '0.95rem', color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                            IP ADDRESS
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: 'text.primary' }}>
                            {agent.ipAddress || 'Not reported'}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 0.5, borderTop: '1px solid #e2e8f0' }}>
                        <AccessTimeRoundedIcon sx={{ fontSize: '0.95rem', color: isOnline ? 'success.main' : 'error.main' }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                            LAST HEARTBEAT
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              color: isOnline ? '#047857' : '#b91c1c',
                            }}
                          >
                            {getRelativeTime(agent.lastHeartbeat)}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>

                    {/* PM2 Processes on Host */}
                    {agent.pm2 && agent.pm2.length > 0 && (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                          <SettingsApplicationsRoundedIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                            PM2 Daemons ({agent.pm2.length})
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                          {agent.pm2.map((proc, idx) => (
                            <Box
                              key={`${proc.processName}-${idx}`}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 1,
                                borderRadius: 1.5,
                                bgcolor: '#ffffff',
                                border: '1px solid #f1f5f9',
                              }}
                            >
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>
                                  {proc.processName}
                                </Typography>
                                {proc.pid ? (
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                    PID: {proc.pid} {proc.restartCount !== undefined ? `• Restarts: ${proc.restartCount}` : ''}
                                  </Typography>
                                ) : null}
                              </Box>
                              <StatusChip value={proc.status} size="small" />
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default Servers;
