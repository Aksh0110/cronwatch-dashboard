import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';

import { useAlerts, useAcknowledgeAlert, useAcknowledgeAllAlerts } from '../hooks/useAlerts';
import { useAgents } from '../hooks/useAgents';
import type { Alert } from '../types';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import StatusChip from '../components/StatusChip';

// Helper to parse complex PM2 / JSON alert messages into clean readable titles & payloads
function parseAlertMessage(rawMessage: string): { summary: string; jsonPayload?: any; rawSnippet: string } {
  if (!rawMessage) return { summary: 'No message provided', rawSnippet: '' };

  let summary = rawMessage;
  let jsonPayload: any = undefined;

  // Check if there is an embedded JSON object inside the message
  const jsonMatch = rawMessage.match(/\{[\s\S]*\}$/);
  if (jsonMatch) {
    try {
      jsonPayload = JSON.parse(jsonMatch[0]);
    } catch {
      // not valid JSON, ignore
    }
  }

  // Look for common patterns like "Recurring payment failed:" or "Error executing..."
  if (jsonPayload && jsonPayload.description) {
    const prefix = rawMessage.split(/\{/)[0].replace(/[\w\d\-_]+\[.*?\]:?/g, '').trim();
    summary = prefix ? `${prefix} - ${jsonPayload.description}` : jsonPayload.description;
  } else if (rawMessage.includes('error [') || rawMessage.includes('Error:')) {
    // Strip timestamps like "2026-09-28 18:50:52 error"
    const cleaned = rawMessage.replace(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+(error|warn|info)?\s*/i, '');
    const beforeJson = cleaned.split(/\{/)[0].trim();
    summary = beforeJson || cleaned.substring(0, 140);
  } else if (rawMessage.length > 140) {
    summary = rawMessage.substring(0, 140) + '...';
  }

  // Clean trailing punctuation / colons
  summary = summary.replace(/:\s*$/, '').trim();

  return {
    summary: summary || 'Alert triggered',
    jsonPayload,
    rawSnippet: rawMessage,
  };
}

export const Alerts: React.FC = () => {
  const userStr = localStorage.getItem('cronwatch_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isReadOnly = user?.role === 'read';

  // Local filters
  const [jobName, setJobName] = useState('');
  const [debouncedJobName, setDebouncedJobName] = useState('');
  const [severity, setSeverity] = useState('');
  const [alertType, setAlertType] = useState('');
  const [acknowledged, setAcknowledged] = useState('false'); // Default to unacknowledged (false)
  const [serverId, setServerId] = useState('');

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedJobName(jobName);
    }, 300);
    return () => clearTimeout(handler);
  }, [jobName]);

  // Selected alert for Inspection Dialog
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch servers for dropdown
  const { data: agents } = useAgents();

  // Fetch alerts
  const { data: alerts, isLoading, refetch } = useAlerts({
    severity: severity || undefined,
    serverId: serverId || undefined,
    jobName: debouncedJobName.trim() || undefined,
    type: alertType || undefined,
    acknowledged: acknowledged === 'all' ? undefined : (acknowledged === 'true' ? true : false),
    limit: 100,
  });

  const acknowledgeMutation = useAcknowledgeAlert();
  const acknowledgeAllMutation = useAcknowledgeAllAlerts();

  const [resolveAllDialogOpen, setResolveAllDialogOpen] = useState(false);
  const [resolveScope, setResolveScope] = useState<'all' | 'server'>('all');
  const [resolveSuccessMsg, setResolveSuccessMsg] = useState<string | null>(null);

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeMutation.mutateAsync(id);
      if (selectedAlert && selectedAlert._id === id) {
        setSelectedAlert({ ...selectedAlert, acknowledged: true });
      }
    } catch (e) {
      console.error('Failed to acknowledge alert', e);
    }
  };

  const handleResolveAll = async () => {
    try {
      const targetServerId = resolveScope === 'server' && serverId ? serverId : undefined;
      const res = await acknowledgeAllMutation.mutateAsync(targetServerId);
      setResolveAllDialogOpen(false);
      const count = res?.modifiedCount ?? 0;
      setResolveSuccessMsg(`Successfully marked ${count} alert${count === 1 ? '' : 's'} as resolved.`);
      setTimeout(() => setResolveSuccessMsg(null), 4000);
      if (selectedAlert) {
        setSelectedAlert({ ...selectedAlert, acknowledged: true });
      }
    } catch (e) {
      console.error('Failed to resolve all alerts', e);
    }
  };

  const handleResetFilters = () => {
    setJobName('');
    setDebouncedJobName('');
    setSeverity('');
    setAlertType('');
    setAcknowledged('false');
    setServerId('');
  };

  const handleCopyLogs = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const columns: Column<Alert>[] = [
    {
      id: 'severity',
      label: 'Severity',
      sortable: true,
      width: 110,
      noWrap: true,
      render: (row) => <StatusChip value={row.severity} />,
    },
    {
      id: 'type',
      label: 'Alert Type',
      sortable: true,
      width: 130,
      noWrap: true,
      render: (row) => (
        <Chip
          label={row.type}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            bgcolor: 'action.hover',
            color: 'text.primary',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
          }}
        />
      ),
    },
    {
      id: 'server',
      label: 'Server / Job',
      width: 180,
      render: (row) => {
        const agentName = agents?.find((a) => a.serverId === row.serverId)?.serverName || row.serverId;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {agentName}
            </Typography>
            {row.jobName && (
              <Typography
                variant="caption"
                sx={{
                  color: 'secondary.main',
                  display: 'inline-block',
                  fontWeight: 600,
                  bgcolor: '#f0f9ff',
                  px: 0.75,
                  py: 0.2,
                  borderRadius: 1,
                  border: '1px solid #bae6fd',
                  mt: 0.25,
                }}
              >
                {row.jobName}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      id: 'message',
      label: 'Description',
      minWidth: 260,
      render: (row) => {
        const parsed = parseAlertMessage(row.message);
        return (
          <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.primary',
                fontWeight: 600,
                lineHeight: 1.4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word',
              }}
            >
              {parsed.summary}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Button
                size="small"
                variant="text"
                startIcon={<VisibilityOutlinedIcon sx={{ fontSize: '0.9rem !important' }} />}
                onClick={() => setSelectedAlert(row)}
                sx={{
                  p: 0,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'secondary.main',
                  minWidth: 'auto',
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                }}
              >
                View Full Log & Details
              </Button>
            </Box>
          </Box>
        );
      },
    },
    {
      id: 'createdAt',
      label: 'Detected At',
      sortable: true,
      width: 150,
      noWrap: true,
      render: (row) => (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
          {new Date(row.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          <br />
          <span style={{ fontWeight: 600, color: '#0f172a' }}>
            {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      width: 110,
      noWrap: true,
      render: (row) => (
        <Chip
          label={row.acknowledged ? 'Resolved' : 'Active'}
          color={row.acknowledged ? 'default' : 'error'}
          size="small"
          variant={row.acknowledged ? 'outlined' : 'filled'}
          sx={{
            fontWeight: 700,
            borderRadius: '6px',
            fontSize: '0.75rem',
            height: 24,
            ...(row.acknowledged
              ? { bgcolor: '#f1f5f9', color: '#64748b' }
              : { bgcolor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }),
          }}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Action',
      width: 110,
      noWrap: true,
      render: (row) => {
        if (row.acknowledged) {
          return (
            <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
              Resolved
            </Typography>
          );
        }
        return (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={() => handleAcknowledge(row._id)}
            disabled={acknowledgeMutation.isPending || isReadOnly}
            sx={{
              py: 0.5,
              px: 1.25,
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '6px',
              bgcolor: '#10b981',
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#059669' },
            }}
          >
            Resolve
          </Button>
        );
      },
    },
  ];

  // Mobile Card Renderer for phone screens
  const renderMobileCard = (alert: Alert) => {
    const agentName = agents?.find((a) => a.serverId === alert.serverId)?.serverName || alert.serverId;
    const parsed = parseAlertMessage(alert.message);
    const isCritical = alert.severity === 'CRITICAL';

    return (
      <Card
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: isCritical ? '#fca5a5' : 'divider',
          bgcolor: 'background.paper',
          p: 2,
          boxShadow: isCritical ? '0 2px 8px -2px rgba(239, 68, 68, 0.15)' : 'none',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <StatusChip value={alert.severity} size="small" />
            <Chip
              label={alert.type}
              size="small"
              sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22, borderRadius: '4px' }}
            />
          </Box>
          <Chip
            label={alert.acknowledged ? 'Resolved' : 'Active'}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.7rem',
              height: 22,
              borderRadius: '4px',
              bgcolor: alert.acknowledged ? '#f1f5f9' : '#fee2e2',
              color: alert.acknowledged ? '#64748b' : '#b91c1c',
            }}
          />
        </Box>

        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
            <DnsOutlinedIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {agentName}
            </Typography>
            {alert.jobName && (
              <Chip
                label={alert.jobName}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#f0f9ff', color: '#0369a1' }}
              />
            )}
          </Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: 'text.primary',
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}
          >
            {parsed.summary}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 1.5,
            borderTop: '1px solid #f1f5f9',
            mt: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeOutlinedIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {new Date(alert.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSelectedAlert(alert)}
              sx={{ fontSize: '0.75rem', py: 0.4, px: 1, borderRadius: '6px' }}
            >
              Details
            </Button>
            {!alert.acknowledged && (
              <Button
                size="small"
                variant="contained"
                color="success"
                onClick={() => handleAcknowledge(alert._id)}
                disabled={acknowledgeMutation.isPending || isReadOnly}
                sx={{ fontSize: '0.75rem', py: 0.4, px: 1.25, borderRadius: '6px', bgcolor: '#10b981' }}
              >
                Resolve
              </Button>
            )}
          </Box>
        </Box>
      </Card>
    );
  };

  const parsedSelected = selectedAlert ? parseAlertMessage(selectedAlert.message) : null;
  const selectedAgent = agents?.find((a) => a.serverId === selectedAlert?.serverId);

  return (
    <Box>
      <PageHeader
        title="Alerts Center"
        subtitle="Active infrastructure warnings and job failures requiring intervention"
        action={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            {!isReadOnly && (
              <Button
                variant="contained"
                startIcon={<DoneAllIcon />}
                onClick={() => {
                  setResolveScope(serverId ? 'server' : 'all');
                  setResolveAllDialogOpen(true);
                }}
                disabled={acknowledgeAllMutation.isPending}
                sx={{
                  borderRadius: '8px',
                  fontWeight: 600,
                  bgcolor: '#059669',
                  '&:hover': { bgcolor: '#047857' },
                }}
              >
                Resolve All Alerts
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', fontWeight: 600 }}
            >
              Refresh Alerts
            </Button>
          </Box>
        }
      />

      {resolveSuccessMsg && (
        <Box
          sx={{
            mb: 2.5,
            p: 2,
            bgcolor: '#ecfdf5',
            border: '1px solid #6ee7b7',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            color: '#065f46',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.08)',
          }}
        >
          <CheckCircleOutlineIcon sx={{ color: '#059669' }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {resolveSuccessMsg}
          </Typography>
        </Box>
      )}

      {/* Filters Card */}
      <Card
        sx={{
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterAltOutlinedIcon sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Filter Active & Historical Alerts
            </Typography>
          </Box>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Search Job / Message"
                variant="outlined"
                size="small"
                fullWidth
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="e.g. Emandate, Reminder..."
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.25 }}>
              <TextField
                select
                label="Status"
                variant="outlined"
                size="small"
                fullWidth
                value={acknowledged}
                onChange={(e) => setAcknowledged(e.target.value)}
              >
                <MenuItem value="false">Active Alerts Only</MenuItem>
                <MenuItem value="true">Resolved Alerts Only</MenuItem>
                <MenuItem value="all">All Alerts</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.25 }}>
              <TextField
                select
                label="Server"
                variant="outlined"
                size="small"
                fullWidth
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
              >
                <MenuItem value="">All Servers</MenuItem>
                {agents?.map((agent) => (
                  <MenuItem key={agent.serverId} value={agent.serverId}>
                    {agent.serverName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                select
                label="Alert Type"
                variant="outlined"
                size="small"
                fullWidth
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="JOB_FAILED">Job Failed</MenuItem>
                <MenuItem value="HEARTBEAT_LOST">Heartbeat Lost</MenuItem>
                <MenuItem value="PROCESS_DOWN">Process Down</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
              <TextField
                select
                label="Severity"
                variant="outlined"
                size="small"
                fullWidth
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
                <MenuItem value="WARNING">Warning</MenuItem>
                <MenuItem value="INFO">Info</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 1 }}>
              <Button
                variant="text"
                color="secondary"
                onClick={handleResetFilters}
                sx={{ fontWeight: 700, textTransform: 'none', whiteSpace: 'nowrap' }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Alerts Table & Mobile Cards */}
      <DataTable
        columns={columns}
        data={alerts || []}
        loading={isLoading}
        emptyTitle="No Alerts Active"
        emptyDescription="All systems are green! No unacknowledged alerts found matching the active criteria."
        emptyActionLabel="Clear Filters"
        onEmptyAction={handleResetFilters}
        minWidth={980}
        renderMobileCard={renderMobileCard}
      />

      {/* Alert Details Inspection Dialog */}
      <Dialog
        open={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 },
          },
        }}
      >
        {selectedAlert && (
          <>
            <DialogTitle
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                pb: 1,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.75 }}>
                  <StatusChip value={selectedAlert.severity} />
                  <Chip
                    label={selectedAlert.type}
                    size="small"
                    sx={{ fontWeight: 600, fontSize: '0.75rem', borderRadius: '4px' }}
                  />
                  <Chip
                    label={selectedAlert.acknowledged ? 'Resolved' : 'Active'}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      borderRadius: '4px',
                      bgcolor: selectedAlert.acknowledged ? '#f1f5f9' : '#fee2e2',
                      color: selectedAlert.acknowledged ? '#64748b' : '#b91c1c',
                    }}
                  />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {parsedSelected?.summary}
                </Typography>
              </Box>
              <IconButton onClick={() => setSelectedAlert(null)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ py: 2 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      SERVER / HOST
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {selectedAgent?.serverName || selectedAlert.serverId}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      ID: {selectedAlert.serverId} • Env: {selectedAgent?.environment || 'production'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      JOB & DETECTION TIME
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {selectedAlert.jobName || 'System Service'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {new Date(selectedAlert.createdAt).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* JSON structured parameters if available */}
              {parsedSelected?.jsonPayload && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                    Parsed Error Attributes
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: '#fafafa',
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 1.5,
                    }}
                  >
                    {Object.entries(parsedSelected.jsonPayload)
                      .filter(([_, v]) => typeof v === 'string' || typeof v === 'number')
                      .map(([key, value]) => (
                        <Box key={key}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {key.toUpperCase()}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all' }}>
                            {String(value)}
                          </Typography>
                        </Box>
                      ))}
                  </Paper>
                </Box>
              )}

              {/* Full Raw Message Container */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Full Raw Error Log & Payload
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<ContentCopyIcon sx={{ fontSize: '0.85rem !important' }} />}
                    onClick={() => handleCopyLogs(selectedAlert.message)}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    {copied ? 'Copied!' : 'Copy Log'}
                  </Button>
                </Box>
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
                    maxHeight: '260px',
                    border: '1px solid #1e293b',
                  }}
                >
                  {selectedAlert.message}
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
              <Button onClick={() => setSelectedAlert(null)} color="inherit" sx={{ fontWeight: 600 }}>
                Close
              </Button>
              {!selectedAlert.acknowledged && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleOutlineIcon />}
                  onClick={() => handleAcknowledge(selectedAlert._id)}
                  disabled={acknowledgeMutation.isPending || isReadOnly}
                  sx={{ fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                >
                  Mark as Resolved
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Resolve All Confirmation Dialog */}
      <Dialog
        open={resolveAllDialogOpen}
        onClose={() => !acknowledgeAllMutation.isPending && setResolveAllDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DoneAllIcon fontSize="small" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Resolve All Alerts
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setResolveAllDialogOpen(false)}
            disabled={acknowledgeAllMutation.isPending}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.primary', mb: 2 }}>
            Are you sure you want to mark active alerts as <strong>Resolved</strong>? This will acknowledge all currently unresolved alerts.
          </Typography>

          {serverId && (
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1, textTransform: 'uppercase' }}>
                Resolution Scope
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  size="small"
                  variant={resolveScope === 'server' ? 'contained' : 'outlined'}
                  onClick={() => setResolveScope('server')}
                  sx={{
                    borderRadius: '6px',
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: resolveScope === 'server' ? '#059669' : 'transparent',
                    '&:hover': { bgcolor: resolveScope === 'server' ? '#047857' : undefined },
                  }}
                >
                  Selected Server ({agents?.find(a => a.serverId === serverId)?.serverName || serverId})
                </Button>
                <Button
                  size="small"
                  variant={resolveScope === 'all' ? 'contained' : 'outlined'}
                  onClick={() => setResolveScope('all')}
                  sx={{
                    borderRadius: '6px',
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: resolveScope === 'all' ? '#059669' : 'transparent',
                    '&:hover': { bgcolor: resolveScope === 'all' ? '#047857' : undefined },
                  }}
                >
                  All Servers
                </Button>
              </Box>
            </Box>
          )}

          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
            Resolved alerts remain archived and can be viewed anytime by selecting the &ldquo;Resolved&rdquo; filter.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setResolveAllDialogOpen(false)}
            color="inherit"
            disabled={acknowledgeAllMutation.isPending}
            sx={{ fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleResolveAll}
            disabled={acknowledgeAllMutation.isPending}
            startIcon={<DoneAllIcon />}
            sx={{
              fontWeight: 700,
              bgcolor: '#059669',
              '&:hover': { bgcolor: '#047857' },
              borderRadius: '8px',
            }}
          >
            {acknowledgeAllMutation.isPending ? 'Resolving...' : 'Confirm Resolve All'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Alerts;
