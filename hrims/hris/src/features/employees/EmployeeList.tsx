
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseServices';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid/models/colDef/gridColDef';
import { Box, Typography, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import EmployeeForm from './EmployeeForm';

type EmployeeFormValues = {
  name: string;
  email: string;
  position: string;
  department: string;
};

interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
}

export default function EmployeeList() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'employees'));
    const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Employee[];
    setEmployees(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);


  const handleAdd = async (values: EmployeeFormValues) => {
    await addDoc(collection(db, 'employees'), values);
    setOpenForm(false);
    fetchEmployees();
  };

  const handleEdit = async (values: EmployeeFormValues) => {
    if (editEmployee) {
      const ref = doc(db, 'employees', editEmployee.id);
      await updateDoc(ref, values);
      setEditEmployee(null);
      setOpenForm(false);
      fetchEmployees();
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'employees', id));
    fetchEmployees();
  };


  const columns: GridColDef[] = [
    { field: 'name', headerName: t('app.name') || 'Name', flex: 1 },
    { field: 'email', headerName: t('app.email') || 'Email', flex: 1 },
    { field: 'position', headerName: t('app.position') || 'Position', flex: 1 },
    { field: 'department', headerName: t('app.department') || 'Department', flex: 1 },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <Button size="small" color="primary" onClick={() => { setEditEmployee(params.row); setOpenForm(true); }}>
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
        <Typography variant="h5">{t('app.employees')}</Typography>
        <Button variant="contained" color="primary" onClick={() => { setEditEmployee(null); setOpenForm(true); }}>
          + {t('app.add') || 'Add'}
        </Button>
      </Box>
      <DataGrid
        rows={employees}
        columns={columns}
        autoHeight
        loading={loading}
        pageSize={10}
        rowsPerPageOptions={[10, 20, 50]}
        disableSelectionOnClick
      />
      <EmployeeForm
        open={openForm}
        onClose={() => { setOpenForm(false); setEditEmployee(null); }}
        onSubmit={editEmployee ? handleEdit : handleAdd}
        initialValues={editEmployee ? {
          name: editEmployee.name,
          email: editEmployee.email,
          position: editEmployee.position,
          department: editEmployee.department,
        } : undefined}
      />
    </Box>
  );
}
