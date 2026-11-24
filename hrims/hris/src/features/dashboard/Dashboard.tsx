import { useEffect, useState } from 'react';
import { Alert, Card, CardContent, Grid, Typography } from '@mui/material';
import { collection, getCountFromServer } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../../firebaseServices';

export default function Dashboard() {
  const { t } = useTranslation();
  const [counts, setCounts] = useState<number[]>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all(['employees', 'leaves', 'payrolls'].map(name => getCountFromServer(collection(db, name))))
      .then(results => { if (active) setCounts(results.map(result => result.data().count)); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);

  if (failed) return <Alert severity="error">تعذر تحميل بيانات الموارد البشرية.</Alert>;
  if (!counts) return <Typography role="status">جاري تحميل البيانات...</Typography>;
  return (
    <Grid container spacing={3}>
      {['employees', 'leaves', 'payroll'].map((key, index) => (
        <Grid size={{ xs: 12, sm: 4 }} key={key}>
          <Card>
            <CardContent>
              <Typography variant="h5" align="center">{counts[index]}</Typography>
              <Typography color="text.secondary" align="center">{t('app.' + key)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
