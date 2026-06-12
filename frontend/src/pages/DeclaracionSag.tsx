import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Banner from '../components/layout/Banner'
import { mensajeDeError } from '../services/authService'
import { getIdViajeActivo, guardarSag, obtenerViaje } from '../services/viajeService'

const cardClass = 'mb-4 rounded-lg border border-gov-neutral bg-white p-5'
const cardTitleClass = 'mb-3 text-sm font-bold text-gov-black'
const inputClass =
  'mb-3.5 w-full rounded-md border border-gov-accent px-3 py-2.5 text-[15px] outline-none focus:border-gov-primary'
const labelClass = 'mb-1 block text-[13px] font-semibold text-gov-gray-a'

interface DetalleSag {
  vegetal: boolean
  animal: boolean
  alimentos: boolean
  detalle: string
}

/**
 * Declaración Jurada SAG (RF02). Las tres preguntas booleanas y el detalle
 * se serializan como JSON en el campo {@code productos} del modelo de datos.
 */
function DeclaracionSag() {
  const navigate = useNavigate()

  const [idViaje, setIdViaje] = useState<number | null>(null)
  const [cargandoInicial, setCargandoInicial] = useState(true)

  const [vegetal, setVegetal] = useState(false)
  const [animal, setAnimal] = useState(false)
  const [alimentos, setAlimentos] = useState(false)
  const [detalle, setDetalle] = useState('')

  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const activo = getIdViajeActivo()
    if (!activo) {
      navigate('/registro-viaje', { replace: true })
      return
    }
    setIdViaje(activo)
    obtenerViaje(activo)
      .then((viaje) => {
        if (viaje.sag?.productos) {
          try {
            const datos = JSON.parse(viaje.sag.productos) as Partial<DetalleSag>
            setVegetal(Boolean(datos.vegetal))
            setAnimal(Boolean(datos.animal))
            setAlimentos(Boolean(datos.alimentos))
            setDetalle(datos.detalle ?? '')
          } catch {
            // Declaración previa en formato no reconocido: se ignora.
          }
        }
      })
      .catch(() => {
        // Si no se puede cargar el expediente, se permite completar el formulario igual.
      })
      .finally(() => setCargandoInicial(false))
  }, [navigate])

  const requiereDetalle = vegetal || animal || alimentos

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!idViaje) {
      return
    }

    setCargando(true)
    try {
      const productos: DetalleSag = { vegetal, animal, alimentos, detalle }
      await guardarSag(idViaje, {
        declaraProductos: requiereDetalle,
        productos: JSON.stringify(productos),
      })
      navigate('/dashboard')
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }

  if (cargandoInicial) {
    return (
      <div className="min-h-screen bg-gov-neutral">
        <TopBar />
        <Banner />
        <main className="mx-auto max-w-[520px] px-4 py-6">
          <p className="text-gov-gray-a">Cargando…</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gov-neutral">
      <TopBar />
      <Banner />

      <main className="mx-auto max-w-[520px] px-4 py-6">
        <h1 className="mb-1 text-[22px] text-gov-black">Declaración Jurada SAG</h1>
        <p className="mt-0 text-sm text-gov-gray-b">
          RF02 — Declaración de productos regulados
        </p>

        <form onSubmit={onSubmit}>
          <div className={cardClass}>
            <div className={cardTitleClass}>Declaración</div>

            <div className="mb-3 rounded-md bg-estado-pendiente-bg px-3 py-2 text-[13px] text-estado-pendiente-text">
              ⚠️ La declaración falsa puede constituir delito según la normativa SAG vigente
            </div>

            <label className={labelClass}>¿Transporta productos de origen vegetal?</label>
            <select
              value={vegetal ? 'true' : 'false'}
              onChange={(e) => setVegetal(e.target.value === 'true')}
              className={inputClass}
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>

            <label className={labelClass}>¿Transporta animales o productos de origen animal?</label>
            <select
              value={animal ? 'true' : 'false'}
              onChange={(e) => setAnimal(e.target.value === 'true')}
              className={inputClass}
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>

            <label className={labelClass}>¿Transporta alimentos procesados?</label>
            <select
              value={alimentos ? 'true' : 'false'}
              onChange={(e) => setAlimentos(e.target.value === 'true')}
              className={inputClass}
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>

            {requiereDetalle && (
              <>
                <label className={labelClass}>Detalle de productos declarados</label>
                <textarea
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  placeholder="Describa los productos…"
                  className={`${inputClass} min-h-[80px] resize-y`}
                />
              </>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="mb-3 rounded-md bg-estado-rechazado-bg px-2.5 py-2 text-[13px] text-estado-rechazado-text"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className={`w-full rounded-md px-3 py-3 text-[15px] font-bold text-white ${
              cargando
                ? 'cursor-default bg-gov-accent'
                : 'cursor-pointer bg-gov-primary hover:bg-gov-primary-dark'
            }`}
          >
            {cargando ? 'Enviando…' : 'Firmar y Enviar Declaración'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-2 w-full cursor-pointer rounded-md bg-gov-neutral px-3 py-3 text-[15px] font-bold text-gov-gray-a"
          >
            Volver
          </button>
        </form>
      </main>
    </div>
  )
}

export default DeclaracionSag
