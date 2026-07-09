import { useEffect, useState } from 'react'

/**
 * Input de fecha en formato dd/mm/aaaa. Un `<input type="date">` nativo
 * muestra mm/dd/aaaa o dd/mm/aaaa según la configuración regional del
 * navegador/SO, sin importar el idioma de la página — Chrome en particular
 * ignora el `lang` del documento para esto. Este componente reemplaza el
 * input nativo por uno de texto enmascarado que siempre se ve y se escribe
 * en dd/mm/aaaa, pero sigue entregando/recibiendo la fecha en formato ISO
 * (yyyy-mm-dd) hacia el resto de la app, igual que el input nativo.
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

  // Si el valor ISO cambia desde afuera (ej. al cargar un expediente guardado), refleja el texto.
  useEffect(() => {
    setTexto(aDDMMYYYY(value))
  }, [value])

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder="dd/mm/aaaa"
      maxLength={10}
      value={texto}
      onChange={manejarCambio}
      onFocus={onFocus}
      disabled={disabled}
      className={className}
    />
  )
}

export default DateInput
