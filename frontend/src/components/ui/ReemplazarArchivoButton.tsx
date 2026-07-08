import { useRef, useState } from 'react'
import { mensajeDeError } from '../../services/authService'

interface ReemplazarArchivoButtonProps {
  /** Sube el archivo seleccionado; debe lanzar si falla. */
  onSubir: (archivo: File) => Promise<void>
  /** Se llama tras un reemplazo exitoso, para refrescar la miniatura. */
  onReemplazado: () => void
}

/**
 * Botón "Reemplazar" junto a un adjunto ya guardado (RF01, RF02, RF03): abre
 * el selector de archivos nativo y sube el reemplazo. Solo se muestra
 * mientras el viaje sigue PENDIENTE (el backend igual lo revalida).
 */
function ReemplazarArchivoButton({ onSubir, onReemplazado }: ReemplazarArchivoButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  const onSeleccion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return

    setSubiendo(true)
    setError('')
    try {
      await onSubir(archivo)
      onReemplazado()
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={onSeleccion}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={subiendo}
        className="cursor-pointer text-[10px] font-semibold text-gov-primary underline disabled:cursor-default disabled:opacity-60"
      >
        {subiendo ? 'Subiendo…' : 'Reemplazar'}
      </button>
      {error && <span className="max-w-16 text-center text-[9px] text-estado-rechazado-text">{error}</span>}
    </div>
  )
}

export default ReemplazarArchivoButton
