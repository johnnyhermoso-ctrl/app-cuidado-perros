import { PageHeader } from '@/components/PageHeader';
import { DashboardManager } from '@/components/DashboardManager';

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen de clientes, perros y próximas reservas." />
      <DashboardManager />
    </div>
  );
}
