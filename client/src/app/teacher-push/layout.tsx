'use client';

import { ClassScopeProvider } from '../../context/ClassScopeContext';

export default function TeacherPushLayout({ children }: { children: React.ReactNode }) {
  return <ClassScopeProvider>{children}</ClassScopeProvider>;
}
