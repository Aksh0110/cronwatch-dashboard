import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Chip,
  Avatar,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import DnsRoundedIcon from '@mui/icons-material/DnsRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import WifiOffRoundedIcon from '@mui/icons-material/WifiOffRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

import { getOfflineModeStatus } from '../services/api';
import { useAlerts } from '../hooks/useAlerts';
import { useAgents } from '../hooks/useAgents';

const DRAWER_WIDTH = 250;

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  onLogout?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentPage,
  setCurrentPage,
  onLogout,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: activeAlerts } = useAlerts({ acknowledged: false });
  const { data: agents } = useAgents();
  const onlineCount = (agents || []).filter((a) => a.status === 'ONLINE').length;

  const userStr = localStorage.getItem('cronwatch_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isDemo = getOfflineModeStatus();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const unacknowledgedCount = activeAlerts ? activeAlerts.length : 0;

  const menuItems = [
    { text: 'Dashboard', id: 'dashboard', icon: <DashboardRoundedIcon fontSize="small" /> },
    { text: 'Servers', id: 'servers', icon: <DnsRoundedIcon fontSize="small" /> },
    { text: 'Executions', id: 'executions', icon: <ListAltRoundedIcon fontSize="small" /> },
    {
      text: 'Alerts',
      id: 'alerts',
      icon: <NotificationsActiveRoundedIcon fontSize="small" />,
      badge: unacknowledgedCount > 0 ? unacknowledgedCount : undefined,
    },
    { text: 'Settings', id: 'settings', icon: <SettingsRoundedIcon fontSize="small" /> },
  ];

  if (user && user.role === 'admin') {
    menuItems.push({ text: 'Users', id: 'users', icon: <PeopleRoundedIcon fontSize="small" /> });
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#ffffff' }}>
      {/* Brand Header */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            bgcolor: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1.1rem',
            letterSpacing: '-0.02em',
            boxShadow: '0 4px 10px rgba(15, 23, 42, 0.2)',
          }}
        >
          CW
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', lineHeight: 1.1 }}>
            CronWatch
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
            Production Monitor
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#f1f5f9' }} />

      {/* Navigation Links */}
      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.75 }}>
              <ListItemButton
                onClick={() => {
                  setCurrentPage(item.id);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: '8px',
                  bgcolor: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#1d4ed8' : '#475569',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: isActive ? '#dbeafe' : '#f8fafc',
                    color: isActive ? '#1d4ed8' : '#0f172a',
                  },
                  '& .MuiListItemIcon-root': {
                    color: isActive ? '#2563eb' : '#64748b',
                    minWidth: 36,
                  },
                  py: 1.1,
                  px: 1.5,
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: isActive ? 700 : 500 }}>
                      {item.text}
                    </Typography>
                  }
                />
                {item.badge !== undefined && (
                  <Chip
                    label={item.badge}
                    size="small"
                    color="error"
                    sx={{
                      height: 20,
                      minWidth: 20,
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      borderRadius: '10px',
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: '#f1f5f9' }} />

      {/* User info & Logout */}
      <Box sx={{ p: 2, bgcolor: '#f8fafc' }}>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: '#2563eb',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              {(user.username || 'U').substring(0, 2).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: '#0f172a',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.name || user.username}
              </Typography>
              <Chip
                label={(user.role || 'viewer').toUpperCase()}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  borderRadius: '4px',
                  bgcolor: user.role === 'admin' ? '#dbeafe' : '#f1f5f9',
                  color: user.role === 'admin' ? '#1e40af' : '#475569',
                }}
              />
            </Box>
          </Box>
        )}

        {onLogout && (
          <ListItemButton
            onClick={onLogout}
            sx={{
              borderRadius: '6px',
              color: '#ef4444',
              py: 0.75,
              px: 1.5,
              '&:hover': {
                bgcolor: '#fee2e2',
                color: '#b91c1c',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
              <LogoutRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Log out
                </Typography>
              }
            />
          </ListItemButton>
        )}
      </Box>
    </Box>
  );

  const currentTitle = menuItems.find((m) => m.id === currentPage)?.text || 'Dashboard';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Top Application Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: '#ffffff',
          color: '#0f172a',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: 'none',
          height: 60,
          justifyContent: 'center',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' }, color: '#0f172a' }}
            >
              <MenuRoundedIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              {currentTitle}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Live Server Indicator */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: 0.75,
                px: 1.25,
                py: 0.5,
                borderRadius: '20px',
                bgcolor: '#ecfdf5',
                border: '1px solid #a7f3d0',
              }}
            >
              <FiberManualRecordIcon sx={{ fontSize: '0.65rem', color: '#10b981' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#047857' }}>
                {onlineCount} {onlineCount === 1 ? 'Server' : 'Servers'} Online
              </Typography>
            </Box>

            {isDemo && (
              <Chip
                icon={<WifiOffRoundedIcon sx={{ fontSize: '0.85rem !important' }} />}
                label="Offline Demo Mode"
                size="small"
                color="warning"
                sx={{ fontWeight: 700, fontSize: '0.75rem' }}
              />
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawers */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        aria-label="navigation panels"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid #e2e8f0',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid #e2e8f0',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 3.5 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '60px',
          minWidth: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
