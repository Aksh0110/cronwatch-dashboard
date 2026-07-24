import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Typography,
  Snackbar,
  Alert as MuiAlert,
  Tooltip,
  Avatar,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShieldIcon from '@mui/icons-material/Shield';
import PeopleIcon from '@mui/icons-material/People';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import api from '../services/api';
import type { User } from '../types';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Delete Confirmation Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Form Field States
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'write' | 'read'>('read');
  const [isActive, setIsActive] = useState(true);

  // Form Validation Errors State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Notification State
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
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

  // Fetch Users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await (api as any).getUsers();
      setUsers(data || []);
    } catch (error: any) {
      console.error('Failed to load users', error);
      showToast(error?.response?.data?.message || 'Failed to load users from server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Open Dialog for Add
  const handleOpenAdd = () => {
    setDialogMode('add');
    setSelectedUser(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setName('');
    setRole('read');
    setIsActive(true);
    setErrors({});
    setDialogOpen(true);
  };

  // Open Dialog for Edit
  const handleOpenEdit = (user: User) => {
    setDialogMode('edit');
    setSelectedUser(user);
    setUsername(user.username);
    setEmail(user.email);
    setPassword(''); // Leave empty unless resetting
    setName(user.name || '');
    setRole(user.role);
    setIsActive(user.isActive);
    setErrors({});
    setDialogOpen(true);
  };

  // Open Delete Confirmation Dialog
  const handleOpenDelete = (user: User) => {
    const currentLoggedUserStr = localStorage.getItem('cronwatch_user');
    const currentLoggedUser = currentLoggedUserStr ? JSON.parse(currentLoggedUserStr) : null;
    
    if (currentLoggedUser && currentLoggedUser.id === user._id) {
      showToast('You cannot delete your own account.', 'warning');
      return;
    }

    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Form Validation
  const validateForm = (): boolean => {
    const tempErrors: { [key: string]: string } = {};

    if (!username.trim()) {
      tempErrors.username = 'Username is required';
    } else if (username.length < 3) {
      tempErrors.username = 'Username must be at least 3 characters';
    }

    if (!email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Email is invalid';
    }

    if (dialogMode === 'add') {
      if (!password) {
        tempErrors.password = 'Password is required';
      } else if (password.length < 6) {
        tempErrors.password = 'Password must be at least 6 characters';
      }
    } else if (password && password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle Form Submit (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (dialogMode === 'add') {
        const payload: any = { username, email, password, name, role };
        await (api as any).createUser(payload);
        showToast(`User "${username}" created successfully.`, 'success');
      } else {
        const payload: any = { username, email, name, role, isActive };
        if (password) {
          payload.password = password;
        }
        await (api as any).updateUser(selectedUser!._id, payload);
        showToast(`User "${username}" updated successfully.`, 'success');
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to save user', error);
      showToast(
        error?.response?.data?.message || 'Error occurred while saving user details.',
        'error'
      );
    }
  };

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await (api as any).deleteUser(userToDelete._id);
      showToast(`User "${userToDelete.username}" has been deleted.`, 'success');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to delete user', error);
      showToast(error?.response?.data?.message || 'Failed to delete user.', 'error');
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (user: User) => {
    const currentLoggedUserStr = localStorage.getItem('cronwatch_user');
    const currentLoggedUser = currentLoggedUserStr ? JSON.parse(currentLoggedUserStr) : null;
    
    if (currentLoggedUser && currentLoggedUser.id === user._id) {
      showToast('You cannot deactivate your own account.', 'warning');
      return;
    }

    try {
      const updatedStatus = !user.isActive;
      await (api as any).updateUser(user._id, { isActive: updatedStatus });
      showToast(
        `User "${user.username}" has been ${updatedStatus ? 'activated' : 'deactivated'}.`,
        'success'
      );
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to update status', error);
      showToast(error?.response?.data?.message || 'Failed to toggle status.', 'error');
    }
  };

  // Render Role Chip
  const renderRoleChip = (roleVal: string) => {
    switch (roleVal) {
      case 'admin':
        return (
          <Chip
            icon={<ShieldIcon fontSize="small" />}
            label="Admin"
            size="small"
            sx={{
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              fontWeight: 600,
              px: 0.5,
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
        );
      case 'write':
        return (
          <Chip
            label="Read Write"
            size="small"
            color="success"
            variant="outlined"
            sx={{ fontWeight: 600, px: 0.5 }}
          />
        );
      case 'read':
      default:
        return (
          <Chip
            label="Read Only"
            size="small"
            variant="outlined"
            sx={{ color: 'text.secondary', borderColor: 'divider', fontWeight: 500, px: 0.5 }}
          />
        );
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader
        title="User Management"
        subtitle="Manage panel access accounts, roles and permission tiers."
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={fetchUsers}
              disabled={isLoading}
              startIcon={<RefreshIcon />}
              sx={{ borderColor: 'divider' }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenAdd}
              startIcon={<AddIcon />}
              sx={{ fontWeight: 600 }}
            >
              Add User
            </Button>
          </Box>
        }
      />

      <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: '8px' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {isLoading ? (
            <Box sx={{ p: 4 }}>
              <LoadingState variant="table" count={5} />
            </Box>
          ) : users.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                No Users Found
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.disabled', mb: 2.5 }}>
                Get started by creating the first system access user account.
              </Typography>
              <Button variant="contained" onClick={handleOpenAdd} startIcon={<AddIcon />}>
                Create User
              </Button>
            </Box>
          ) : (
            <TableContainer sx={{ borderRadius: '8px', overflow: 'hidden' }}>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, py: 1.8 }}>Name & Username</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 1.8 }}>Email Address</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 1.8 }}>Role Access</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 1.8 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, py: 1.8, pr: 3 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: 'primary.light',
                              color: 'primary.contrastText',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                            }}
                          >
                            {user.username.substring(0, 2).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {user.name || '—'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              @{user.username}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>{user.email}</TableCell>
                      <TableCell sx={{ py: 1.5 }}>{renderRoleChip(user.role)}</TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Tooltip title={user.isActive ? 'Click to Deactivate' : 'Click to Activate'}>
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={user.isActive}
                                onChange={() => handleToggleStatus(user)}
                                color="success"
                              />
                            }
                            label={
                              <Chip
                                label={user.isActive ? 'Active' : 'Inactive'}
                                size="small"
                                color={user.isActive ? 'success' : 'default'}
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  '& .MuiChip-label': { px: 1 },
                                }}
                              />
                            }
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.5, pr: 3 }}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Tooltip title="Edit User Details">
                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(user)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Account">
                            <IconButton size="small" color="error" onClick={() => handleOpenDelete(user)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            {dialogMode === 'add' ? 'Create New User' : 'Edit User Profile'}
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label="Username"
                fullWidth
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={!!errors.username}
                helperText={errors.username}
                disabled={dialogMode === 'edit'}
                placeholder="e.g. jdoe"
                variant="outlined"
              />

              <TextField
                label="Email Address"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                placeholder="e.g. john.doe@company.com"
                variant="outlined"
              />

              <TextField
                label={dialogMode === 'add' ? 'Password' : 'Reset Password'}
                type="password"
                fullWidth
                required={dialogMode === 'add'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password}
                helperText={
                  errors.password ||
                  (dialogMode === 'edit'
                    ? 'Leave empty if you do not want to change the password.'
                    : 'Minimum 6 characters.')
                }
                placeholder="••••••"
                variant="outlined"
              />

              <TextField
                label="Display Name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                variant="outlined"
              />

              <FormControl fullWidth>
                <InputLabel id="role-select-label">Access Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  value={role}
                  label="Access Role"
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <MenuItem value="read">Read Only (Guest / Viewer)</MenuItem>
                  <MenuItem value="write">Read Write (Operator / Modifier)</MenuItem>
                  <MenuItem value="admin">Administrator (Full Control)</MenuItem>
                </Select>
              </FormControl>

              {dialogMode === 'edit' && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      color="success"
                    />
                  }
                  label="Account Active Status"
                />
              )}
            </Box>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 600 }}>
              {dialogMode === 'add' ? 'Create User' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm User Deletion</DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Typography variant="body1">
            Are you sure you want to permanently delete the user account for{' '}
            <strong>@{userToDelete?.username}</strong>?
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1.5 }}>
            This action cannot be undone and will revoke all access for this user immediately.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" sx={{ fontWeight: 600 }}>
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default Users;
