'use client';

import { ClassScopeProvider } from '../../context/ClassScopeContext';

export default function TeacherDashboardLayout({ children }: { children: React.ReactNode }) {
  return <ClassScopeProvider>{children}</ClassScopeProvider>;
}
