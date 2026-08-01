import { CalendarManager } from '@/components/CalendarManager';
import { PageHeader } from '@/components/PageHeader';

export default function CalendarioPage() {
  return (
    <div>
      <PageHeader
        title="Calendario"
        description="Consulta entradas, salidas y ocupación diaria a partir de las reservas reales."
      />
      <CalendarManager />
    </div>
  );
}
