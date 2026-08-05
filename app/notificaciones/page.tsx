import { PageHeader } from '@/components/PageHeader';
import { PushNotificationsManager } from '@/components/PushNotificationsManager';

export default function NotificacionesPage() {
  return <div><PageHeader title="Notificaciones" description="Instala la aplicación y activa los avisos push en cada dispositivo." /><PushNotificationsManager /></div>;
}
