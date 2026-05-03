import { ReservasManager } from '@/components/ReservasManager';
import { PageHeader } from '@/components/PageHeader';

export default function ReservasPage() {
  return (
    <div>
      <PageHeader title="Reservas" description="Creación real de reservas conectadas a Supabase, con cliente, perros y servicio." />
      <ReservasManager />
    </div>
  );
}
