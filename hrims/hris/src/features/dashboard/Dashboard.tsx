import { Card, CardContent, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();
  // بيانات وهمية للإحصائيات
  const stats = [
    { label: t('app.employees'), value: 24 },
    { label: t('app.leaves'), value: 7 },
    { label: t('app.payroll'), value: 12 },
  ];

  return (
    <Grid container spacing={3}>
      {stats.map((stat) => (
        <Grid item xs={12} sm={4} key={stat.label}>
          <Card>
            <CardContent>
              <Typography variant="h5" align="center">{stat.value}</Typography>
              <Typography color="text.secondary" align="center">{stat.label}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
