import { ClientesPageClient } from '@/components/clientes-page';

export default function ClientesPage() {
  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p>Alta y listado conectados a Supabase.</p>
        </div>
      </div>
      <ClientesPageClient />
    </div>
  );
}
