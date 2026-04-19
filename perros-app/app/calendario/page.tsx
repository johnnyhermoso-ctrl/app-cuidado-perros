import { Card, EmptyState } from '@/components/ui';

export default function CalendarioPage() {
  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="page-header">
        <div>
          <h1>Calendario</h1>
          <p>Vista reservada para el siguiente bloque de desarrollo.</p>
        </div>
      </div>
      <Card>
        <EmptyState
          title="Calendario en construcción"
          text="La siguiente fase conectará reservas, ocupación y vista por día/semana/mes."
        />
      </Card>
    </div>
  );
}
