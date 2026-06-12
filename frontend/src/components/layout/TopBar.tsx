/**
 * Cabecera obligatoria: banda GOB.CL, nombre SFFE e indicador institucional.
 */
function TopBar() {
  return (
    <header>
      {/* Banda superior GOB.CL */}
      <div className="bg-gov-tertiary px-4 py-1 text-xs font-bold tracking-wider text-white">
        GOB.CL
      </div>

      {/* Identidad SFFE */}
      <div className="border-b border-gov-neutral bg-white px-4 py-2.5">
        <div className="text-lg font-extrabold text-gov-tertiary">SFFE</div>
        <div className="text-xs text-gov-gray-b">
          Servicio Nacional de Aduanas · Gobierno de Chile
        </div>
      </div>
    </header>
  )
}

export default TopBar
