export default function CalendarioPage() {
  const dias = Array.from({ length: 30 }, (_, i) => i + 1)
  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="row-between">
        <div>
          <h1>Calendario</h1>
          <p className="muted">Vista base de ocupación y reservas.</p>
        </div>
        <button className="button">+ Nueva reserva</button>
      </div>
      <div className="card">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {dias.map((d) => (
            <div key={d} className="card" style={{ padding: 12, borderRadius: 12 }}>
              <div className="row-between"><strong>{d}</strong><span className="badge">{(d % 5) + 1}/5</span></div>
              <div className="muted" style={{ marginTop: 8 }}>Toby</div>
              <div className="muted">+2 reservas</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
