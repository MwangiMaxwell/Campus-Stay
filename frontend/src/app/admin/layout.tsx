import { AdminFrame } from '@/components/campus/admin-frame';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminFrame>{children}</AdminFrame>;
}
