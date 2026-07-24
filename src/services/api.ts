import axios from 'axios';
import type { Agent, Execution, Alert, DashboardStats, GetExecutionsParams, GetAlertsParams } from '../types';

// API client pointing to NestJS backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// Interceptor to inject the JWT token if present
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cronwatch_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle 401 Unauthorized responses
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear credentials and force reload
      localStorage.removeItem('cronwatch_token');
      localStorage.removeItem('cronwatch_user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

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
    pm2: [
      { processName: 'customer-cron', status: 'online', pid: 14210, restartCount: 2, uptime: 86400 },
      { processName: 'admin-cron', status: 'online', pid: 14211, restartCount: 0, uptime: 86400 },
      { processName: 'partner-cron', status: 'stopped', pid: 0, restartCount: 5, uptime: 0 }
    ],
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
    pm2: [
      { processName: 'worker-cron', status: 'online', pid: 2154, restartCount: 1, uptime: 36000 }
    ],
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
    pm2: [
      { processName: 'customer-cron', status: 'online', pid: 8201, restartCount: 12, uptime: 4200 },
      { processName: 'admin-cron', status: 'stopped', pid: 0, restartCount: 4, uptime: 0 }
    ],
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
    pm2: [
      { processName: 'customer-cron', status: 'errored', pid: 0, restartCount: 45, uptime: 0 }
    ],
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

let MOCK_SETTINGS = {
  alertEmails: 'admin@company.com, engineering@company.com',
  emailEnabled: true,
  jobFailedAlertsEnabled: true,
  processDownAlertsEnabled: true,
  heartbeatLostAlertsEnabled: true,
  smtpHost: 'smtp.mailgun.org',
  smtpPort: 587,
  smtpUser: 'postmaster@yourdomain.com',
  smtpPass: 'password',
  smtpSecure: false,
  smtpFrom: '"CronWatch Alerts" <noreply@cronwatch.company>',
};

let MOCK_USERS: any[] = [
  {
    _id: 'mock-user-id',
    username: 'admin',
    email: 'admin@company.com',
    name: 'Administrator (Demo)',
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'u2',
    username: 'operator',
    email: 'operator@company.com',
    name: 'Backup Operator',
    role: 'write',
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'u3',
    username: 'viewer',
    email: 'viewer@company.com',
    name: 'Guest Viewer',
    role: 'read',
    isActive: true,
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
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
          const statusVal = params.status.toUpperCase();
          if (statusVal === 'SUCCESS' || statusVal === 'COMPLETED') {
            filtered = filtered.filter(e => e.status.toUpperCase() === 'SUCCESS' || e.status.toUpperCase() === 'COMPLETED');
          } else if (statusVal === 'RUNNING' || statusVal === 'STARTED') {
            filtered = filtered.filter(e => e.status.toUpperCase() === 'RUNNING' || e.status.toUpperCase() === 'STARTED');
          } else {
            filtered = filtered.filter(e => e.status.toUpperCase() === params.status!.toUpperCase());
          }
        }
        
        const skip = params.skip || 0;
        if (params.limit !== undefined && params.limit !== null) {
          filtered = filtered.slice(skip, skip + params.limit);
        } else if (skip > 0) {
          filtered = filtered.slice(skip);
        }
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
    const userStr = localStorage.getItem('cronwatch_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user && user.role === 'read') {
      const error = new Error('You do not have permission to perform this action');
      (error as any).response = {
        status: 403,
        data: { message: 'You do not have permission to perform this action' }
      };
      throw error;
    }
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

  getSettings: async (): Promise<any> => {
    try {
      const res = await client.get('/settings');
      isOfflineMode = false;
      return res.data;
    } catch (err) {
      console.warn('Backend offline, falling back to mock settings', err);
      isOfflineMode = true;
      return MOCK_SETTINGS;
    }
  },

  updateSettings: async (settings: any): Promise<any> => {
    const userStr = localStorage.getItem('cronwatch_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user && user.role === 'read') {
      const error = new Error('You do not have permission to perform this action');
      (error as any).response = {
        status: 403,
        data: { message: 'You do not have permission to perform this action' }
      };
      throw error;
    }
    try {
      const res = await client.post('/settings', settings);
      isOfflineMode = false;
      return res.data;
    } catch (err) {
      console.warn('Backend offline, falling back to mock settings update', err);
      isOfflineMode = true;
      MOCK_SETTINGS = { ...MOCK_SETTINGS, ...settings };
      return MOCK_SETTINGS;
    }
  },

  testSettings: async (payload: any): Promise<any> => {
    const userStr = localStorage.getItem('cronwatch_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user && user.role === 'read') {
      const error = new Error('You do not have permission to perform this action');
      (error as any).response = {
        status: 403,
        data: { message: 'You do not have permission to perform this action' }
      };
      throw error;
    }
    try {
      const res = await client.post('/settings/test', payload);
      isOfflineMode = false;
      return res.data;
    } catch (err) {
      console.warn('Backend offline, mock testing SMTP connection', err);
      isOfflineMode = true;
      return { message: 'Test email successfully sent' };
    }
  },

  login: async (username: string, password: string): Promise<any> => {
    try {
      const res = await client.post('/auth/login', { username, password });
      isOfflineMode = false;
      return res.data;
    } catch (err) {
      console.warn('Backend offline, attempting mock login', err);
      isOfflineMode = true;

      const mockUser = MOCK_USERS.find(u => u.username === username.toLowerCase());
      if (mockUser) {
        if (!mockUser.isActive) {
          throw new Error('User account is deactivated');
        }
        return {
          access_token: `mock_jwt_token_for_${mockUser.username}`,
          user: {
            id: mockUser._id,
            username: mockUser.username,
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role,
          }
        };
      }

      if (username === 'admin' && password === 'admin123') {
        return {
          access_token: 'mock_jwt_token_for_demo_mode',
          user: {
            id: 'mock-user-id',
            username: 'admin',
            email: 'admin@company.com',
            name: 'Administrator (Demo)',
            role: 'admin',
          }
        };
      }
      throw new Error('Invalid credentials');
    }
  },

  getMe: async (): Promise<any> => {
    try {
      const res = await client.get('/auth/me');
      isOfflineMode = false;
      return res.data;
    } catch (err) {
      console.warn('Backend offline, returning mock user profile', err);
      isOfflineMode = true;
      const token = localStorage.getItem('cronwatch_token');
      if (token && token.startsWith('mock_jwt_token_for_')) {
        const username = token.replace('mock_jwt_token_for_', '');
        const mockUser = MOCK_USERS.find(u => u.username === username);
        if (mockUser) {
          return {
            id: mockUser._id,
            username: mockUser.username,
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role,
          };
        }
      }
      return {
        id: 'mock-user-id',
        username: 'admin',
        email: 'admin@company.com',
        name: 'Administrator (Demo)',
        role: 'admin',
      };
    }
  },

  getUsers: async (): Promise<any[]> => {
    const userStr = localStorage.getItem('cronwatch_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user && user.role !== 'admin') {
      const error = new Error('Access denied. Administrator privileges required.');
      (error as any).response = {
        status: 403,
        data: { message: 'Access denied. Administrator privileges required.' }
      };
      throw error;
    }
    try {
      const res = await client.get('/users');
      isOfflineMode = false;
      return res.data;
    } catch (err) {
      console.warn('Backend offline, returning mock users list', err);
      isOfflineMode = true;
      return MOCK_USERS;
    }
  },

  createUser: async (user: any): Promise<any> => {
    const userStr = localStorage.getItem('cronwatch_user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    if (currentUser && currentUser.role !== 'admin') {
      const error = new Error('Access denied. Administrator privileges required.');
      (error as any).response = {
        status: 403,
        data: { message: 'Access denied. Administrator privileges required.' }
      };
      throw error;
    }
    try {
      const res = await client.post('/users', user);
      isOfflineMode = false;
      return res.data;
    } catch (err) {
      console.warn('Backend offline, creating mock user', err);
      isOfflineMode = true;
      const newUser = {
        _id: `u${MOCK_USERS.length + 1}`,
        username: user.username.toLowerCase(),
        email: user.email.toLowerCase(),
        name: user.name || '',
        role: user.role || 'read',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_USERS = [...MOCK_USERS, newUser];
      return newUser;
    }
  },

  updateUser: async (id: string, user: any): Promise<any> => {
    const userStr = localStorage.getItem('cronwatch_user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    if (currentUser && currentUser.role !== 'admin') {
      const error = new Error('Access denied. Administrator privileges required.');
      (error as any).response = {
        status: 403,
        data: { message: 'Access denied. Administrator privileges required.' }
      };
      throw error;
    }
    try {
      const res = await client.patch(`/users/${id}`, user);
      isOfflineMode = false;
      return res.data;
    } catch (err) {
      console.warn('Backend offline, updating mock user', err);
      isOfflineMode = true;
      const index = MOCK_USERS.findIndex(u => u._id === id);
      if (index > -1) {
        const updated = {
          ...MOCK_USERS[index],
          ...user,
          username: user.username ? user.username.toLowerCase() : MOCK_USERS[index].username,
          email: user.email ? user.email.toLowerCase() : MOCK_USERS[index].email,
          updatedAt: new Date().toISOString(),
        };
        MOCK_USERS[index] = updated;
        return updated;
      }
      throw new Error('User not found in mock database');
    }
  },

  deleteUser: async (id: string): Promise<any> => {
    const userStr = localStorage.getItem('cronwatch_user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    if (currentUser && currentUser.role !== 'admin') {
      const error = new Error('Access denied. Administrator privileges required.');
      (error as any).response = {
        status: 403,
        data: { message: 'Access denied. Administrator privileges required.' }
      };
      throw error;
    }
    try {
      const res = await client.delete(`/users/${id}`);
      isOfflineMode = false;
      return res.data;
    } catch (err) {
      console.warn('Backend offline, deleting mock user', err);
      isOfflineMode = true;
      const index = MOCK_USERS.findIndex(u => u._id === id);
      if (index > -1) {
        const deleted = MOCK_USERS[index];
        MOCK_USERS = MOCK_USERS.filter(u => u._id !== id);
        return deleted;
      }
      throw new Error('User not found in mock database');
    }
  },
};
export default api;
