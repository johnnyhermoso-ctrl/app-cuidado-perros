export default function ClientesPage() {
  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="row-between">
        <div>
          <h1>Clientes</h1>
          <p className="muted">Listado inicial de clientes.</p>
        </div>
        <button className="button">+ Nuevo cliente</button>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Cliente</th><th>Teléfono</th><th>Perros</th><th>Pendiente</th></tr></thead>
          <tbody>
            <tr><td>Ana Ruiz</td><td>600 123 123</td><td>1</td><td>25 €</td></tr>
            <tr><td>Marta León</td><td>611 222 333</td><td>2</td><td>0 €</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
