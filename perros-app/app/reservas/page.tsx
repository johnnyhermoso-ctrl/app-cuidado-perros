import { Card, EmptyState } from '@/components/ui';

export default function ReservasPage() {
  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="page-header">
        <div>
          <h1>Reservas</h1>
          <p>Próxima fase: creación real de reservas y cálculo económico.</p>
        </div>
      </div>
      <Card>
        <EmptyState
          title="Módulo de reservas pendiente"
          text="Primero completamos clientes y perros. Después conectaremos reservas a la base de datos."
        />
      </Card>
    </div>
  );
}
