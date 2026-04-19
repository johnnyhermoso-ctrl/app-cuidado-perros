'use client'

import { ChangeEvent, useState } from 'react'

export function DogPhotoUpload() {
  const [preview, setPreview] = useState<string | null>(null)

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  return (
    <div className="grid" style={{ gap: 12 }}>
      <h2>Foto del perro</h2>
      <p className="muted">Desde móvil suele permitir cámara o galería según el dispositivo.</p>
      <input className="input" type="file" accept="image/*" capture="environment" onChange={onChange} />
      {preview ? (
        <div className="grid" style={{ gap: 8 }}>
          <div className="muted">Vista previa</div>
          <img src={preview} alt="Vista previa" className="preview" />
          <div className="row">
            <button className="button secondary" onClick={() => setPreview(null)}>Elegir otra</button>
            <button className="button">Guardar foto</button>
          </div>
        </div>
      ) : (
        <div className="muted">Aún no hay imagen seleccionada.</div>
      )}
    </div>
  )
}
