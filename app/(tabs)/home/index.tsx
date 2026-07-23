import { useUser } from '@/contexts/UserContext';
import { Redirect } from 'expo-router';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import InstructorDashboard from '@/components/dashboard/InstructorDashboard';

export default function Home() {
  const { user, isInstructor, isAdmin } = useUser();

  // Redirect admin to admin dashboard
  if (isAdmin) {
    return <Redirect href="/(admin)/home/index" />;
  }

  if (isInstructor) {
    return <InstructorDashboard />;
  }

  return <StudentDashboard />;
}