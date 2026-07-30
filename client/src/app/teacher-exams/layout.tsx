'use client';

import { ClassScopeProvider } from '../../context/ClassScopeContext';

export default function TeacherExamsLayout({ children }: { children: React.ReactNode }) {
  return <ClassScopeProvider>{children}</ClassScopeProvider>;
}
