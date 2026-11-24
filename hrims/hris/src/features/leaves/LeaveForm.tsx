import { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

export interface LeaveFormValues {
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface LeaveFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: LeaveFormValues) => void;
  initialValues?: LeaveFormValues;
}

export default function LeaveForm({ open, onClose, onSubmit, initialValues }: LeaveFormProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<LeaveFormValues>(
    initialValues || { employeeName: '', type: '', startDate: '', endDate: '', status: 'pending' }
  );

  // إعادة تعيين القيم عند فتح النموذج
  React.useEffect(() => {
    if (open) {
      setValues(initialValues || { employeeName: '', type: '', startDate: '', endDate: '', status: 'pending' });
    }
  }, [open, initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('leave.request')}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            margin="dense"
            label={t('app.name')}
            name="employeeName"
            value={values.employeeName}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label={t('leave.type')}
            name="type"
            value={values.type}
            onChange={handleChange}
            fullWidth
            required
            select
          >
            <MenuItem value="annual">{t('leave.annual') || 'Annual'}</MenuItem>
            <MenuItem value="sick">{t('leave.sick') || 'Sick'}</MenuItem>
            <MenuItem value="unpaid">{t('leave.unpaid') || 'Unpaid'}</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            label={t('leave.startDate')}
            name="startDate"
            type="date"
            value={values.startDate}
            onChange={handleChange}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="dense"
            label={t('leave.endDate')}
            name="endDate"
            type="date"
            value={values.endDate}
            onChange={handleChange}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('app.cancel')}</Button>
          <Button type="submit" variant="contained">{t('app.save')}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
