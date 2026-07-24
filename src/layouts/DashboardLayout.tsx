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
  Alert,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DnsIcon from '@mui/icons-material/Dns';
import ListAltIcon from '@mui/icons-material/ListAlt';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { getOfflineModeStatus } from '../services/api';

const DRAWER_WIDTH = 260;

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

  const userStr = localStorage.getItem('cronwatch_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', id: 'dashboard', icon: <DashboardIcon /> },
    { text: 'Servers', id: 'servers', icon: <DnsIcon /> },
    { text: 'Executions', id: 'executions', icon: <ListAltIcon /> },
    { text: 'Alerts', id: 'alerts', icon: <NotificationsActiveIcon /> },
    { text: 'Settings', id: 'settings', icon: <SettingsIcon /> },
  ];

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '6px',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'primary.contrastText',
            fontWeight: 800,
            fontSize: '1rem',
          }}
        >
          CW
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'primary.main' }}>
          CronWatch
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  setCurrentPage(item.id);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: '6px',
                  bgcolor: isActive ? 'primary.light' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'text.secondary',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.light' : 'action.hover',
                    color: isActive ? 'primary.contrastText' : 'text.primary',
                  },
                  '& .MuiListItemIcon-root': {
                    color: isActive ? 'primary.contrastText' : 'text.secondary',
                  },
                  py: 1.2,
                  px: 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 500 }}>
                      {item.text}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
        {onLogout && (
          <ListItem disablePadding sx={{ mt: 1 }}>
            <ListItemButton
              onClick={onLogout}
              sx={{
                borderRadius: '6px',
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.light',
                  color: 'error.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'inherit',
                },
                py: 1.2,
                px: 2,
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}><LogoutIcon /></ListItemIcon>
              <ListItemText
                primary={
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    Logout
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        )}
      </List>
      <Divider />
      {user && (
        <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              border: '2px solid',
              borderColor: 'divider',
            }}
          >
            {user.username.substring(0, 2).toUpperCase()}
          </Box>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: 'text.primary' }}>
              {user.name || user.username}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: 'block' }}>
              {user.email}
            </Typography>
          </Box>
        </Box>
      )}
      <Divider />
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
          CronWatch Dashboard v1.0.0
        </Typography>
      </Box>
    </Box>
  );

  const isDemo = getOfflineModeStatus();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {menuItems.find((item) => item.id === currentPage)?.text || 'CronWatch'}
            </Typography>
          </Box>
          {isDemo && (
            <Alert
              severity="warning"
              icon={<WifiOffIcon fontSize="small" />}
              sx={{
                py: 0.25,
                px: 1.5,
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid',
                borderColor: 'warning.light',
              }}
            >
              Offline (Demo Mode)
            </Alert>
          )}
        </Toolbar>
      </AppBar>

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
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: '1px solid', borderColor: 'divider' },
          }}
        >
          {drawerContent}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: '1px solid', borderColor: 'divider' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2.5, sm: 4 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
