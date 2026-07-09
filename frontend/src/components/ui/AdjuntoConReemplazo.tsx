import { useState } from 'react'
import AdjuntoViewer from './AdjuntoViewer'
import ReemplazarArchivoButton from './ReemplazarArchivoButton'

interface AdjuntoConReemplazoProps {
  url: string
  etiqueta: string
  puedeReemplazar: boolean
  onSubir: (archivo: File) => Promise<void>
}

/**
 * Miniatura de un adjunto ya guardado, con un botón "Reemplazar" opcional
 * (RF01/RF02/RF03: solo mientras el viaje sigue PENDIENTE). Cada instancia
 * lleva su propia versión local: al reemplazar, solo esa miniatura se
 * refresca (no todo el resto de los adjuntos de la página). Se usa tanto en
 * el wizard de registro (para poder revisar/corregir un documento ya subido
 * sin perder el resto del avance) como en la vista de estado del trámite.
 */
function AdjuntoConReemplazo({ url, etiqueta, puedeReemplazar, onSubir }: AdjuntoConReemplazoProps) {
  const [version, setVersion] = useState(0)
  return (
    <div className="flex flex-col items-center gap-1">
      <AdjuntoViewer key={version} url={url} etiqueta={etiqueta} />
      {puedeReemplazar && (
        <ReemplazarArchivoButton onSubir={onSubir} onReemplazado={() => setVersion((v) => v + 1)} />
      )}
    </div>
  )
}

export default AdjuntoConReemplazo
