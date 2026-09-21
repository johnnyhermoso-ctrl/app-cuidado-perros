import { PageHeader } from '@/components/PageHeader';
import { RecurrenciasManager } from '@/components/RecurrenciasManager';

export default function RecurrenciasPage() {
  return (
    <div>
      <PageHeader
        title="Recurrencias"
        description="Programa paseos y otros servicios repetidos, con varios turnos y excepciones individuales."
      />
      <RecurrenciasManager />
    </div>
  );
}
