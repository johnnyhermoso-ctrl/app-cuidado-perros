export default function DashboardPage() {
  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="row-between">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Centro de mando diario.</p>
        </div>
        <button className="button">+ Nueva reserva</button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {[
          ['Alojados hoy', '4'],
          ['Entradas hoy', '2'],
          ['Salidas hoy', '1'],
          ['Ocupación', '4/5'],
          ['Pendiente cobro', '45 €']
        ].map(([label, value]) => (
          <div className="card" key={label}>
            <div className="muted">{label}</div>
            <div className="kpi">{value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-2">
        <div className="card">
          <h2>Entradas de hoy</h2>
          <table className="table"><tbody>
            <tr><td>16:00</td><td>Ana Ruiz</td><td>Toby</td><td><button className="button secondary">Check-in</button></td></tr>
            <tr><td>18:30</td><td>Marta León</td><td>Kira, Nala</td><td><button className="button secondary">Abrir</button></td></tr>
          </tbody></table>
        </div>
        <div className="card">
          <h2>Alertas</h2>
          <ul>
            <li>1 salida puede generar guardería</li>
            <li>1 perro con medicación</li>
            <li>Hoy es festivo en Madrid</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
