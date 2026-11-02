import { StudentFrame } from '@/components/campus/student-frame';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentFrame>{children}</StudentFrame>;
}
