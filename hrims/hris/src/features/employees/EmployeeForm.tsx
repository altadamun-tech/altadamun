import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

export interface EmployeeFormValues {
  name: string;
  email: string;
  position: string;
  department: string;
}

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => void;
  initialValues?: EmployeeFormValues;
}

export default function EmployeeForm({ open, onClose, onSubmit, initialValues }: EmployeeFormProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<EmployeeFormValues>(
    initialValues || { name: '', email: '', position: '', department: '' }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('app.employees')} - {t('app.add')}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            margin="dense"
            label={t('app.name')}
            name="name"
            value={values.name}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label={t('app.email')}
            name="email"
            value={values.email}
            onChange={handleChange}
            fullWidth
            required
            type="email"
          />
          <TextField
            margin="dense"
            label={t('app.position')}
            name="position"
            value={values.position}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label={t('app.department')}
            name="department"
            value={values.department}
            onChange={handleChange}
            fullWidth
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('app.cancel') || 'Cancel'}</Button>
          <Button type="submit" variant="contained">{t('app.save') || 'Save'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
