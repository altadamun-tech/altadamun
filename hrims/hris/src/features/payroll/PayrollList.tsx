import { useEffect, useState } from 'react';
import { collection, getDocsFromServer } from 'firebase/firestore';
import { db } from '../../firebaseServices';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
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
  const [error, setError] = useState("");

  const fetchPayrolls = async () => {
    setLoading(true);
    setError("");
    try {
      const querySnapshot = await getDocsFromServer(collection(db, 'payrolls'));
    const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Payroll[];
    setPayrolls(data);
    } catch {
      setError("تعذر تحميل البيانات من Firebase.");
    } finally {
      setLoading(false);
    }
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
      {error && <Typography color="error" role="alert">{error}</Typography>}
      <DataGrid
        rows={payrolls}
        columns={columns}
        autoHeight
        loading={loading}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[10, 20, 50]}
        disableRowSelectionOnClick
      />
    </Box>
  );
}
