import { useEffect, useState } from 'react'
import api from '../../services/api'

interface AdjuntoViewerProps {
  /** Ruta relativa al backend (ya incluye /api vía la instancia axios). */
  url: string
  /** Nombre legible del documento, usado como título accesible y en el visor ampliado. */
  etiqueta: string
}

/**
 * Miniatura de un archivo adjunto (carnet, permiso, certificado, etc.) que al
 * hacer click se amplía a pantalla casi completa con el fondo difuminado. Se
 * cierra con la "×", con Escape o haciendo click fuera del recuadro. Los PDF
 * de más de una página solo muestran la primera en la miniatura; ampliados,
 * el visor nativo del navegador permite desplazarse por el resto.
 */
function AdjuntoViewer({ url, etiqueta }: AdjuntoViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [contentType, setContentType] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [ampliado, setAmpliado] = useState(false)

  useEffect(() => {
    let cancelado = false
    let objectUrl: string | null = null

    setCargando(true)
    setError(false)
    api
      .get(url, { responseType: 'blob' })
      .then((respuesta) => {
        if (cancelado) return
        const tipo = respuesta.headers['content-type'] ?? respuesta.data.type
        objectUrl = URL.createObjectURL(respuesta.data)
        setContentType(tipo)
        setBlobUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelado) setError(true)
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  // Escape cierra el visor ampliado; bloquea el scroll de fondo mientras está abierto.
  useEffect(() => {
    if (!ampliado) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAmpliado(false)
    }
    window.addEventListener('keydown', onKeyDown)
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflowPrevio
    }
  }, [ampliado])

  const esPdf = contentType.includes('pdf')

  return (
    <>
      <button
        type="button"
        onClick={() => blobUrl && setAmpliado(true)}
        disabled={!blobUrl}
        aria-label={`Ver ${etiqueta}`}
        title={etiqueta}
        className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border border-gov-accent bg-gov-neutral disabled:cursor-default"
      >
        {cargando && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gov-primary border-t-transparent" />
          </span>
        )}
        {!cargando && error && (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-estado-rechazado-text">
            Error
          </span>
        )}
        {!cargando && blobUrl && (
          esPdf ? (
            <embed src={blobUrl} type="application/pdf" className="pointer-events-none h-full w-full" />
          ) : (
            <img src={blobUrl} alt={etiqueta} className="h-full w-full object-cover" />
          )
        )}
      </button>

      {ampliado && blobUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={etiqueta}
          onClick={() => setAmpliado(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[92vh] w-[92vw] max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gov-neutral px-4 py-3">
              <span className="text-[14px] font-bold text-gov-black">{etiqueta}</span>
              <button
                type="button"
                onClick={() => setAmpliado(false)}
                aria-label="Cerrar"
                className="cursor-pointer rounded-full px-3 py-1 text-[20px] leading-none text-gov-gray-a hover:bg-gov-neutral"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gov-neutral">
              {esPdf ? (
                <embed src={blobUrl} type="application/pdf" className="h-full w-full" />
              ) : (
                <img src={blobUrl} alt={etiqueta} className="mx-auto max-w-full" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdjuntoViewer
