import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="grid" style={{ gap: 24 }}>
      <section className="card">
        <div className="row-between">
          <div>
            <h1>Base inicial de la aplicación</h1>
            <p className="muted">Proyecto listo para conectar con Supabase y desplegar en Vercel.</p>
          </div>
          <Link href="/dashboard" className="button">Entrar al dashboard</Link>
        </div>
      </section>
      <section className="grid grid-2">
        <div className="card">
          <h2>Módulos incluidos</h2>
          <ul>
            <li>Dashboard</li>
            <li>Calendario</li>
            <li>Reservas</li>
            <li>Clientes</li>
            <li>Perros</li>
            <li>Subida de foto con vista previa</li>
          </ul>
        </div>
        <div className="card">
          <h2>Siguiente paso</h2>
          <p className="muted">Configura Supabase, ejecuta el esquema SQL y añade las variables de entorno.</p>
        </div>
      </section>
    </div>
  )
}
