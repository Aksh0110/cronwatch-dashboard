import React, { useState } from 'react';
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DnsRoundedIcon from '@mui/icons-material/DnsRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import { useDashboardData } from '../hooks/useDashboardData';
import { useAlerts, useAcknowledgeAlert } from '../hooks/useAlerts';
import { useAgents } from '../hooks/useAgents';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import StatusChip from '../components/StatusChip';
import type { Alert } from '../types';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

// Helper to parse alert summary
function parseAlertSummary(raw: string): string {
  if (!raw) return 'Alert detected';
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}$/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.description) return parsed.description;
    }
  } catch {
    // ignore
  }
  const clean = raw.replace(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+(error|warn|info)?\s*/i, '');
  const prefix = clean.split(/\{/)[0].replace(/\[.*?\]/g, '').trim();
  return prefix || clean.substring(0, 100);
}

export const Dashboard: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { data: stats, isLoading: statsLoading, refetch } = useDashboardData();
  const { data: activeAlerts, isLoading: alertsLoading } = useAlerts({ acknowledged: false, limit: 5 });
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const acknowledgeAlertMutation = useAcknowledgeAlert();

  // Selected alert for quick inspection dialog
  const [inspectAlert, setInspectAlert] = useState<Alert | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlertMutation.mutateAsync(id);
      refetch();
      if (inspectAlert && inspectAlert._id === id) {
        setInspectAlert(null);
      }
    } catch (e) {
      console.error('Failed to acknowledge alert', e);
    }
  };

  const handleCopyLogs = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = statsLoading || alertsLoading || agentsLoading;

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="System Dashboard" subtitle="Overview of cron system health and infrastructure" />
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
        title="System Dashboard"
        subtitle="Real-time PM2 cron monitoring, host health, and active events across all environments"
        action={
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => refetch()}
            sx={{ borderRadius: '8px', fontWeight: 600 }}
          >
            Refresh Metrics
          </Button>
        }
      />

      {/* Stats Cards Row */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Monitored Servers"
            value={`${onlineServers} / ${totalServers}`}
            icon={<DnsRoundedIcon />}
            color="primary"
            description={`${onlineServers} of ${totalServers} servers active & healthy`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Running Jobs"
            value={runningJobs}
            icon={<SpeedRoundedIcon />}
            color="info"
            description="Cron executions currently active"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Healthy Jobs"
            value={healthyJobs}
            icon={<CheckCircleRoundedIcon />}
            color="success"
            description="Tasks that succeeded on last execution"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Failed Jobs"
            value={failedJobs}
            icon={<ErrorOutlineRoundedIcon />}
            color="error"
            description="Jobs requiring operational review"
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Recent Executions (Left Column) */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2.5,
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryRoundedIcon sx={{ color: 'primary.main', fontSize: '1.4rem' }} />
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    Recent Cron Executions
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="text"
                  endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: '0.9rem !important' }} />}
                  onClick={() => onNavigate('executions')}
                  sx={{ fontWeight: 700, textTransform: 'none', color: 'secondary.main' }}
                >
                  View All History
                </Button>
              </Box>

              {latestExecutions.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    No cron execution logs recorded yet.
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    overflowX: 'auto',
                    border: '1px solid #f1f5f9',
                    borderRadius: 2,
                    '&::-webkit-scrollbar': { height: '6px' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '4px' },
                  }}
                >
                  <Box
                    component="table"
                    sx={{
                      width: '100%',
                      minWidth: 580,
                      borderCollapse: 'collapse',
                      textAlign: 'left',
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Job Name
                        </th>
                        <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Server
                        </th>
                        <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Status
                        </th>
                        <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Started At
                        </th>
                        <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestExecutions.map((exec) => (
                        <tr
                          key={exec._id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '12px 14px', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                            {exec.jobName}
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#475569' }}>
                            {exec.serverName || exec.serverId}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <StatusChip value={exec.status} size="small" />
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>
                            {new Date(exec.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                            {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: PM2 Processes & Active Alerts */}
        <Grid size={{ xs: 12, lg: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Active Alerts Card */}
          <Card
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: activeAlerts && activeAlerts.length > 0 ? '#fca5a5' : 'divider',
              boxShadow: 'none',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsActiveRoundedIcon sx={{ color: 'error.main', fontSize: '1.3rem' }} />
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    Active Alerts
                  </Typography>
                  {activeAlerts && activeAlerts.length > 0 && (
                    <Chip
                      label={activeAlerts.length}
                      size="small"
                      color="error"
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }}
                    />
                  )}
                </Box>
                <Button
                  size="small"
                  variant="text"
                  endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: '0.9rem !important' }} />}
                  onClick={() => onNavigate('alerts')}
                  sx={{ fontWeight: 700, textTransform: 'none', color: 'secondary.main' }}
                >
                  Manage
                </Button>
              </Box>

              {!activeAlerts || activeAlerts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                  <CheckCircleRoundedIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700 }}>
                    All Systems Operational
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Zero unacknowledged alerts active.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {activeAlerts.map((alert) => {
                    const isCritical = alert.severity === 'CRITICAL';
                    const summary = parseAlertSummary(alert.message);
                    return (
                      <Box
                        key={alert._id}
                        sx={{
                          p: 1.75,
                          borderRadius: 2,
                          bgcolor: isCritical ? '#fef2f2' : '#fffbeb',
                          border: '1px solid',
                          borderColor: isCritical ? '#fecaca' : '#fde68a',
                          borderLeft: '4px solid',
                          borderLeftColor: isCritical ? '#ef4444' : '#f59e0b',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          '&:hover': {
                            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                          <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                            <Chip
                              label={alert.severity}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                height: 20,
                                borderRadius: '4px',
                                bgcolor: isCritical ? '#ef4444' : '#f59e0b',
                                color: '#ffffff',
                              }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                              {alert.type}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                            {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>

                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.primary',
                            fontWeight: 600,
                            lineHeight: 1.35,
                            fontSize: '0.85rem',
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            wordBreak: 'break-word',
                          }}
                        >
                          {summary}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<VisibilityOutlinedIcon sx={{ fontSize: '0.85rem !important' }} />}
                            onClick={() => setInspectAlert(alert)}
                            sx={{ p: 0, fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', textTransform: 'none' }}
                          >
                            Inspect Log
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            onClick={() => handleAcknowledge(alert._id)}
                            sx={{
                              fontSize: '0.7rem',
                              py: 0.25,
                              px: 1,
                              borderRadius: '4px',
                              fontWeight: 700,
                              textTransform: 'none',
                              bgcolor: '#ffffff',
                            }}
                          >
                            Resolve
                          </Button>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* PM2 Processes Card */}
          <Card
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <SettingsRoundedIcon sx={{ color: 'primary.main', fontSize: '1.3rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  Active PM2 Daemons
                </Typography>
              </Box>

              {pm2ProcessesList.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
                  No PM2 processes connected.
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
                        borderRadius: 2,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {proc.processName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          {proc.serverName || proc.serverId} {proc.pid ? `• PID: ${proc.pid}` : ''}
                        </Typography>
                      </Box>
                      <StatusChip value={proc.status} size="small" />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Alert Inspection Dialog */}
      <Dialog
        open={Boolean(inspectAlert)}
        onClose={() => setInspectAlert(null)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        {inspectAlert && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StatusChip value={inspectAlert.severity} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {inspectAlert.type} • {inspectAlert.jobName || inspectAlert.serverId}
                </Typography>
              </Box>
              <IconButton onClick={() => setInspectAlert(null)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ py: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Raw Log Message:
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#0f172a',
                  color: '#f8fafc',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '280px',
                }}
              >
                {inspectAlert.message}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
              <Button
                startIcon={<ContentCopyIcon />}
                onClick={() => handleCopyLogs(inspectAlert.message)}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {copied ? 'Copied!' : 'Copy Log'}
              </Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={() => setInspectAlert(null)} sx={{ fontWeight: 600 }}>
                  Close
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleAcknowledge(inspectAlert._id)}
                  sx={{ fontWeight: 700, bgcolor: '#10b981' }}
                >
                  Resolve Alert
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Dashboard;
