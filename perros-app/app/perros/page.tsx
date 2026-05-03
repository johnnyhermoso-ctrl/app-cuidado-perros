import { PerrosManager } from '@/components/PerrosManager';
import { PageHeader } from '@/components/PageHeader';

export default function PerrosPage() {
  return (
    <div>
      <PageHeader title="Perros" description="Alta de perros, foto y listado real conectado a Supabase." />
      <PerrosManager />
    </div>
  );
}
