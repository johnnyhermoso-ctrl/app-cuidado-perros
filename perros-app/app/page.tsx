import Link from 'next/link';
import { Card, StatCard } from '@/components/ui';

export default function HomePage() {
  return (
    <div className="grid" style={{ gap: 24 }}>
      <Card>
        <div className="hero">
          <div>
            <h1>Base inicial conectada a Supabase</h1>
            <p className="muted">Ya puedes empezar a gestionar clientes y perros con datos reales.</p>
          </div>
          <Link className="button" href="/dashboard">Entrar al dashboard</Link>
        </div>
      </Card>

      <div className="grid grid-3">
        <StatCard label="Módulo listo" value="Clientes" hint="Alta y listado conectados" />
        <StatCard label="Módulo listo" value="Perros" hint="Alta, listado y foto" />
        <StatCard label="Siguiente" value="Reservas" hint="Siguiente fase de construcción" />
      </div>

      <div className="grid grid-2">
        <Card title="Qué puedes hacer ya">
          <ul>
            <li>Crear clientes en Supabase desde la app.</li>
            <li>Crear perros vinculados a un cliente.</li>
            <li>Subir foto del perro al bucket <strong>dog-photos</strong>.</li>
            <li>Ver listados con datos reales.</li>
          </ul>
        </Card>
        <Card title="Siguiente paso recomendado">
          <p>Empieza por <strong>Clientes</strong> y después crea tus primeros perros con foto.</p>
        </Card>
      </div>
    </div>
  );
}
