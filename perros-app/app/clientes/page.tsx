import { ClientesManager } from '@/components/ClientesManager';
import { PageHeader } from '@/components/PageHeader';

export default function ClientesPage() {
  return (
    <div>
      <PageHeader title="Clientes" description="Alta y listado real de clientes conectados a Supabase." />
      <ClientesManager />
    </div>
  );
}
