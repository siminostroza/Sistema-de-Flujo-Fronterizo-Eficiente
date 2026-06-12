import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Banner from '../components/layout/Banner'
import { mensajeDeError } from '../services/authService'
import { getIdViajeActivo, obtenerViaje, registrarVehiculo } from '../services/viajeService'

const cardClass = 'mb-4 rounded-lg border border-gov-neutral bg-white p-5'
const cardTitleClass = 'mb-3 text-sm font-bold text-gov-black'
const inputClass =
  'mb-3.5 w-full rounded-md border border-gov-accent px-3 py-2.5 text-[15px] outline-none focus:border-gov-primary'
const labelClass = 'mb-1 block text-[13px] font-semibold text-gov-gray-a'

const ANIO_MAX = new Date().getFullYear() + 1

/**
 * Registro de vehículo (RF03). Es un paso opcional dentro del flujo de
 * registro de viaje: el pasajero puede omitirlo y completarlo más tarde.
 */
function RegistroVehiculo() {
  const navigate = useNavigate()

  const [idViaje, setIdViaje] = useState<number | null>(null)
  const [cargandoInicial, setCargandoInicial] = useState(true)

  const [patente, setPatente] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [anio, setAnio] = useState('')

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
        if (viaje.vehiculo) {
          setPatente(viaje.vehiculo.patente)
          setMarca(viaje.vehiculo.marca)
          setModelo(viaje.vehiculo.modelo)
          setAnio(String(viaje.vehiculo.anio))
        }
      })
      .catch(() => {
        // Si no se puede cargar el expediente, se permite completar el formulario igual.
      })
      .finally(() => setCargandoInicial(false))
  }, [navigate])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!patente.trim() || !marca.trim() || !modelo.trim() || !anio) {
      setError('Completa todos los campos del vehículo')
      return
    }

    if (!idViaje) {
      return
    }

    setCargando(true)
    try {
      await registrarVehiculo(idViaje, {
        patente: patente.trim().toUpperCase(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        anio: Number(anio),
      })
      navigate('/declaracion-sag')
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
        <h1 className="mb-1 text-[22px] text-gov-black">Registro de Vehículo</h1>
        <p className="mt-0 text-sm text-gov-gray-b">
          RF03 — Datos del vehículo asociado al viaje (opcional)
        </p>

        <form onSubmit={onSubmit}>
          <div className={cardClass}>
            <div className={cardTitleClass}>Datos del Vehículo</div>

            <label className={labelClass} htmlFor="patente">
              Patente
            </label>
            <input
              id="patente"
              type="text"
              placeholder="Ej: ABCD12"
              value={patente}
              onChange={(e) => setPatente(e.target.value)}
              className={inputClass}
            />

            <label className={labelClass} htmlFor="marca">
              Marca
            </label>
            <input
              id="marca"
              type="text"
              placeholder="Ej: Toyota"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className={inputClass}
            />

            <label className={labelClass} htmlFor="modelo">
              Modelo
            </label>
            <input
              id="modelo"
              type="text"
              placeholder="Ej: Corolla"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className={inputClass}
            />

            <label className={labelClass} htmlFor="anio">
              Año
            </label>
            <input
              id="anio"
              type="number"
              placeholder="Ej: 2022"
              min={1990}
              max={ANIO_MAX}
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              className={inputClass}
            />
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
            {cargando ? 'Guardando…' : 'Guardar Vehículo'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/declaracion-sag')}
            className="mt-2 w-full cursor-pointer rounded-md bg-gov-neutral px-3 py-3 text-[15px] font-bold text-gov-gray-a"
          >
            Omitir
          </button>
        </form>
      </main>
    </div>
  )
}

export default RegistroVehiculo
