import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Banner from '../components/layout/Banner'
import { mensajeDeError } from '../services/authService'
import {
  agregarMenor,
  actualizarViaje,
  crearViaje,
  getIdViajeActivo,
  obtenerViaje,
  setIdViajeActivo,
  type EstadoViaje,
  type MenorInfo,
} from '../services/viajeService'
import { validarRut } from '../utils/rut'
import { estadoBadge } from '../utils/estado'

const PASOS_FRONTERIZOS = ['Los Libertadores', 'Chungará', 'Pino Hachado', 'Pehuenche']
const MOTIVOS = ['Turismo', 'Trabajo', 'Estudio', 'Tránsito']

const cardClass = 'mb-4 rounded-lg border border-gov-neutral bg-white p-5'
const cardTitleClass = 'mb-3 text-sm font-bold text-gov-black'
const inputClass =
  'mb-3.5 w-full rounded-md border border-gov-accent px-3 py-2.5 text-[15px] outline-none focus:border-gov-primary'
const labelClass = 'mb-1 block text-[13px] font-semibold text-gov-gray-a'

interface MenorForm {
  nombre: string
  rut: string
  fechaNacimiento: string
  requiereAutorizacion: boolean
}

const menorVacio: MenorForm = {
  nombre: '',
  rut: '',
  fechaNacimiento: '',
  requiereAutorizacion: false,
}

/**
 * Registro de viaje (RF02): datos del itinerario y menores de edad opcionales.
 * Si ya existe un expediente en curso (guardado en localStorage), se carga
 * para edición; de lo contrario se crea uno nuevo al guardar.
 */
function RegistroViaje() {
  const navigate = useNavigate()

  const [idViaje, setIdViaje] = useState<number | null>(null)
  const [estadoActual, setEstadoActual] = useState<EstadoViaje | null>(null)
  const [menoresGuardados, setMenoresGuardados] = useState<MenorInfo[]>([])
  const [cargandoInicial, setCargandoInicial] = useState(true)

  const [fechaIngreso, setFechaIngreso] = useState('')
  const [destino, setDestino] = useState('')
  const [pasoFronterizo, setPasoFronterizo] = useState('')
  const [motivoViaje, setMotivoViaje] = useState('')

  const [menoresNuevos, setMenoresNuevos] = useState<MenorForm[]>([])

  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const activo = getIdViajeActivo()
    if (!activo) {
      setCargandoInicial(false)
      return
    }
    obtenerViaje(activo)
      .then((viaje) => {
        setIdViaje(viaje.idViaje)
        setEstadoActual(viaje.estado)
        setFechaIngreso(viaje.fechaIngreso)
        setDestino(viaje.destino)
        setPasoFronterizo(viaje.pasoFronterizo)
        setMotivoViaje(viaje.motivoViaje)
        setMenoresGuardados(viaje.menores)
      })
      .catch(() => {
        // El expediente guardado ya no existe: se permite crear uno nuevo.
      })
      .finally(() => setCargandoInicial(false))
  }, [])

  const agregarFilaMenor = () => setMenoresNuevos((prev) => [...prev, { ...menorVacio }])

  const quitarFilaMenor = (index: number) =>
    setMenoresNuevos((prev) => prev.filter((_, i) => i !== index))

  const actualizarFilaMenor = (
    index: number,
    campo: keyof MenorForm,
    valor: string | boolean,
  ) =>
    setMenoresNuevos((prev) =>
      prev.map((menor, i) => (i === index ? { ...menor, [campo]: valor } : menor)),
    )

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!fechaIngreso || !destino.trim() || !pasoFronterizo || !motivoViaje) {
      setError('Completa todos los campos del viaje')
      return
    }

    for (const menor of menoresNuevos) {
      if (!menor.nombre.trim() || !menor.rut.trim() || !menor.fechaNacimiento) {
        setError('Completa todos los datos de los menores agregados')
        return
      }
      if (!validarRut(menor.rut)) {
        setError(`El RUT del menor "${menor.nombre}" no es válido`)
        return
      }
    }

    setCargando(true)
    try {
      const payload = {
        fechaIngreso,
        destino: destino.trim(),
        pasoFronterizo,
        motivoViaje,
      }

      const viaje = idViaje
        ? await actualizarViaje(idViaje, payload)
        : await crearViaje(payload)

      setIdViajeActivo(viaje.idViaje)

      for (const menor of menoresNuevos) {
        await agregarMenor(viaje.idViaje, menor)
      }

      navigate('/registro-vehiculo')
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

  const badge = estadoActual ? estadoBadge(estadoActual) : null

  return (
    <div className="min-h-screen bg-gov-neutral">
      <TopBar />
      <Banner />

      <main className="mx-auto max-w-[520px] px-4 py-6">
        <h1 className="mb-1 text-[22px] text-gov-black">Registro de Viaje</h1>
        <p className="mt-0 text-sm text-gov-gray-b">
          RF02 — Datos del expediente de viaje
        </p>

        {badge && (
          <div className={`mb-4 rounded-md px-3 py-2 text-center text-[13px] font-semibold ${badge.clases}`}>
            {badge.texto} · Expediente N° {idViaje}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className={cardClass}>
            <div className={cardTitleClass}>Datos del Viaje</div>

            <label className={labelClass} htmlFor="fechaIngreso">
              Fecha de Ingreso
            </label>
            <input
              id="fechaIngreso"
              type="date"
              value={fechaIngreso}
              onChange={(e) => setFechaIngreso(e.target.value)}
              className={inputClass}
            />

            <label className={labelClass} htmlFor="destino">
              Destino
            </label>
            <input
              id="destino"
              type="text"
              placeholder="Ej: Buenos Aires, Argentina"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              className={inputClass}
            />

            <label className={labelClass} htmlFor="pasoFronterizo">
              Paso Fronterizo
            </label>
            <select
              id="pasoFronterizo"
              value={pasoFronterizo}
              onChange={(e) => setPasoFronterizo(e.target.value)}
              className={inputClass}
            >
              <option value="">Seleccionar…</option>
              {PASOS_FRONTERIZOS.map((paso) => (
                <option key={paso} value={paso}>
                  {paso}
                </option>
              ))}
            </select>

            <label className={labelClass} htmlFor="motivoViaje">
              Motivo del Viaje
            </label>
            <select
              id="motivoViaje"
              value={motivoViaje}
              onChange={(e) => setMotivoViaje(e.target.value)}
              className={inputClass}
            >
              <option value="">Seleccionar…</option>
              {MOTIVOS.map((motivo) => (
                <option key={motivo} value={motivo}>
                  {motivo}
                </option>
              ))}
            </select>
          </div>

          <div className={cardClass}>
            <div className={cardTitleClass}>Menores de Edad (RF02)</div>
            <div className="mb-3 rounded-md bg-gov-primary-light px-3 py-2 text-[13px] text-gov-primary-dark">
              Si viaja con menores de edad, agrégalos aquí. Este paso es opcional.
            </div>

            {menoresGuardados.length > 0 && (
              <ul className="mb-3 list-none">
                {menoresGuardados.map((menor) => (
                  <li
                    key={menor.idMenor}
                    className="mb-2 rounded-md border border-gov-neutral bg-gov-neutral px-3 py-2 text-[13px] text-gov-gray-a"
                  >
                    <span className="font-semibold text-gov-black">{menor.nombre}</span>
                    {' · '}
                    {menor.rut}
                    {' · '}
                    {menor.requiereAutorizacion ? 'Requiere autorización' : 'No requiere autorización'}
                  </li>
                ))}
              </ul>
            )}

            {menoresNuevos.map((menor, index) => (
              <div key={index} className="mb-3 rounded-md border border-gov-accent p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-gov-gray-a">
                    Menor {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => quitarFilaMenor(index)}
                    className="cursor-pointer text-[13px] font-semibold text-gov-secondary"
                  >
                    Quitar
                  </button>
                </div>

                <label className={labelClass}>Nombre del Menor</label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={menor.nombre}
                  onChange={(e) => actualizarFilaMenor(index, 'nombre', e.target.value)}
                  className={inputClass}
                />

                <label className={labelClass}>RUT del Menor</label>
                <input
                  type="text"
                  placeholder="12345678-9"
                  value={menor.rut}
                  onChange={(e) => actualizarFilaMenor(index, 'rut', e.target.value)}
                  className={inputClass}
                />

                <label className={labelClass}>Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={menor.fechaNacimiento}
                  onChange={(e) => actualizarFilaMenor(index, 'fechaNacimiento', e.target.value)}
                  className={inputClass}
                />

                <label className={labelClass}>¿Requiere Autorización Notarial?</label>
                <select
                  value={menor.requiereAutorizacion ? 'true' : 'false'}
                  onChange={(e) =>
                    actualizarFilaMenor(index, 'requiereAutorizacion', e.target.value === 'true')
                  }
                  className={inputClass}
                >
                  <option value="false">No requiere</option>
                  <option value="true">Sí requiere</option>
                </select>
              </div>
            ))}

            <button
              type="button"
              onClick={agregarFilaMenor}
              className="w-full cursor-pointer rounded-md border border-dashed border-gov-primary px-3 py-2.5 text-[13px] font-semibold text-gov-primary"
            >
              + Agregar menor
            </button>
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
            {cargando ? 'Guardando…' : 'Guardar Viaje'}
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

export default RegistroViaje
