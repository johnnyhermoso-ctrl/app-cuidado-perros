import { CobrosManager } from '@/components/CobrosManager';
import { PageHeader } from '@/components/PageHeader';

export default function CobrosPage() {
  return <div><PageHeader title="Cobros" description="Gestiona ajustes, pagos parciales y saldos pendientes." /><CobrosManager /></div>;
}
