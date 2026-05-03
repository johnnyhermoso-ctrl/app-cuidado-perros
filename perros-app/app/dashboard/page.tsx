import { PageHeader } from '@/components/PageHeader';

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen operativo rápido de la app en esta fase." />
      <div className="grid stats">
        <section className="card"><div className="metricLabel">Clientes</div><div className="metricValue">Supabase</div><p className="muted">Alta y listado reales.</p></section>
        <section className="card"><div className="metricLabel">Perros</div><div className="metricValue">Storage</div><p className="muted">Con subida de foto.</p></section>
        <section className="card"><div className="metricLabel">Reservas</div><div className="metricValue">Activas</div><p className="muted">Creación y listado reales.</p></section>
        <section className="card"><div className="metricLabel">Siguiente fase</div><div className="metricValue">Cobros</div><p className="muted">Y cálculo de alojamiento.</p></section>
      </div>
      <div className="grid twoCols">
        <section className="card">
          <h2>Qué puedes probar ahora</h2>
          <ul>
            <li>Crear clientes y comprobar persistencia.</li>
            <li>Crear perros con o sin foto.</li>
            <li>Crear reservas seleccionando uno o varios perros.</li>
            <li>Recargar la app y confirmar que los datos siguen visibles.</li>
          </ul>
        </section>
        <section className="card">
          <h2>Recordatorios de configuración</h2>
          <div className="banner">Necesitas un bucket público llamado <strong>dog-photos</strong> para la subida de imágenes.</div>
          <p className="muted">Si en algún momento fallan las fotos, revisa también el nombre del bucket y las variables de entorno en Vercel.</p>
        </section>
      </div>
    </div>
  );
}
