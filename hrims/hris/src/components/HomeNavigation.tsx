import { Box, Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function HomeNavigation({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { t } = useTranslation();
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="80vh">
      <Typography variant="h4" mb={4}>{t('app.title')}</Typography>
      <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
        <Button variant="contained" onClick={() => onNavigate('dashboard')}>{t('app.dashboard')}</Button>
        <Button variant="contained" onClick={() => onNavigate('employees')}>{t('app.employees')}</Button>
        <Button variant="contained" onClick={() => onNavigate('leaves')}>{t('app.leaves')}</Button>
        <Button variant="contained" onClick={() => onNavigate('payroll')}>{t('app.payroll')}</Button>
      </Stack>
    </Box>
  );
}
