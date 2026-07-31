import { PageHeader } from '@/components/PageHeader';
import { ServiciosManager } from '@/components/ServiciosManager';

export default function ServiciosPage() {
  return (
    <div>
      <PageHeader title="Servicios" description="Configura los servicios disponibles y su unidad de cobro." />
      <ServiciosManager />
    </div>
  );
}
