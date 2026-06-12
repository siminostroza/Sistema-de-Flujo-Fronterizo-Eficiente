import { useAuth } from '../context/AuthContext'

/**
 * Panel de funcionario (placeholder de la Sesión 3). Layout desktop con
 * sidebar fijo de 220px. El módulo de fiscalización real llega en la Sesión 6.
 */
function Fiscalizacion() {
  const { sesion, logout } = useAuth()

  return (
    <div className="grid min-h-screen grid-cols-[220px_1fr]">
      <aside className="bg-gov-tertiary p-4 text-white">
        <div className="text-lg font-extrabold">SFFE</div>
        <div className="mb-6 text-xs text-gov-accent">Panel institucional</div>
        <nav className="flex flex-col gap-2 text-sm">
          <span>Fiscalización</span>
          <span>Historial</span>
        </nav>
      </aside>

      <section className="bg-gov-neutral p-6">
        <div className="mb-4 rounded-md bg-estado-pendiente-bg px-3 py-1.5 text-xs text-estado-pendiente-text">
          ⚠️ Prototipo académico DuocUC — No es un sistema oficial del Estado de Chile
        </div>
        <h1 className="text-[22px] text-gov-black">
          {sesion?.nombre} · {sesion?.rol}
        </h1>
        <p className="text-gov-gray-a">
          Módulo de control fronterizo (en construcción).
        </p>
        <button
          onClick={logout}
          className="cursor-pointer rounded-md bg-gov-secondary px-4 py-2.5 text-white"
        >
          Cerrar sesión
        </button>
      </section>
    </div>
  )
}

export default Fiscalizacion
