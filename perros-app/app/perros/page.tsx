import { DogPhotoUpload } from '@/components/dog-photo-upload'

export default function PerrosPage() {
  return (
    <div className="grid" style={{ gap: 16 }}>
      <div>
        <h1>Perros</h1>
        <p className="muted">Ficha base y prueba de subida de foto con vista previa.</p>
      </div>
      <div className="grid grid-2">
        <div className="card">
          <h2>Toby</h2>
          <p className="muted">Mestizo · 4 años · Cliente: Ana Ruiz</p>
          <ul>
            <li>Medicación diaria</li>
            <li>Alergia alimentaria</li>
            <li>Reserva próxima: 12/04/2026</li>
          </ul>
        </div>
        <div className="card">
          <DogPhotoUpload />
        </div>
      </div>
    </div>
  )
}
