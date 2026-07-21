export interface PM2ProcessInfo {
  processName: string;
  status: string;
  pid: number;
  restartCount: number;
  uptime: number;
}

export interface Agent {
  _id: string;
  serverId: string;
  serverName: string;
  hostname: string;
  ipAddress: string;
  environment: string;
  backend: string;
  status: 'ONLINE' | 'OFFLINE';
  lastHeartbeat: string;
  createdAt: string;
  updatedAt: string;
  stats?: any;
  pm2?: PM2ProcessInfo[];
}

export interface Execution {
  _id: string;
  serverId: string;
  backend: string;
  jobName: string;
  status: string; // SUCCESS, FAILED, STARTED, RUNNING, COMPLETED
  startedAt: string;
  completedAt?: string;
  duration?: number; // in milliseconds
  message?: string;
  serverName?: string;
  environment?: string;
  hostname?: string;
  processName?: string;
  timestamp?: string;
  rawLog?: string;
  matchedRule?: string;
  createdAt: string;
}

export interface Alert {
  _id: string;
  type: string; // HEARTBEAT_LOST, JOB_FAILED
  serverId: string;
  jobName?: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  acknowledged: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalServers: number;
  onlineServers: number;
  runningJobs: number;
  healthyJobs: number;
  failedJobs: number;
  latestExecutions: Execution[];
}

export interface GetExecutionsParams {
  serverId?: string;
  jobName?: string;
  status?: string;
  limit?: number;
  skip?: number;
}

export interface GetAlertsParams {
  serverId?: string;
  jobName?: string;
  severity?: string;
  acknowledged?: boolean | string;
  limit?: number;
  skip?: number;
}
