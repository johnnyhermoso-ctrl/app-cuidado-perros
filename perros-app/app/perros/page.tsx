import { PerrosPageClient } from '@/components/perros-page';

export default function PerrosPage() {
  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="page-header">
        <div>
          <h1>Perros</h1>
          <p>Alta, listado y foto real del perro con almacenamiento en Supabase.</p>
        </div>
      </div>
      <PerrosPageClient />
    </div>
  );
}
