"use client";

import { useRole } from '@/lib/role-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { HRDashboard } from '@/components/hr-dashboard';
import { ManagerDashboard } from '@/components/manager-dashboard';
import { EmployeeDashboard } from '@/components/employee-dashboard';

export default function DashboardPage() {
  const { currentRole } = useRole();

  return (
    <DashboardLayout>
      {currentRole === 'hr' && <HRDashboard />}
      {currentRole === 'manager' && <ManagerDashboard />}
      {currentRole === 'employee' && <EmployeeDashboard />}
    </DashboardLayout>
  );
}
