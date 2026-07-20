import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip, Button } from '@mui/material';
import DnsIcon from '@mui/icons-material/Dns';
import RefreshIcon from '@mui/icons-material/Refresh';

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
        <PageHeader title="Servers" subtitle="Monitored agent server hosts" />
        <LoadingState variant="card" count={4} />
      </Box>
    );
  }

  const handleRefresh = () => {
    refetch();
  };

  const getRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <Box>
      <PageHeader
        title="Servers"
        subtitle="View and monitor server hosts running CronWatch agent processes"
        action={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        }
      />

      {!agents || agents.length === 0 ? (
        <EmptyState
          title="No Servers Registered"
          description="It looks like no servers have connected to this CronWatch coordinator yet. Install the CronWatch agent on your servers to start monitoring."
          actionLabel="Refresh List"
          onAction={handleRefresh}
        />
      ) : (
        <Grid container spacing={3}>
          {agents.map((agent) => {
            const isOnline = agent.status === 'ONLINE';
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={agent._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* Top row: Name & status */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DnsIcon sx={{ color: isOnline ? 'success.main' : 'text.disabled' }} />
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {agent.serverName}
                        </Typography>
                      </Box>
                      <StatusChip value={agent.status} />
                    </Box>

                    {/* Environment tag */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                      <Chip
                        label={agent.environment.toUpperCase()}
                        size="small"
                        color={
                          agent.environment === 'production' 
                            ? 'error' 
                            : agent.environment === 'staging' 
                            ? 'warning' 
                            : 'info'
                        }
                        sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }}
                      />
                      <Chip
                        label={agent.backend}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 500, height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>

                    {/* Meta info list */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          Hostname
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', color: 'text.primary' }}>
                          {agent.hostname}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          IP Address
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                          {agent.ipAddress}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          Server ID
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', fontSize: '0.8rem' }}>
                          {agent.serverId}
                        </Typography>
                      </Box>

                      <Box sx={{ mt: 1, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          Last Heartbeat
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: isOnline ? 'success.dark' : 'error.main' }}>
                          {getRelativeTime(agent.lastHeartbeat)}
                        </Typography>
                      </Box>

                      {agent.pm2 && agent.pm2.length > 0 && (
                        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                            Monitored PM2 Processes
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {agent.pm2.map((proc) => (
                              <Box key={proc.processName} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.primary' }}>
                                  {proc.processName}
                                </Typography>
                                <StatusChip value={proc.status} />
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
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
