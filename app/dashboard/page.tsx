import { PageHeader } from '@/components/PageHeader';
import { DashboardManager } from '@/components/DashboardManager';

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen operativo del negocio, ocupación, cobros y próximos movimientos." />
      <DashboardManager />
    </div>
  );
}
