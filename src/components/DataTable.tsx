import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TableSortLabel,
  Box,
  useTheme,
  useMediaQuery,
  Stack,
} from '@mui/material';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

export interface Column<T> {
  id: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  noWrap?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
  pagination?: boolean;
  defaultRowsPerPage?: number;
  minWidth?: number;
  renderMobileCard?: (row: T) => React.ReactNode;
}

export function DataTable<T extends { _id: string }>({
  columns,
  data,
  loading = false,
  emptyTitle,
  emptyDescription,
  onEmptyAction,
  emptyActionLabel,
  pagination = true,
  defaultRowsPerPage = 10,
  minWidth = 850,
  renderMobileCard,
}: DataTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [orderBy, setOrderBy] = useState<string | null>(null);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  // Reset page to 0 whenever data changes (e.g. user applied filter)
  React.useEffect(() => {
    setPage(0);
  }, [data.length]);

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return <LoadingState variant="table" count={5} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  // Handle local sorting
  const sortedData = [...data].sort((a, b) => {
    if (!orderBy) return 0;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const valA = (a as any)[orderBy];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const valB = (b as any)[orderBy];

    if (valA === undefined || valB === undefined) return 0;

    if (typeof valA === 'string') {
      return order === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    return order === 'asc'
      ? (valA as number) - (valB as number)
      : (valB as number) - (valA as number);
  });

  const paginatedData = pagination
    ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : sortedData;

  // On mobile screens, if custom mobile card renderer is provided, use cards for superior UX
  if (isMobile && renderMobileCard) {
    return (
      <Box sx={{ width: '100%' }}>
        <Stack spacing={2} sx={{ mb: 2 }}>
          {paginatedData.map((row) => (
            <React.Fragment key={row._id}>{renderMobileCard(row)}</React.Fragment>
          ))}
        </Stack>
        {pagination && (
          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}
          >
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={data.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        )}
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
      }}
    >
      <TableContainer
        sx={{
          width: '100%',
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#cbd5e1',
            borderRadius: '4px',
          },
        }}
      >
        <Table sx={{ minWidth, width: '100%' }} aria-label="data table">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: column.noWrap ? 'nowrap' : 'normal',
                    py: 1.5,
                    px: 2,
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                      sx={{
                        '& .MuiTableSortLabel-icon': {
                          opacity: 0.7,
                        },
                      }}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row) => (
              <TableRow
                key={row._id}
                hover
                sx={{
                  transition: 'background-color 0.15s ease',
                  '&:hover': {
                    bgcolor: '#f8fafc',
                  },
                  '&:last-child td': { border: 0 },
                }}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    sx={{
                      width: column.width,
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth,
                      whiteSpace: column.noWrap ? 'nowrap' : 'normal',
                      py: 1.75,
                      px: 2,
                      fontSize: '0.875rem',
                      borderBottom: '1px solid #f1f5f9',
                      verticalAlign: 'middle',
                    }}
                  >
                    {column.render ? column.render(row) : (row as any)[column.id]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {pagination && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            color: 'text.secondary',
          }}
        />
      )}
    </Paper>
  );
}

export default DataTable;
