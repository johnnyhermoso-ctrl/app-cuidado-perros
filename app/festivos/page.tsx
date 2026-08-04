import { FestivosManager } from '@/components/FestivosManager';
import { PageHeader } from '@/components/PageHeader';

export default function FestivosPage() {
  return <div><PageHeader title="Festivos" description="Gestiona el calendario de Madrid y el recargo automático de alojamiento." /><FestivosManager /></div>;
}
