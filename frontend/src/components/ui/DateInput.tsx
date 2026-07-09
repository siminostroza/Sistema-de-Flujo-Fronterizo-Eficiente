import { useEffect, useRef, useState } from 'react'

/**
 * Input de fecha en formato dd/mm/aaaa con selector de calendario. Un
 * `<input type="date">` nativo muestra mm/dd/aaaa o dd/mm/aaaa según la
 * configuración regional del navegador/SO, sin importar el idioma de la
 * página — Chrome en particular ignora el `lang` del documento para esto.
 *
 * Este componente combina un input de texto enmascarado (siempre se ve y se
 * escribe en dd/mm/aaaa) con un `<input type="date">` nativo oculto que solo
 * se usa para abrir el selector de calendario del navegador vía
 * `showPicker()`; al elegir una fecha ahí, se sincroniza de vuelta al texto.
 * Hacia el resto de la app entrega/recibe la fecha en ISO (yyyy-mm-dd),
 * igual que el input nativo.
 */

function aDDMMYYYY(iso: string): string {
  const partes = iso.split('-')
  if (partes.length !== 3) return ''
  const [anio, mes, dia] = partes
  if (!anio || !mes || !dia) return ''
  return `${dia}/${mes}/${anio}`
}

/** Convierte dd/mm/aaaa a ISO, validando que sea una fecha real (rechaza ej. 31/02). */
function aIso(ddmmyyyy: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddmmyyyy)
  if (!match) return ''
  const [, dia, mes, anio] = match
  const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia))
  const valida =
    fecha.getFullYear() === Number(anio) &&
    fecha.getMonth() === Number(mes) - 1 &&
    fecha.getDate() === Number(dia)
  return valida ? `${anio}-${mes}-${dia}` : ''
}

interface DateInputProps {
  id?: string
  /** Fecha en ISO (yyyy-mm-dd), o cadena vacía. */
  value: string
  /** Recibe ISO cuando el texto forma una fecha completa y válida; '' mientras se sigue escribiendo. */
  onChange: (isoValue: string) => void
  onFocus?: () => void
  disabled?: boolean
  className?: string
}

function DateInput({ id, value, onChange, onFocus, disabled, className }: DateInputProps) {
  const [texto, setTexto] = useState(() => aDDMMYYYY(value))
  const fechaNativaRef = useRef<HTMLInputElement>(null)

  // Si el valor ISO cambia desde afuera (ej. al cargar un expediente guardado), refleja el texto.
  useEffect(() => {
    setTexto(aDDMMYYYY(value))
  }, [value])

  const manejarCambioTexto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const soloDigitos = e.target.value.replace(/\D/g, '').slice(0, 8)
    let formateado = soloDigitos
    if (soloDigitos.length > 4) {
      formateado = `${soloDigitos.slice(0, 2)}/${soloDigitos.slice(2, 4)}/${soloDigitos.slice(4)}`
    } else if (soloDigitos.length > 2) {
      formateado = `${soloDigitos.slice(0, 2)}/${soloDigitos.slice(2)}`
    }
    setTexto(formateado)
    onChange(aIso(formateado))
  }

  const manejarCambioCalendario = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const abrirCalendario = () => {
    const el = fechaNativaRef.current
    if (!el || disabled) return
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker()
        return
      } catch {
        // Algunos navegadores lanzan si no es por un gesto directo del usuario; cae al focus.
      }
    }
    el.focus()
  }

  return (
    <div className={`${className} relative flex items-center gap-2 focus-within:border-gov-primary`}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        value={texto}
        onChange={manejarCambioTexto}
        onFocus={onFocus}
        disabled={disabled}
        className="min-w-0 flex-1 bg-transparent text-[15px] outline-none disabled:cursor-default"
      />
      <button
        type="button"
        onClick={abrirCalendario}
        disabled={disabled}
        aria-label="Abrir calendario"
        className="shrink-0 cursor-pointer text-[16px] leading-none text-gov-gray-b disabled:cursor-default disabled:opacity-50"
      >
        📅
      </button>
      <input
        ref={fechaNativaRef}
        type="date"
        value={value}
        onChange={manejarCambioCalendario}
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        className="absolute h-0 w-0 opacity-0"
      />
    </div>
  )
}

export default DateInput
