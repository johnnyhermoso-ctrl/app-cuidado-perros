'use client'

import { useMemo, useState } from 'react'

export function ReservaForm() {
  const [entrada, setEntrada] = useState('2026-04-18T16:00')
  const [salida, setSalida] = useState('2026-04-20T17:00')
  const [ajuste, setAjuste] = useState(0)

  const calculo = useMemo(() => {
    const start = new Date(entrada)
    const end = new Date(salida)
    const ms = end.getTime() - start.getTime()
    const noches = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
    const subtotal = noches * 25
    const total = subtotal + ajuste
    return { noches, subtotal, total }
  }, [entrada, salida, ajuste])

  return (
    <div className="grid grid-2">
      <div className="card grid" style={{ gap: 12 }}>
        <h2>Nueva reserva</h2>
        <label>
          <div className="muted">Cliente</div>
          <input className="input" defaultValue="Ana Ruiz" />
        </label>
        <label>
          <div className="muted">Perros</div>
          <input className="input" defaultValue="Toby" />
        </label>
        <label>
          <div className="muted">Servicio</div>
          <select className="select" defaultValue="alojamiento">
            <option value="alojamiento">Alojamiento</option>
            <option value="guarderia">Guardería</option>
            <option value="paseo">Paseo</option>
          </select>
        </label>
        <label>
          <div className="muted">Fecha y hora estimada de llegada</div>
          <input className="input" type="datetime-local" value={entrada} onChange={(e) => setEntrada(e.target.value)} />
        </label>
        <label>
          <div className="muted">Fecha y hora estimada de salida</div>
          <input className="input" type="datetime-local" value={salida} onChange={(e) => setSalida(e.target.value)} />
        </label>
        <label>
          <div className="muted">Ajuste manual (€)</div>
          <input className="input" type="number" value={ajuste} onChange={(e) => setAjuste(Number(e.target.value))} />
        </label>
        <label>
          <div className="muted">Observaciones</div>
          <textarea className="textarea" placeholder="Notas de la reserva" />
        </label>
        <div className="row"><button className="button">Guardar</button><button className="button secondary">Confirmar</button></div>
      </div>
      <div className="card grid" style={{ gap: 12 }}>
        <h2>Resumen automático</h2>
        <div className="row-between"><span>Noches</span><strong>{calculo.noches}</strong></div>
        <div className="row-between"><span>Tarifa base</span><strong>25 €/noche</strong></div>
        <div className="row-between"><span>Subtotal</span><strong>{calculo.subtotal} €</strong></div>
        <div className="row-between"><span>Ajuste manual</span><strong>{ajuste} €</strong></div>
        <hr style={{ border: 0, borderTop: '1px solid var(--border)', width: '100%' }} />
        <div className="row-between"><span>Total</span><strong>{calculo.total} €</strong></div>
        <div className="badge">Margen cortesía alojamiento: 2 horas</div>
      </div>
    </div>
  )
}
