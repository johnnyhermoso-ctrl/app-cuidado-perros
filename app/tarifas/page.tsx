import { PageHeader } from '@/components/PageHeader';
import { TarifasManager } from '@/components/TarifasManager';

export default function TarifasPage() {
  return (
    <div>
      <PageHeader title="Tarifas" description="Configura precios generales y sus periodos de vigencia." />
      <TarifasManager />
    </div>
  );
}
