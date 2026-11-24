
import MainLayout from './layouts/MainLayout';
import HomeNavigation from './components/HomeNavigation';
import Dashboard from './features/dashboard/Dashboard';
import EmployeeList from './features/employees/EmployeeList';
import LeaveList from './features/leaves/LeaveList';
import PayrollList from './features/payroll/PayrollList';
import { useState } from 'react';

function App() {
  const [page, setPage] = useState('home');

  let content = null;
  if (page === 'dashboard') content = <Dashboard />;
  else if (page === 'employees') content = <EmployeeList />;
  else if (page === 'leaves') content = <LeaveList />;
  else if (page === 'payroll') content = <PayrollList />;
  else content = <HomeNavigation onNavigate={setPage} />;

  return (
    <MainLayout>
      {content}
    </MainLayout>
  );
}

export default App;
