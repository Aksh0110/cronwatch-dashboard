import axios from 'axios';
import type { Agent, Execution, Alert, DashboardStats, GetExecutionsParams, GetAlertsParams } from '../types';

// API client pointing to NestJS backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// Flag to check if we are using mock fallback
let isOfflineMode = false;

export const getOfflineModeStatus = () => isOfflineMode;

// Rich mock data for demo / offline fallback
const MOCK_AGENTS: Agent[] = [
  {
    _id: 'a1',
    serverId: 'srv-aws-prod-01',
    serverName: 'AWS Prod API',
    hostname: 'api-prod-01.us-east-1.compute.internal',
    ipAddress: '54.210.12.83',
    environment: 'production',
    backend: 'nestjs-core',
    status: 'ONLINE',
    lastHeartbeat: new Date().toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'a2',
    serverId: 'srv-aws-prod-worker',
    serverName: 'AWS Prod Worker',
    hostname: 'worker-prod-02.us-east-1.compute.internal',
    ipAddress: '54.210.15.190',
    environment: 'production',
    backend: 'bullmq-worker',
    status: 'ONLINE',
    lastHeartbeat: new Date().toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'a3',
    serverId: 'srv-aws-staging-01',
    serverName: 'AWS Staging App',
    hostname: 'api-staging.us-east-1.compute.internal',
    ipAddress: '34.200.45.22',
    environment: 'staging',
    backend: 'nestjs-core',
    status: 'ONLINE',
    lastHeartbeat: new Date(Date.now() - 45 * 1000).toISOString(), // recent heartbeat
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'a4',
    serverId: 'srv-gcp-dev-01',
    serverName: 'GCP Dev Server',
    hostname: 'dev-vm-01.c.hoora-dev.internal',
    ipAddress: '35.224.118.9',
    environment: 'development',
    backend: 'express-test',
    status: 'OFFLINE',
    lastHeartbeat: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // > 5 mins ago
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const MOCK_EXECUTIONS: Execution[] = [
  {
    _id: 'e1',
    serverId: 'srv-aws-prod-worker',
    serverName: 'AWS Prod Worker',
    backend: 'bullmq-worker',
    environment: 'production',
    hostname: 'worker-prod-02.us-east-1.compute.internal',
    jobName: 'SendWeeklyNewsletters',
    status: 'RUNNING',
    startedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    processName: 'pm2-worker',
    timestamp: new Date().toISOString(),
    rawLog: '[2026-07-18 21:40:02] Starting Newsletter dispatch\n[2026-07-18 21:41:15] Processed 4500/10000 emails...',
    matchedRule: 'newsletter-rule',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'e2',
    serverId: 'srv-aws-prod-01',
    serverName: 'AWS Prod API',
    backend: 'nestjs-core',
    environment: 'production',
    hostname: 'api-prod-01.us-east-1.compute.internal',
    jobName: 'DatabaseBackup',
    status: 'SUCCESS',
    startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
    duration: 60000,
    message: 'Backup completed successfully. Size: 1.2 GB',
    processName: 'pm2-cron',
    timestamp: new Date().toISOString(),
    rawLog: 'pg_dump starting...\nbackup writing to s3://cronwatch-backups/db-backup-20260718.sql\nS3 upload successful\nBackup ended.',
    matchedRule: 'backup-success-rule',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'e3',
    serverId: 'srv-aws-prod-01',
    serverName: 'AWS Prod API',
    backend: 'nestjs-core',
    environment: 'production',
    hostname: 'api-prod-01.us-east-1.compute.internal',
    jobName: 'ProcessPendingOrders',
    status: 'SUCCESS',
    startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 14.8 * 60 * 1000).toISOString(),
    duration: 12000,
    message: 'Processed 24 pending orders.',
    processName: 'pm2-cron',
    timestamp: new Date().toISOString(),
    rawLog: 'Scanning table for pending orders...\nFound 24 orders. Processing batch...\nUpdated order statuses.\nDone.',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'e4',
    serverId: 'srv-aws-prod-worker',
    serverName: 'AWS Prod Worker',
    backend: 'bullmq-worker',
    environment: 'production',
    hostname: 'worker-prod-02.us-east-1.compute.internal',
    jobName: 'StripePayoutSync',
    status: 'FAILED',
    startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 44.5 * 60 * 1000).toISOString(),
    duration: 30000,
    message: 'Error: Connection timeout to api.stripe.com. Gateway unreachable.',
    processName: 'pm2-worker',
    timestamp: new Date().toISOString(),
    rawLog: 'Connecting to Stripe API...\nError: Connection timed out after 30 seconds at StripeClient.request (node_modules/stripe/lib/StripeResource.js:145:15)\nat processTicksAndRejections (node:internal/process/task_queues:95:5)',
    matchedRule: 'stripe-sync-error',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'e5',
    serverId: 'srv-aws-staging-01',
    serverName: 'AWS Staging App',
    backend: 'nestjs-core',
    environment: 'staging',
    hostname: 'api-staging.us-east-1.compute.internal',
    jobName: 'RefreshCache',
    status: 'SUCCESS',
    startedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 59.9 * 60 * 1000).toISOString(),
    duration: 6000,
    message: 'Redis cache flushed and updated.',
    processName: 'pm2-dev-cron',
    timestamp: new Date().toISOString(),
    rawLog: 'Connecting to Redis...\nFlushing keys...\nRebuilding product catalog cache...\nRebuilding categories cache...\nDone.',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'e6',
    serverId: 'srv-gcp-dev-01',
    serverName: 'GCP Dev Server',
    backend: 'express-test',
    environment: 'development',
    hostname: 'dev-vm-01.c.hoora-dev.internal',
    jobName: 'CleanupTemporaryUploads',
    status: 'SUCCESS',
    startedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1.95 * 3600 * 1000).toISOString(),
    duration: 180000,
    message: 'Deleted 142 expired temporary files.',
    processName: 'node-cron',
    timestamp: new Date().toISOString(),
    rawLog: 'Starting cleanup...\nScanning uploads folder...\nFound 142 files older than 24 hours.\nDeleting tmp_382103810.pdf...\nDeleting tmp_832103812.jpg...\nCleanup completed.',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'e7',
    serverId: 'srv-aws-prod-01',
    serverName: 'AWS Prod API',
    backend: 'nestjs-core',
    environment: 'production',
    hostname: 'api-prod-01.us-east-1.compute.internal',
    jobName: 'StripePayoutSync',
    status: 'SUCCESS',
    startedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 3.98 * 3600 * 1000).toISOString(),
    duration: 72000,
    message: 'Sync succeeded. Reconciled 15 transactions.',
    processName: 'pm2-cron',
    timestamp: new Date().toISOString(),
    rawLog: 'Initiating payout sync...\nFetched payouts from Stripe.\nMatching database transactions...\nSync completed.',
    createdAt: new Date().toISOString(),
  },
];

let MOCK_ALERTS: Alert[] = [
  {
    _id: 'al-01',
    type: 'JOB_FAILED',
    serverId: 'srv-aws-prod-worker',
    jobName: 'StripePayoutSync',
    message: 'Job "StripePayoutSync" failed on "AWS Prod Worker" (production): Error: Connection timeout to api.stripe.com.',
    severity: 'CRITICAL',
    acknowledged: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    _id: 'al-02',
    type: 'HEARTBEAT_LOST',
    serverId: 'srv-gcp-dev-01',
    message: 'Heartbeat lost for server "GCP Dev Server" (srv-gcp-dev-01). Last seen 12 minutes ago.',
    severity: 'WARNING',
    acknowledged: false,
    createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
  },
  {
    _id: 'al-03',
    type: 'JOB_FAILED',
    serverId: 'srv-aws-staging-01',
    jobName: 'RefreshCache',
    message: 'Job "RefreshCache" failed on "AWS Staging App" (staging): Redis connection refused.',
    severity: 'INFO',
    acknowledged: true,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
];

// Service functions
export const api = {
  getDashboard: async (): Promise<DashboardStats> => {
    try {
      const res = await client.get<DashboardStats>('/dashboard');
      isOfflineMode = false;
      return res.data;
    } catch (err) {
      console.warn('Backend offline, falling back to mock data', err);
      isOfflineMode = true;
      
      const totalServers = MOCK_AGENTS.length;
      const onlineServers = MOCK_AGENTS.filter(a => a.status === 'ONLINE').length;
      const runningJobs = MOCK_EXECUTIONS.filter(e => e.status === 'RUNNING' || e.status === 'STARTED').length;
      const healthyJobs = 4; // Mock estimate
      const failedJobs = MOCK_EXECUTIONS.filter(e => e.status === 'FAILED').length;

      return {
        totalServers,
        onlineServers,
        runningJobs,
        healthyJobs,
        failedJobs,
        latestExecutions: MOCK_EXECUTIONS.slice(0, 10),
      };
    }
  },

  getAgents: async (): Promise<Agent[]> => {
    try {
      const res = await client.get<Agent[]>('/agents');
      isOfflineMode = false;
      return res.data;
    } catch (err) {
      console.warn('Backend offline, falling back to mock data', err);
      isOfflineMode = true;
      return MOCK_AGENTS;
    }
  },

  getExecutions: async (params?: GetExecutionsParams): Promise<Execution[]> => {
    try {
      const res = await client.get<Execution[]>('/executions', { params });
      isOfflineMode = false;
      return res.data;
    } catch (err) {
      console.warn('Backend offline, falling back to mock data', err);
      isOfflineMode = true;

      let filtered = [...MOCK_EXECUTIONS];
      if (params) {
        if (params.serverId) {
          filtered = filtered.filter(e => e.serverId === params.serverId);
        }
        if (params.jobName) {
          filtered = filtered.filter(e => e.jobName.toLowerCase().includes(params.jobName!.toLowerCase()));
        }
        if (params.status) {
          filtered = filtered.filter(e => e.status.toUpperCase() === params.status!.toUpperCase());
        }
        
        const skip = params.skip || 0;
        const limit = params.limit || 100;
        filtered = filtered.slice(skip, skip + limit);
      }
      return filtered;
    }
  },

  getAlerts: async (params?: GetAlertsParams): Promise<Alert[]> => {
    try {
      const res = await client.get<Alert[]>('/alerts', { params });
      isOfflineMode = false;
      return res.data;
    } catch (err) {
      console.warn('Backend offline, falling back to mock data', err);
      isOfflineMode = true;

      let filtered = [...MOCK_ALERTS];
      if (params) {
        if (params.serverId) {
          filtered = filtered.filter(a => a.serverId === params.serverId);
        }
        if (params.jobName) {
          filtered = filtered.filter(a => a.jobName?.toLowerCase().includes(params.jobName!.toLowerCase()));
        }
        if (params.severity) {
          filtered = filtered.filter(a => a.severity.toUpperCase() === params.severity!.toUpperCase());
        }
        if (params.acknowledged !== undefined) {
          const ackBool = typeof params.acknowledged === 'string' 
            ? params.acknowledged === 'true'
            : params.acknowledged;
          filtered = filtered.filter(a => a.acknowledged === ackBool);
        }
        
        const skip = params.skip || 0;
        const limit = params.limit || 100;
        filtered = filtered.slice(skip, skip + limit);
      }
      return filtered;
    }
  },

  acknowledgeAlert: async (id: string): Promise<Alert> => {
    try {
      const res = await client.patch<Alert>(`/alerts/${id}/acknowledge`);
      isOfflineMode = false;
      return res.data;
    } catch (err) {
      console.warn('Backend offline, falling back to mock behavior', err);
      isOfflineMode = true;
      const alertIndex = MOCK_ALERTS.findIndex(a => a._id === id);
      if (alertIndex > -1) {
        MOCK_ALERTS[alertIndex] = {
          ...MOCK_ALERTS[alertIndex],
          acknowledged: true,
        };
        return MOCK_ALERTS[alertIndex];
      }
      throw new Error('Alert not found in mock database.');
    }
  },
};
export default api;
