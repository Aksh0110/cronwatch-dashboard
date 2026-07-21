import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Button,
  Typography,
  Switch,
  FormControlLabel,
  Stack,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert as MuiAlert,
  Snackbar,
  Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';

import PageHeader from '../components/PageHeader';
import api from '../services/api';

export const Settings: React.FC = () => {
  // Settings Form State
  const [alertEmails, setAlertEmails] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [jobFailedAlertsEnabled, setJobFailedAlertsEnabled] = useState(true);
  const [processDownAlertsEnabled, setProcessDownAlertsEnabled] = useState(true);
  const [heartbeatLostAlertsEnabled, setHeartbeatLostAlertsEnabled] = useState(true);

  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpFrom, setSmtpFrom] = useState('');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');

  // Notification State
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  // Fetch Settings on Mount
  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      // In TS we extend api with getSettings
      const data = await (api as any).getSettings();
      if (data) {
        setAlertEmails(data.alertEmails || '');
        setEmailEnabled(data.emailEnabled !== undefined ? data.emailEnabled : true);
        setJobFailedAlertsEnabled(data.jobFailedAlertsEnabled !== undefined ? data.jobFailedAlertsEnabled : true);
        setProcessDownAlertsEnabled(data.processDownAlertsEnabled !== undefined ? data.processDownAlertsEnabled : true);
        setHeartbeatLostAlertsEnabled(data.heartbeatLostAlertsEnabled !== undefined ? data.heartbeatLostAlertsEnabled : true);
        
        setSmtpHost(data.smtpHost || '');
        setSmtpPort(data.smtpPort || 587);
        setSmtpUser(data.smtpUser || '');
        setSmtpPass(data.smtpPass || '');
        setSmtpSecure(data.smtpSecure || false);
        setSmtpFrom(data.smtpFrom || '');
      }
    } catch (error: any) {
      console.error('Failed to load settings', error);
      showToast('Failed to load settings from server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save Settings handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        alertEmails,
        emailEnabled,
        jobFailedAlertsEnabled,
        processDownAlertsEnabled,
        heartbeatLostAlertsEnabled,
        smtpHost,
        smtpPort: Number(smtpPort),
        smtpUser,
        smtpPass,
        smtpSecure,
        smtpFrom,
      };

      await (api as any).updateSettings(payload);
      showToast('Settings saved successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to save settings', error);
      showToast(error.response?.data?.message || 'Failed to save settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Test Email handler
  const handleTestEmail = async () => {
    const recipient = testRecipient.trim() || alertEmails.split(',')[0]?.trim();
    if (!recipient) {
      showToast('Please specify a recipient email to send the test alert.', 'warning');
      return;
    }

    setIsTesting(true);
    try {
      const payload = {
        alertEmails,
        emailEnabled,
        jobFailedAlertsEnabled,
        processDownAlertsEnabled,
        heartbeatLostAlertsEnabled,
        smtpHost,
        smtpPort: Number(smtpPort),
        smtpUser,
        smtpPass,
        smtpSecure,
        smtpFrom,
        testEmail: recipient,
      };

      await (api as any).testSettings(payload);
      showToast(`Test email successfully sent to ${recipient}!`, 'success');
    } catch (error: any) {
      console.error('Failed to send test email', error);
      showToast(error.response?.data?.message || 'SMTP Connection Test Failed. Verify your credentials.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Notification Settings"
        subtitle="Configure email alert recipients, notification rules, and custom SMTP integration"
        action={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchSettings}
            disabled={isLoading}
          >
            Reload
          </Button>
        }
      />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <form onSubmit={handleSave}>
          <Grid container spacing={4}>
            {/* Left Column: Notification Alerts & Recipient Rules */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={4}>
                <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                  <CardHeader
                    title={
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <EmailIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Email Notifications
                        </Typography>
                      </Stack>
                    }
                    subheader="Direct notifications of critical failure logs"
                  />
                  <Divider />
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={emailEnabled}
                            onChange={(e) => setEmailEnabled(e.target.checked)}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Enable Email Alerts</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Master switch to control alert email dispatch
                            </Typography>
                          </Box>
                        }
                        sx={{ mb: 2 }}
                      />

                      <TextField
                        label="Alert Recipients (Emails)"
                        variant="outlined"
                        fullWidth
                        disabled={!emailEnabled}
                        placeholder="admin@company.com, engineering@company.com"
                        value={alertEmails}
                        onChange={(e) => setAlertEmails(e.target.value)}
                        helperText="Separate multiple addresses with commas. System alerts will be broadcast to all recipients."
                      />

                      <Divider sx={{ my: 1 }} />

                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                        Trigger Toggles
                      </Typography>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={jobFailedAlertsEnabled}
                            onChange={(e) => setJobFailedAlertsEnabled(e.target.checked)}
                            disabled={!emailEnabled}
                            color="error"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>Job Failures</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Notify when a monitored log pattern matches a failure rule
                            </Typography>
                          </Box>
                        }
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={processDownAlertsEnabled}
                            onChange={(e) => setProcessDownAlertsEnabled(e.target.checked)}
                            disabled={!emailEnabled}
                            color="error"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>PM2 Process Stopped</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Notify when a configured PM2 daemon process goes offline/errored
                            </Typography>
                          </Box>
                        }
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={heartbeatLostAlertsEnabled}
                            onChange={(e) => setHeartbeatLostAlertsEnabled(e.target.checked)}
                            disabled={!emailEnabled}
                            color="error"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>Server Offline</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Notify when a monitored host agent drops heartbeat connections for &gt; 5 minutes
                            </Typography>
                          </Box>
                        }
                      />
                    </Stack>
                  </CardContent>
                </Card>

                {/* Save action card */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={isSaving}
                    startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    sx={{ px: 4, py: 1.2, fontWeight: 700, borderRadius: '6px' }}
                  >
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Box>
              </Stack>
            </Grid>

            {/* Right Column: SMTP configuration & Credentials */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={4}>
                <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                  <CardHeader
                    title={
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <SettingsIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          SMTP Configuration
                        </Typography>
                      </Stack>
                    }
                    subheader="Outgoing mail server credentials"
                  />
                  <Divider />
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                          label="SMTP Host"
                          placeholder="smtp.mailgun.org"
                          variant="outlined"
                          fullWidth
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          label="Port"
                          type="number"
                          placeholder="587"
                          variant="outlined"
                          fullWidth
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(Number(e.target.value))}
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <TextField
                          label="Username"
                          placeholder="postmaster@yourdomain.com"
                          variant="outlined"
                          fullWidth
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <TextField
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="SMTP Relay Password"
                          variant="outlined"
                          fullWidth
                          value={smtpPass}
                          onChange={(e) => setSmtpPass(e.target.value)}
                          slotProps={{
                            input: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={() => setShowPassword(!showPassword)}
                                    edge="end"
                                  >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <TextField
                          label="Sender Address"
                          placeholder="&quot;CronWatch Alerts&quot; &lt;noreply@cronwatch.company&gt;"
                          variant="outlined"
                          fullWidth
                          value={smtpFrom}
                          onChange={(e) => setSmtpFrom(e.target.value)}
                          helperText="The outgoing 'From' email address header"
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={smtpSecure}
                              onChange={(e) => setSmtpSecure(e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Secure Connection (SSL/TLS)</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Enable if SMTP host requires secure handshake (usually port 465)
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Connection Test Card */}
                <Card sx={{ border: '1px solid #e2e8f0', bgcolor: 'action.hover', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        SMTP Connection Diagnostics
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Send a test email using the settings provided above before committing.
                      </Typography>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
                        <TextField
                          label="Test Recipient Email"
                          variant="outlined"
                          size="small"
                          fullWidth
                          placeholder="recipient@company.com"
                          value={testRecipient}
                          onChange={(e) => setTestRecipient(e.target.value)}
                          sx={{ bgcolor: 'background.paper' }}
                        />
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={handleTestEmail}
                          disabled={isTesting}
                          startIcon={isTesting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                          sx={{ py: 1, px: 3, whiteSpace: 'nowrap', textTransform: 'none', fontWeight: 600 }}
                        >
                          {isTesting ? 'Sending...' : 'Test Connection'}
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </form>
      )}

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%', fontWeight: 500 }}>
          {toast.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
