import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole } from '@/lib/permissions';

export const revalidate = 0;

export default async function DashboardIndexPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (isStaffRole(user.role)) {
    redirect('/dashboard/admin');
  } else {
    redirect('/dashboard/student');
  }
}
