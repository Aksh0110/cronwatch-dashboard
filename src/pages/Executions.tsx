import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import TerminalIcon from '@mui/icons-material/Terminal';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';

import { useExecutions } from '../hooks/useExecutions';
import { useAgents } from '../hooks/useAgents';
import type { Execution } from '../types';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import StatusChip from '../components/StatusChip';

export const Executions: React.FC = () => {
  // Local filters
  const [jobName, setJobName] = useState('');
  const [debouncedJobName, setDebouncedJobName] = useState('');
  const [serverId, setServerId] = useState('');
  const [status, setStatus] = useState('');

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedJobName(jobName);
    }, 300);
    return () => clearTimeout(handler);
  }, [jobName]);

  // Selected execution for log viewer Dialog
  const [selectedExec, setSelectedExec] = useState<Execution | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch agents for dropdown
  const { data: agents } = useAgents();

  const { data: executions, isLoading, refetch } = useExecutions({
    jobName: debouncedJobName.trim() || undefined,
    serverId: serverId || undefined,
    status: status || undefined,
    limit: 100,
  });

  const handleResetFilters = () => {
    setJobName('');
    setDebouncedJobName('');
    setServerId('');
    setStatus('');
  };

  const handleOpenLogs = (exec: Execution) => {
    setSelectedExec(exec);
  };

  const handleCloseLogs = () => {
    setSelectedExec(null);
  };

  const handleCopyLogs = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDuration = (ms: number | undefined) => {
    if (ms === undefined) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const columns: Column<Execution>[] = [
    {
      id: 'jobName',
      label: 'Job Name',
      sortable: true,
      minWidth: 200,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
          {row.jobName}
        </Typography>
      ),
    },
    {
      id: 'serverName',
      label: 'Server Host',
      sortable: true,
      width: 170,
      noWrap: true,
      render: (row) => (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {row.serverName || row.serverId}
        </Typography>
      ),
    },
    {
      id: 'environment',
      label: 'Environment',
      sortable: true,
      width: 130,
      noWrap: true,
      render: (row) => {
        const env = row.environment || 'production';
        return (
          <Chip
            label={env.toUpperCase()}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.7rem',
              height: 22,
              borderRadius: '4px',
              bgcolor: env === 'production' ? '#fef2f2' : env === 'staging' ? '#fffbeb' : '#f0f9ff',
              color: env === 'production' ? '#b91c1c' : env === 'staging' ? '#b45309' : '#0369a1',
              border: '1px solid',
              borderColor: env === 'production' ? '#fecaca' : env === 'staging' ? '#fde68a' : '#bae6fd',
            }}
          />
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      width: 120,
      noWrap: true,
      render: (row) => <StatusChip value={row.status} size="small" />,
    },
    {
      id: 'startedAt',
      label: 'Started At',
      sortable: true,
      width: 160,
      noWrap: true,
      render: (row) => (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
          {new Date(row.startedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
          <span style={{ fontWeight: 600, color: '#0f172a' }}>
            {new Date(row.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </Typography>
      ),
    },
    {
      id: 'duration',
      label: 'Duration',
      sortable: true,
      width: 110,
      noWrap: true,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
          {formatDuration(row.duration)}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Logs',
      width: 80,
      noWrap: true,
      align: 'center',
      render: (row) => (
        <Tooltip title="View Execution Output">
          <IconButton
            size="small"
            onClick={() => handleOpenLogs(row)}
            sx={{
              bgcolor: '#f1f5f9',
              borderRadius: '6px',
              '&:hover': { bgcolor: '#e2e8f0', color: 'primary.main' },
            }}
          >
            <TerminalIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  // Mobile card renderer for small screens
  const renderMobileCard = (row: Execution) => {
    return (
      <Card
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          p: 2,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
            {row.jobName}
          </Typography>
          <StatusChip value={row.status} size="small" />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <DnsOutlinedIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {row.serverName || row.serverId}
          </Typography>
          <Chip
            label={(row.environment || 'production').toUpperCase()}
            size="small"
            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 1.5,
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeOutlinedIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {new Date(row.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
              {formatDuration(row.duration)}
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<TerminalIcon sx={{ fontSize: '0.85rem !important' }} />}
            onClick={() => handleOpenLogs(row)}
            sx={{ fontSize: '0.75rem', py: 0.25, px: 1, borderRadius: '6px' }}
          >
            Output
          </Button>
        </Box>
      </Card>
    );
  };

  return (
    <Box>
      <PageHeader
        title="Execution History"
        subtitle="Complete chronological audit trail and status reports of all PM2 cron runs"
        action={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            sx={{ borderRadius: '8px', fontWeight: 600 }}
          >
            Refresh Logs
          </Button>
        }
      />

      {/* Filter panel */}
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
              Filter Executions
            </Typography>
          </Box>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                label="Job Name"
                variant="outlined"
                size="small"
                fullWidth
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="Search job name..."
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
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

            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                select
                label="Status"
                variant="outlined"
                size="small"
                fullWidth
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="SUCCESS">Success</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="SKIPPED">Skipped</MenuItem>
                <MenuItem value="RUNNING">Running</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                variant="text"
                color="secondary"
                onClick={handleResetFilters}
                sx={{ fontWeight: 600, textTransform: 'none' }}
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Executions Table */}
      <DataTable
        columns={columns}
        data={executions || []}
        loading={isLoading}
        emptyTitle="No Execution Logs Found"
        emptyDescription="No execution records match the specified filters."
        emptyActionLabel="Clear Filters"
        onEmptyAction={handleResetFilters}
        minWidth={880}
        renderMobileCard={renderMobileCard}
      />

      {/* Terminal Log Dialog */}
      <Dialog
        open={Boolean(selectedExec)}
        onClose={handleCloseLogs}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 },
          },
        }}
      >
        {selectedExec && (
          <>
            <DialogTitle
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TerminalIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {selectedExec.jobName}
                </Typography>
                <StatusChip value={selectedExec.status} size="small" />
              </Box>
              <IconButton onClick={handleCloseLogs} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  <strong>Server:</strong> {selectedExec.serverName || selectedExec.serverId}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  <strong>Environment:</strong> {selectedExec.environment || 'production'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  <strong>Duration:</strong> {formatDuration(selectedExec.duration)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  <strong>Started:</strong> {new Date(selectedExec.startedAt).toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Captured Process Output:
                </Typography>
                {selectedExec.message && (
                  <Button
                    size="small"
                    startIcon={<ContentCopyIcon sx={{ fontSize: '0.85rem !important' }} />}
                    onClick={() => handleCopyLogs(selectedExec.message || '')}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                )}
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
                  maxHeight: '340px',
                  border: '1px solid #1e293b',
                }}
              >
                {selectedExec.message || 'No additional stdout or stderr logs captured for this execution.'}
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleCloseLogs} sx={{ fontWeight: 600 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Executions;
