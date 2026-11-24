
import MainLayout from './layouts/MainLayout';
import HomeNavigation from './components/HomeNavigation';
import Dashboard from './features/dashboard/Dashboard';
import EmployeeList from './features/employees/EmployeeList';
import LeaveList from './features/leaves/LeaveList';
import PayrollList from './features/payroll/PayrollList';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Button, CircularProgress, Stack, TextField } from '@mui/material';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from './firebaseServices';

function App() {
  const [page, setPage] = useState('home');

  const [authorized, setAuthorized] = useState<boolean>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let sequence = 0;
    const stop = onAuthStateChanged(auth, async user => {
      const current = ++sequence;
      if (!user) {
        setAuthorized(false);
        setPage('home');
        return;
      }
      try {
        const profile = await getDocFromServer(doc(db, 'users', user.uid));
        if (current !== sequence) return;
        if (profile.get('active') === true && profile.get('role') === 'IT') {
          setAuthorized(true);
        } else {
          setError('الحساب غير مخوّل للوصول إلى الموارد البشرية.');
          await signOut(auth);
        }
      } catch {
        if (current !== sequence) return;
        setError('تعذر التحقق من صلاحيات الحساب.');
        setAuthorized(false);
      }
    });
    return () => { sequence++; stop(); };
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, globalThis.ALTADAMUN_LOGIN_EMAIL(String(fields.get('username'))), String(fields.get('password')));
    } catch {
      setError('تعذر تسجيل الدخول. تحقق من البيانات والاتصال.');
    } finally {
      setBusy(false);
    }
  }

  if (authorized === undefined) return <MainLayout><CircularProgress /></MainLayout>;
  if (!authorized) return (
    <MainLayout>
      <Stack component="form" onSubmit={login} spacing={2} maxWidth={420}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField name="username" label="اسم المستخدم" autoComplete="username" required />
        <TextField name="password" label="كلمة المرور" type="password" required />
        <Button type="submit" variant="contained" disabled={busy}>تسجيل الدخول</Button>
      </Stack>
    </MainLayout>
  );

  let content = null;
  if (page === 'dashboard') content = <Dashboard />;
  else if (page === 'employees') content = <EmployeeList />;
  else if (page === 'leaves') content = <LeaveList />;
  else if (page === 'payroll') content = <PayrollList />;
  else content = <HomeNavigation onNavigate={setPage} />;

  return (
    <MainLayout>
      <Button onClick={() => signOut(auth).catch(() => setError('تعذر تسجيل الخروج.'))}>تسجيل الخروج</Button>
      {error && <Alert severity="error">{error}</Alert>}
      {content}
    </MainLayout>
  );
}

export default App;
