import { ReservaForm } from '@/components/reserva-form'

export default function ReservasPage() {
  return (
    <div className="grid" style={{ gap: 16 }}>
      <div>
        <h1>Reservas</h1>
        <p className="muted">Formulario base para crear y editar reservas.</p>
      </div>
      <ReservaForm />
    </div>
  )
}
