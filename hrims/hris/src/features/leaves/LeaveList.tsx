import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseServices';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid/models/colDef/gridColDef';
import { Box, Typography, Button } from '@mui/material';
import LeaveReviewActions from './LeaveReviewActions';
import LeaveForm from './LeaveForm';
// Locally define LeaveFormValues type to avoid import/export error
type LeaveFormValues = {
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
};
import { useTranslation } from 'react-i18next';

interface Leave {
  id: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
}

export default function LeaveList() {
  const { t } = useTranslation();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editLeave, setEditLeave] = useState<Leave | null>(null);
  const handleAdd = async (values: LeaveFormValues) => {
    await addDoc(collection(db, 'leaves'), values);
    setOpenForm(false);
    fetchLeaves();
  };

  const handleEdit = async (values: LeaveFormValues) => {
    if (editLeave) {
      const ref = doc(db, 'leaves', editLeave.id);
      await updateDoc(ref, values);
      setEditLeave(null);
      setOpenForm(false);
      fetchLeaves();
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'leaves', id));
    fetchLeaves();
  };

  const fetchLeaves = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'leaves'));
    const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Leave[];
    setLeaves(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // رصيد تجريبي (في التطبيق الفعلي يجب ربطه ببيانات الموظف)
  const [leaveBalance, setLeaveBalance] = useState<{ [employee: string]: number }>({});

  const handleApprove = async (row: Leave) => {
    // تحديث حالة الطلب
    const ref = doc(db, 'leaves', row.id);
    await updateDoc(ref, { status: 'approved' });
    // تحديث رصيد الإجازات (تجريبي)
    setLeaveBalance((prev) => ({
      ...prev,
      [row.employeeName]: (prev[row.employeeName] || 10) - 1,
    }));
    fetchLeaves();
  };

  const handleReject = async (row: Leave) => {
    const ref = doc(db, 'leaves', row.id);
    await updateDoc(ref, { status: 'rejected' });
    fetchLeaves();
  };

  const columns: GridColDef[] = [
    { field: 'employeeName', headerName: t('app.name') || 'Employee', flex: 1 },
    { field: 'type', headerName: t('leave.type') || 'Type', flex: 1 },
    { field: 'startDate', headerName: t('leave.startDate') || 'Start Date', flex: 1 },
    { field: 'endDate', headerName: t('leave.endDate') || 'End Date', flex: 1 },
    { field: 'status', headerName: t('leave.status') || 'Status', flex: 1 },
    {
      field: 'review',
      headerName: t('leave.review') || 'Review',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <LeaveReviewActions
          status={params.row.status}
          onApprove={() => handleApprove(params.row)}
          onReject={() => handleReject(params.row)}
        />
      ),
      flex: 1,
      minWidth: 160,
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <Button size="small" color="primary" onClick={() => { setEditLeave(params.row); setOpenForm(true); }}>
            {t('app.edit')}
          </Button>
          <Button size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            {t('app.delete')}
          </Button>
        </Box>
      ),
      flex: 1,
      minWidth: 120,
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">{t('app.leaves')}</Typography>
        <Button variant="contained" color="primary" onClick={() => { setEditLeave(null); setOpenForm(true); }}>
          + {t('leave.request') || 'Request Leave'}
        </Button>
      </Box>
      <DataGrid
        rows={leaves}
        columns={columns}
        autoHeight
        loading={loading}
        pageSize={10}
        rowsPerPageOptions={[10, 20, 50]}
        disableSelectionOnClick
      />
      {/* عرض رصيد الإجازات التجريبي */}
      <Box mt={2}>
        <Typography variant="subtitle1">{t('leave.balance') || 'Leave Balance'}:</Typography>
        {Object.entries(leaveBalance).map(([name, balance]) => (
          <Typography key={name}>{name}: {balance}</Typography>
        ))}
      </Box>
      <LeaveForm
        open={openForm}
        onClose={() => { setOpenForm(false); setEditLeave(null); }}
        onSubmit={editLeave ? handleEdit : handleAdd}
        initialValues={editLeave ? {
          employeeName: editLeave.employeeName,
          type: editLeave.type,
          startDate: editLeave.startDate,
          endDate: editLeave.endDate,
          status: editLeave.status,
        } : undefined}
      />
    </Box>
  );
}
