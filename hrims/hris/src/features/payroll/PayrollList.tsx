import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseServices';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Typography, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface Payroll {
  id: string;
  employeeName: string;
  month: string;
  amount: number;
  status: string;
}

export default function PayrollList() {
  const { t } = useTranslation();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayrolls = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'payrolls'));
    const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Payroll[];
    setPayrolls(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const columns: GridColDef[] = [
    { field: 'employeeName', headerName: t('app.name') || 'Employee', flex: 1 },
    { field: 'month', headerName: t('payroll.month') || 'Month', flex: 1 },
    { field: 'amount', headerName: t('payroll.amount') || 'Amount', flex: 1 },
    { field: 'status', headerName: t('payroll.status') || 'Status', flex: 1 },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">{t('app.payroll')}</Typography>
        <Button variant="contained" color="primary">+ {t('payroll.add') || 'Add Payroll'}</Button>
      </Box>
      <DataGrid
        rows={payrolls}
        columns={columns}
        autoHeight
        loading={loading}
        pageSize={10}
        rowsPerPageOptions={[10, 20, 50]}
        disableSelectionOnClick
      />
    </Box>
  );
}
