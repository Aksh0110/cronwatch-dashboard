import React from 'react';
import { Grid, Typography, Card, CardContent, Box, Button, Link } from '@mui/material';
import DnsIcon from '@mui/icons-material/Dns';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import HistoryIcon from '@mui/icons-material/History';

import SettingsIcon from '@mui/icons-material/Settings';
import { useDashboardData } from '../hooks/useDashboardData';
import { useAlerts, useAcknowledgeAlert } from '../hooks/useAlerts';
import { useAgents } from '../hooks/useAgents';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import StatusChip from '../components/StatusChip';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { data: stats, isLoading: statsLoading, refetch } = useDashboardData();
  const { data: activeAlerts, isLoading: alertsLoading } = useAlerts({ acknowledged: false, limit: 5 });
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const acknowledgeAlertMutation = useAcknowledgeAlert();

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlertMutation.mutateAsync(id);
      refetch();
    } catch (e) {
      console.error('Failed to acknowledge alert', e);
    }
  };

  const isLoading = statsLoading || alertsLoading || agentsLoading;

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Dashboard" subtitle="Overview of cron system health" />
        <LoadingState variant="card" count={4} />
        <Box sx={{ mt: 4 }}>
          <LoadingState variant="table" count={4} />
        </Box>
      </Box>
    );
  }

  // Fallbacks if stats fail or empty
  const totalServers = stats?.totalServers ?? 0;
  const onlineServers = stats?.onlineServers ?? 0;
  const runningJobs = stats?.runningJobs ?? 0;
  const healthyJobs = stats?.healthyJobs ?? 0;
  const failedJobs = stats?.failedJobs ?? 0;
  const latestExecutions = stats?.latestExecutions ?? [];

  // Flatten PM2 processes across all ONLINE agents
  const pm2ProcessesList = (agents || [])
    .filter((agent) => agent.status === 'ONLINE')
    .flatMap((agent) =>
      (agent.pm2 || []).map((proc) => ({
        ...proc,
        serverId: agent.serverId,
        serverName: agent.serverName,
      }))
    );

  return (
    <Box>
      <PageHeader 
        title="Dashboard" 
        subtitle="Overview of cron system health across your infrastructure"
        action={
          <Button variant="outlined" color="primary" onClick={() => refetch()}>
            Refresh Dashboard
          </Button>
        }
      />

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Servers"
            value={`${onlineServers} / ${totalServers}`}
            icon={<DnsIcon />}
            color="primary"
            description="Online servers / total registered"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Running Jobs"
            value={runningJobs}
            icon={<SpeedIcon />}
            color="info"
            description="Cron executions currently active"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Healthy Jobs"
            value={healthyJobs}
            icon={<CheckCircleOutlinedIcon />}
            color="success"
            description="Jobs whose latest execution succeeded"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Failed Jobs"
            value={failedJobs}
            icon={<ErrorOutlinedIcon />}
            color="error"
            description="Jobs whose latest execution failed"
          />
        </Grid>
      </Grid>

      {/* Main Grid content */}
      <Grid container spacing={3}>
        {/* Recent Executions (Left column) */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Recent Executions
                  </Typography>
                </Box>
                <Button size="small" variant="text" onClick={() => onNavigate('executions')}>
                  View All Executions
                </Button>
              </Box>

              {latestExecutions.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>
                  No executions recorded yet.
                </Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                        <th style={{ padding: '12px 8px', fontWeight: 600, fontSize: '0.85rem' }}>Job Name</th>
                        <th style={{ padding: '12px 8px', fontWeight: 600, fontSize: '0.85rem' }}>Server</th>
                        <th style={{ padding: '12px 8px', fontWeight: 600, fontSize: '0.85rem' }}>Status</th>
                        <th style={{ padding: '12px 8px', fontWeight: 600, fontSize: '0.85rem' }}>Started At</th>
                        <th style={{ padding: '12px 8px', fontWeight: 600, fontSize: '0.85rem' }}>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestExecutions.map((exec) => (
                        <tr key={exec._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 8px', fontSize: '0.875rem', fontWeight: 600 }}>
                            {exec.jobName}
                          </td>
                          <td style={{ padding: '12px 8px', fontSize: '0.875rem', color: '#475569' }}>
                            {exec.serverName || exec.serverId}
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <StatusChip value={exec.status} />
                          </td>
                          <td style={{ padding: '12px 8px', fontSize: '0.875rem', color: '#475569' }}>
                            {new Date(exec.startedAt).toLocaleTimeString()}
                          </td>
                          <td style={{ padding: '12px 8px', fontSize: '0.875rem', color: '#475569' }}>
                            {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: PM2 Processes & Active Alerts */}
        <Grid size={{ xs: 12, lg: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* PM2 Processes Status Card */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <SettingsIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  PM2 Processes
                </Typography>
              </Box>

              {pm2ProcessesList.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>
                  No PM2 processes monitored.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {pm2ProcessesList.map((proc, index) => (
                    <Box
                      key={`${proc.serverId}-${proc.processName}-${index}`}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {proc.processName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {proc.serverName || proc.serverId}
                        </Typography>
                      </Box>
                      <StatusChip value={proc.status} />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Active Alerts Card */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsActiveIcon sx={{ color: 'error.main' }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Active Alerts
                  </Typography>
                </Box>
                <Button size="small" variant="text" onClick={() => onNavigate('alerts')}>
                  Alerts Page
                </Button>
              </Box>

              {!activeAlerts || activeAlerts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CheckCircleOutlinedIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    All systems operational.
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    No unacknowledged alerts found.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {activeAlerts.map((alert) => (
                    <Box
                      key={alert._id}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: alert.severity === 'CRITICAL' ? 'error.light' : alert.severity === 'WARNING' ? 'warning.light' : 'info.light',
                        borderLeft: '4px solid',
                        borderColor: alert.severity === 'CRITICAL' ? 'error.main' : alert.severity === 'WARNING' ? 'warning.main' : 'info.main',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontWeight: 700, 
                            color: alert.severity === 'CRITICAL' ? 'error.dark' : alert.severity === 'WARNING' ? 'warning.dark' : 'info.dark' 
                          }}
                        >
                          {alert.severity} • {alert.type}
                        </Typography>
                        <Link
                          component="button"
                          variant="caption"
                          onClick={() => handleAcknowledge(alert._id)}
                          sx={{ 
                            fontWeight: 600, 
                            color: 'text.primary', 
                            textDecoration: 'underline',
                            '&:hover': { color: 'primary.main' }
                          }}
                        >
                          Acknowledge
                        </Link>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, lineHeight: 1.4 }}>
                        {alert.message}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                        {new Date(alert.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
