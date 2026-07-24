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
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckIcon from '@mui/icons-material/Check';

import { useAlerts, useAcknowledgeAlert } from '../hooks/useAlerts';
import { useAgents } from '../hooks/useAgents';
import type { Alert } from '../types';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import StatusChip from '../components/StatusChip';

export const Alerts: React.FC = () => {
  const userStr = localStorage.getItem('cronwatch_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isReadOnly = user?.role === 'read';

  // Local filters
  const [severity, setSeverity] = useState('');
  const [acknowledged, setAcknowledged] = useState('false'); // Default to unacknowledged (false)
  const [serverId, setServerId] = useState('');

  // Fetch servers for dropdown
  const { data: agents } = useAgents();

  // Fetch alerts
  const { data: alerts, isLoading, refetch } = useAlerts({
    severity: severity || undefined,
    serverId: serverId || undefined,
    acknowledged: acknowledged === 'all' ? undefined : acknowledged === 'true',
    limit: 100,
  });

  const acknowledgeMutation = useAcknowledgeAlert();

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeMutation.mutateAsync(id);
    } catch (e) {
      console.error('Failed to acknowledge alert', e);
    }
  };

  const handleResetFilters = () => {
    setSeverity('');
    setAcknowledged('false');
    setServerId('');
  };

  const columns: Column<Alert>[] = [
    {
      id: 'severity',
      label: 'Severity',
      sortable: true,
      render: (row) => <StatusChip value={row.severity} />,
    },
    {
      id: 'type',
      label: 'Alert Type',
      sortable: true,
      render: (row) => (
        <Chip
          label={row.type}
          size="small"
          sx={{ fontWeight: 600, bgcolor: 'action.selected', color: 'text.primary', borderRadius: '4px' }}
        />
      ),
    },
    {
      id: 'server',
      label: 'Server / Job',
      render: (row) => {
        const agentName = agents?.find(a => a.serverId === row.serverId)?.serverName || row.serverId;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {agentName}
            </Typography>
            {row.jobName && (
              <Typography variant="caption" sx={{ color: 'secondary.main', display: 'block', fontWeight: 500 }}>
                Job: {row.jobName}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      id: 'message',
      label: 'Description',
      render: (row) => (
        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, maxWidth: '400px' }}>
          {row.message}
        </Typography>
      ),
    },
    {
      id: 'createdAt',
      label: 'Detected At',
      sortable: true,
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <Chip
          label={row.acknowledged ? 'Acknowledged' : 'Active'}
          color={row.acknowledged ? 'default' : 'error'}
          size="small"
          variant={row.acknowledged ? 'filled' : 'outlined'}
          sx={{ fontWeight: 600, borderRadius: '4px' }}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Action',
      render: (row) => {
        if (row.acknowledged) {
          return null;
        }
        return (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<CheckIcon />}
            onClick={() => handleAcknowledge(row._id)}
            disabled={acknowledgeMutation.isPending || isReadOnly}
            sx={{
              py: 0.5,
              px: 1.5,
              fontSize: '0.75rem',
              bgcolor: 'success.main',
              '&:hover': { bgcolor: 'success.dark' },
            }}
          >
            Resolve
          </Button>
        );
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Alerts"
        subtitle="Active infrastructure warnings and job failures requiring intervention"
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

      {/* Filters Card */}
      <Card sx={{ mb: 4, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                select
                label="Acknowledgment Status"
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

            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                select
                label="Severity"
                variant="outlined"
                size="small"
                fullWidth
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <MenuItem value="">All Severities</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
                <MenuItem value="WARNING">Warning</MenuItem>
                <MenuItem value="INFO">Info</MenuItem>
              </TextField>
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

      {/* Alerts Table */}
      <DataTable
        columns={columns}
        data={alerts || []}
        loading={isLoading}
        emptyTitle="No Alerts Active"
        emptyDescription="All systems are green! No unacknowledged alerts found matching the active criteria."
        emptyActionLabel="Clear Filters"
        onEmptyAction={handleResetFilters}
      />
    </Box>
  );
};

export default Alerts;
