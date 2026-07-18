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
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import TerminalIcon from '@mui/icons-material/Terminal';

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
  const [serverId, setServerId] = useState('');
  const [status, setStatus] = useState('');

  // Selected execution for log viewer Dialog
  const [selectedExec, setSelectedExec] = useState<Execution | null>(null);

  // Fetch agents for dropdown
  const { data: agents } = useAgents();
  
  // Fetch filtered executions
  const { data: executions, isLoading, refetch } = useExecutions({
    jobName: jobName || undefined,
    serverId: serverId || undefined,
    status: status || undefined,
    limit: 100,
  });

  const handleResetFilters = () => {
    setJobName('');
    setServerId('');
    setStatus('');
  };

  const handleOpenLogs = (exec: Execution) => {
    setSelectedExec(exec);
  };

  const handleCloseLogs = () => {
    setSelectedExec(null);
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
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.dark' }}>
          {row.jobName}
        </Typography>
      ),
    },
    {
      id: 'serverName',
      label: 'Server',
      sortable: true,
      render: (row) => row.serverName || row.serverId,
    },
    {
      id: 'environment',
      label: 'Environment',
      sortable: true,
      render: (row) => row.environment || 'production',
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusChip value={row.status} />,
    },
    {
      id: 'startedAt',
      label: 'Started At',
      sortable: true,
      render: (row) => new Date(row.startedAt).toLocaleString(),
    },
    {
      id: 'duration',
      label: 'Duration',
      sortable: true,
      render: (row) => formatDuration(row.duration),
    },
    {
      id: 'actions',
      label: 'Logs',
      render: (row) => (
        <IconButton size="small" onClick={() => handleOpenLogs(row)} title="View logs">
          <TerminalIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Executions"
        subtitle="Historical logs and statuses of monitored cron jobs"
        action={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        }
      />

      {/* Filter panel */}
      <Card sx={{ mb: 4, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                label="Job Name"
                variant="outlined"
                size="small"
                fullWidth
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="Search job..."
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
                <MenuItem value="RUNNING">Running</MenuItem>
                <MenuItem value="STARTED">Started</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                variant="text"
                color="secondary"
                onClick={handleResetFilters}
                sx={{ fontWeight: 600 }}
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
        emptyTitle="No Executions Found"
        emptyDescription="No cron execution logs found matching your filters. Ensure your agents are active and running cron jobs."
        emptyActionLabel="Clear Filters"
        onEmptyAction={handleResetFilters}
      />

      {/* Log Viewer Dialog */}
      <Dialog
        open={!!selectedExec}
        onClose={handleCloseLogs}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: {
            sx: { borderRadius: 2 }
          }
        }}
      >
        {selectedExec && (
          <>
            <DialogTitle
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2.5,
                bgcolor: 'background.default',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {selectedExec.jobName}
                  <StatusChip value={selectedExec.status} size="small" />
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Execution ID: {selectedExec._id}
                </Typography>
              </Box>
              <IconButton onClick={handleCloseLogs}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ p: 3 }}>
              {/* Meta row */}
              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Server Host
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedExec.serverName || selectedExec.serverId}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Process Name
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedExec.processName || '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Duration
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatDuration(selectedExec.duration)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Started At
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {new Date(selectedExec.startedAt).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              {selectedExec.message && (
                <Box sx={{ mb: 3, p: 2, bgcolor: selectedExec.status === 'FAILED' ? 'error.light' : 'info.light', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: selectedExec.status === 'FAILED' ? 'error.dark' : 'info.dark', display: 'block' }}>
                    {selectedExec.status === 'FAILED' ? 'Error Message' : 'Output Summary'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', mt: 0.5 }}>
                    {selectedExec.message}
                  </Typography>
                </Box>
              )}

              {selectedExec.matchedRule && (
                <Box sx={{ mb: 3, px: 2, py: 1, border: '1px solid #e2e8f0', borderRadius: 1, display: 'inline-block' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Matched Alerting Rule:{' '}
                    <span style={{ fontWeight: 600, color: '#0284c7' }}>{selectedExec.matchedRule}</span>
                  </Typography>
                </Box>
              )}

              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Console Output
              </Typography>
              <Box
                sx={{
                  bgcolor: '#0f172a',
                  color: '#f8fafc',
                  p: 2.5,
                  borderRadius: 1,
                  fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
                  fontSize: '0.85rem',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '350px',
                  overflowY: 'auto',
                  border: '1px solid #334155',
                }}
              >
                {selectedExec.rawLog || 'No console output captured.'}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Executions;
