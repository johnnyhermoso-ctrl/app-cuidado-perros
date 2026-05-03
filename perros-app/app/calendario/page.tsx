import { PageHeader } from '@/components/PageHeader';

export default function CalendarioPage() {
  return (
    <div>
      <PageHeader title="Calendario" description="Vista provisional. En la siguiente fase se conectará a las reservas reales." />
      <section className="card">
        <h2>Estado actual</h2>
        <p className="muted">
          Esta pantalla queda como placeholder visual. La siguiente construcción conectará el calendario con las reservas creadas
          y mostrará ocupación por día, entradas y salidas.
        </p>
      </section>
    </div>
  );
}
