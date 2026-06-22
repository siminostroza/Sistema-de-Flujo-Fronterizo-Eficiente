import { useEffect, useState } from 'react'

/**
 * Administración del sistema (RF06, RF09) — visible solo para ADMIN.
 * Reportes y gestión de usuarios son placeholders en el MVP.
 */
function Admin() {
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) {
      return
    }
    const id = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(id)
  }, [toast])

  const enDesarrollo = () => setToast('Funcionalidad en desarrollo')

  return (
    <div>
      <h1 className="mb-1 text-[22px] text-gov-black">Administración</h1>
      <p className="mb-5 text-sm text-gov-gray-b">
        RF06 / RF09 — Reportes y gestión del sistema
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Reportes */}
        <div className="rounded-lg border border-gov-neutral bg-white p-5">
          <div className="mb-3 text-sm font-bold text-gov-black">
            Reportes (RF06)
          </div>
          <p className="mb-4 text-[14px] text-gov-gray-a">
            Exporta el resumen de trámites y fiscalizaciones del paso.
          </p>
          <div className="flex gap-2">
            <button
              onClick={enDesarrollo}
              className="flex-1 cursor-pointer rounded-md bg-gov-primary px-3 py-2.5 text-[14px] font-bold text-white hover:bg-gov-primary-dark"
            >
              Exportar PDF
            </button>
            <button
              onClick={enDesarrollo}
              className="flex-1 cursor-pointer rounded-md bg-gov-green px-3 py-2.5 text-[14px] font-bold text-white hover:opacity-90"
            >
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Gestión de usuarios */}
        <div className="rounded-lg border border-gov-neutral bg-white p-5">
          <div className="mb-3 text-sm font-bold text-gov-black">
            Gestión de usuarios
          </div>
          <p className="mb-4 text-[14px] text-gov-gray-a">
            Alta, baja y asignación de roles de funcionarios.
          </p>
          <div className="rounded-md bg-gov-primary-light px-3 py-3 text-center text-[13px] font-semibold text-gov-tertiary">
            Próximamente
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-20 rounded-md bg-gov-tertiary px-4 py-3 text-[14px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

export default Admin
