import { Redirect } from 'expo-router';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import { useUser } from '@/contexts/UserContext';

export default function AdminHome() {
  const { isAdmin } = useUser();

  // Protect admin route - redirect non-admins
  if (!isAdmin) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <AdminDashboard />;
}