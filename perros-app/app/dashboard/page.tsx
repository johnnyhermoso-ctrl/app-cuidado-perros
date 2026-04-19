import Link from 'next/link';
import { Card, StatCard } from '@/components/ui';

export default function DashboardPage() {
  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen rápido del estado actual de la aplicación.</p>
        </div>
      </div>

      <div className="grid grid-3">
        <StatCard label="Estado" value="OK" hint="Conectada a Supabase" />
        <StatCard label="Fase actual" value="Clientes + Perros" hint="CRUD básico" />
        <StatCard label="Siguiente bloque" value="Reservas" hint="Próximo desarrollo" />
      </div>

      <div className="grid grid-2">
        <Card title="Accesos rápidos">
          <div className="inline">
            <Link href="/clientes" className="button">Ir a clientes</Link>
            <Link href="/perros" className="button secondary">Ir a perros</Link>
          </div>
        </Card>
        <Card title="Notas">
          <p>En esta fase el dashboard es simple. Se enriquecerá cuando conectemos reservas, cobros y ocupación.</p>
        </Card>
      </div>
    </div>
  );
}
