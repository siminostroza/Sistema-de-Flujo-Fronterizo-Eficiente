import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Banner from '../components/layout/Banner'
import Footer from '../components/layout/Footer'
import WizardStepper from '../components/ui/WizardStepper'
import DateInput from '../components/ui/DateInput'
import AdjuntoConReemplazo from '../components/ui/AdjuntoConReemplazo'
import { mensajeDeError } from '../services/authService'
import {
  agregarMascota,
  agregarMenor,
  actualizarMascota,
  actualizarMenor,
  actualizarViaje,
  crearViaje,
  eliminarMascota,
  eliminarMenor,
  guardarSag,
  getIdViajeActivo,
  numeroExpediente,
  obtenerViaje,
  registrarVehiculo,
  reemplazarArchivoMenor,
  reemplazarArchivoMascota,
  reemplazarArchivoVehiculo,
  setIdViajeActivo,
  vehiculoPrincipal,
  vehiculoRemolque,
  type MascotaInfo,
  type MenorInfo,
} from '../services/viajeService'
import { obtenerQR, type QrResponse } from '../services/qrService'
import { validarRut, formatearRutInput, calcularDigitoVerificador } from '../utils/rut'

const PASOS_FRONTERIZOS = ['Los Libertadores', 'Chungará', 'Pino Hachado', 'Pehuenche']
const MOTIVOS = ['Turismo', 'Trabajo', 'Estudio', 'Tránsito']
const MONEDAS = ['USD', 'EUR', 'CLP', 'ARS']

const STEPS = ['Viaje', 'Vehículo', 'Declaración', 'Código QR', 'Finalizar']

const cardClass = 'mb-4 rounded-lg border border-gov-neutral bg-white p-5'
const cardTitleClass = 'mb-3 text-sm font-bold text-gov-black'
const inputBaseClass =
  'mb-3.5 w-full rounded-md border px-3 py-2.5 text-[15px] outline-none focus:border-gov-primary'
const inputClass = `${inputBaseClass} border-gov-accent`
const labelClass = 'mb-1 block text-[13px] font-semibold text-gov-gray-a'
const btnPrimario =
  'w-full rounded-md px-3 py-3 text-[15px] font-bold text-white cursor-pointer bg-gov-primary hover:bg-gov-primary-dark disabled:cursor-default disabled:bg-gov-accent'
const btnSecundario =
  'mt-2 w-full cursor-pointer rounded-md bg-gov-neutral px-3 py-3 text-[15px] font-bold text-gov-gray-a'

/** Mensaje de error de un paso, siempre justo encima de su botón principal. */
function ErrorPaso({ mensaje }: { mensaje: string }) {
  if (!mensaje) return null
  return (
    <p
      role="alert"
      className="mb-3 rounded-md bg-estado-rechazado-bg px-2.5 py-2 text-[13px] text-estado-rechazado-text"
    >
      {mensaje}
    </p>
  )
}

interface MenorForm {
  nombre: string
  rut: string
  fechaNacimiento: string
  requiereAutorizacion: boolean
  carnetIdentidad: File | null
  papelesAntecedentes: File | null
  permisoNotarial: File | null
}

const menorVacio: MenorForm = {
  nombre: '',
  rut: '',
  fechaNacimiento: '',
  requiereAutorizacion: false,
  carnetIdentidad: null,
  papelesAntecedentes: null,
  permisoNotarial: null,
}

/** true si, a la fecha de ingreso del viaje, la persona tendría menos de 18 años. */
function esMenorDeEdad(fechaNacimiento: string, fechaIngreso: string): boolean {
  const nacimiento = new Date(fechaNacimiento)
  const limite = new Date(fechaIngreso)
  limite.setFullYear(limite.getFullYear() - 18)
  return nacimiento > limite
}

/**
 * Card de un menor ya guardado, con edición NO destructiva: "Editar" solo
 * abre un formulario local con los datos actuales; nada se envía al backend
 * hasta apretar "Guardar cambios", y "Cancelar" descarta el borrador sin
 * tocar lo guardado. Solo actualiza texto (PUT, sin archivos) — los
 * documentos se ven/reemplazan aparte con AdjuntoConReemplazo, siempre
 * visibles tanto en modo lectura como edición.
 */
function MenorGuardadoCard({
  menor,
  idViaje,
  fechaIngreso,
  onActualizado,
  onEliminar,
  eliminando,
}: {
  menor: MenorInfo
  idViaje: number
  fechaIngreso: string
  onActualizado: (menores: MenorInfo[]) => void
  onEliminar: (idMenor: number) => void
  eliminando: boolean
}) {
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(menor.nombre)
  const [rut, setRut] = useState(menor.rut)
  const [fechaNacimiento, setFechaNacimiento] = useState(menor.fechaNacimiento)
  const [requiereAutorizacion, setRequiereAutorizacion] = useState(menor.requiereAutorizacion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const iniciarEdicion = () => {
    setNombre(menor.nombre)
    setRut(menor.rut)
    setFechaNacimiento(menor.fechaNacimiento)
    setRequiereAutorizacion(menor.requiereAutorizacion)
    setError('')
    setEditando(true)
  }

  const guardar = async () => {
    setError('')
    if (!nombre.trim() || !rut.trim() || !fechaNacimiento) {
      setError('Completa todos los datos del menor')
      return
    }
    if (!validarRut(rut)) {
      const dvCorrecto = calcularDigitoVerificador(rut)
      const cuerpo = rut.split('-')[0]
      setError(
        dvCorrecto
          ? `El RUT no es válido (el dígito verificador de ${cuerpo} debería ser ${dvCorrecto})`
          : 'El RUT no es válido',
      )
      return
    }
    if (!esMenorDeEdad(fechaNacimiento, fechaIngreso)) {
      setError('La fecha de nacimiento no corresponde a un menor de edad')
      return
    }
    setGuardando(true)
    try {
      const viajeActualizado = await actualizarMenor(idViaje, menor.idMenor, {
        nombre: nombre.trim(),
        rut,
        fechaNacimiento,
        requiereAutorizacion,
      })
      onActualizado(viajeActualizado.menores)
      setEditando(false)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setGuardando(false)
    }
  }

  const documentos = (
    <div className="flex flex-wrap gap-3">
      <AdjuntoConReemplazo
        url={`/viajes/${idViaje}/archivos/menores/${menor.idMenor}/carnet-identidad`}
        etiqueta={`Carnet de identidad — ${menor.nombre}`}
        puedeReemplazar
        onSubir={(archivo) => reemplazarArchivoMenor(idViaje, menor.idMenor, 'carnet-identidad', archivo)}
      />
      <AdjuntoConReemplazo
        url={`/viajes/${idViaje}/archivos/menores/${menor.idMenor}/papeles-antecedentes`}
        etiqueta={`Papeles de antecedentes — ${menor.nombre}`}
        puedeReemplazar
        onSubir={(archivo) => reemplazarArchivoMenor(idViaje, menor.idMenor, 'papeles-antecedentes', archivo)}
      />
      {menor.requiereAutorizacion && (
        <AdjuntoConReemplazo
          url={`/viajes/${idViaje}/archivos/menores/${menor.idMenor}/permiso-notarial`}
          etiqueta={`Permiso notarial — ${menor.nombre}`}
          puedeReemplazar
          onSubir={(archivo) => reemplazarArchivoMenor(idViaje, menor.idMenor, 'permiso-notarial', archivo)}
        />
      )}
    </div>
  )

  if (!editando) {
    return (
      <div className="rounded-md border border-gov-neutral bg-gov-neutral px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[13px] text-gov-gray-a">
            <span className="font-semibold text-gov-black">{menor.nombre}</span>
            {' · '}
            {menor.rut}
          </span>
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={iniciarEdicion}
              className="cursor-pointer text-[12px] font-semibold text-gov-primary"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => onEliminar(menor.idMenor)}
              disabled={eliminando}
              className="cursor-pointer text-[12px] font-semibold text-gov-secondary disabled:cursor-default disabled:opacity-60"
            >
              {eliminando ? 'Quitando…' : 'Quitar'}
            </button>
          </div>
        </div>
        {documentos}
      </div>
    )
  }

  return (
    <div className="rounded-md border border-gov-primary bg-white p-3">
      <label className={labelClass}>Nombre del Menor</label>
      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        disabled={guardando}
        className={inputClass}
      />
      <label className={labelClass}>RUT del Menor</label>
      <input
        type="text"
        value={rut}
        onChange={(e) => setRut(formatearRutInput(e.target.value))}
        disabled={guardando}
        className={inputClass}
      />
      <label className={labelClass}>Fecha de Nacimiento</label>
      <DateInput value={fechaNacimiento} onChange={setFechaNacimiento} disabled={guardando} className={inputClass} />
      <label className={labelClass}>¿Requiere Autorización Notarial?</label>
      <select
        value={requiereAutorizacion ? 'true' : 'false'}
        onChange={(e) => setRequiereAutorizacion(e.target.value === 'true')}
        disabled={guardando}
        className={inputClass}
      >
        <option value="false">No requiere</option>
        <option value="true">Sí requiere</option>
      </select>

      <ErrorPaso mensaje={error} />

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="flex-1 cursor-pointer rounded-md bg-gov-primary px-3 py-2 text-[13px] font-bold text-white hover:bg-gov-primary-dark disabled:cursor-default disabled:bg-gov-accent"
        >
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          disabled={guardando}
          className="flex-1 cursor-pointer rounded-md bg-gov-neutral px-3 py-2 text-[13px] font-bold text-gov-gray-a disabled:cursor-default disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>

      {documentos}
    </div>
  )
}

/** Card de una mascota ya guardada; mismo criterio de edición no destructiva que {@link MenorGuardadoCard}. */
function MascotaGuardadaCard({
  mascota,
  idViaje,
  onActualizado,
  onEliminar,
  eliminando,
}: {
  mascota: MascotaInfo
  idViaje: number
  onActualizado: (mascotas: MascotaInfo[]) => void
  onEliminar: (idMascota: number) => void
  eliminando: boolean
}) {
  const [editando, setEditando] = useState(false)
  const [tipoAnimal, setTipoAnimal] = useState(mascota.tipoAnimal)
  const [numeroChip, setNumeroChip] = useState(mascota.numeroChip)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const iniciarEdicion = () => {
    setTipoAnimal(mascota.tipoAnimal)
    setNumeroChip(mascota.numeroChip)
    setError('')
    setEditando(true)
  }

  const guardar = async () => {
    setError('')
    if (!tipoAnimal.trim() || !numeroChip.trim()) {
      setError('Completa el tipo de animal y el número de chip')
      return
    }
    setGuardando(true)
    try {
      const viajeActualizado = await actualizarMascota(idViaje, mascota.idMascota, {
        tipoAnimal: tipoAnimal.trim(),
        numeroChip: numeroChip.trim(),
      })
      onActualizado(viajeActualizado.mascotas)
      setEditando(false)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setGuardando(false)
    }
  }

  const documentos = (
    <div className="flex flex-wrap gap-3">
      <AdjuntoConReemplazo
        url={`/viajes/${idViaje}/archivos/mascotas/${mascota.idMascota}/certificado-chip`}
        etiqueta={`Certificado del chip — ${mascota.tipoAnimal}`}
        puedeReemplazar
        onSubir={(archivo) => reemplazarArchivoMascota(idViaje, mascota.idMascota, 'certificado-chip', archivo)}
      />
      <AdjuntoConReemplazo
        url={`/viajes/${idViaje}/archivos/mascotas/${mascota.idMascota}/carnet-vacunacion`}
        etiqueta={`Carnet de vacunación — ${mascota.tipoAnimal}`}
        puedeReemplazar
        onSubir={(archivo) => reemplazarArchivoMascota(idViaje, mascota.idMascota, 'carnet-vacunacion', archivo)}
      />
    </div>
  )

  if (!editando) {
    return (
      <div className="rounded-md border border-gov-neutral bg-gov-neutral px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[13px] text-gov-gray-a">
            <span className="font-semibold text-gov-black">{mascota.tipoAnimal}</span>
            {' · chip '}
            {mascota.numeroChip}
          </span>
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={iniciarEdicion}
              className="cursor-pointer text-[12px] font-semibold text-gov-primary"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => onEliminar(mascota.idMascota)}
              disabled={eliminando}
              className="cursor-pointer text-[12px] font-semibold text-gov-secondary disabled:cursor-default disabled:opacity-60"
            >
              {eliminando ? 'Quitando…' : 'Quitar'}
            </button>
          </div>
        </div>
        {documentos}
      </div>
    )
  }

  return (
    <div className="rounded-md border border-gov-primary bg-white p-3">
      <label className={labelClass}>Tipo de animal</label>
      <input
        type="text"
        value={tipoAnimal}
        onChange={(e) => setTipoAnimal(e.target.value)}
        disabled={guardando}
        className={inputClass}
      />
      <label className={labelClass}>Número de chip</label>
      <input
        type="text"
        value={numeroChip}
        onChange={(e) => setNumeroChip(e.target.value)}
        disabled={guardando}
        className={inputClass}
      />

      <ErrorPaso mensaje={error} />

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="flex-1 cursor-pointer rounded-md bg-gov-primary px-3 py-2 text-[13px] font-bold text-white hover:bg-gov-primary-dark disabled:cursor-default disabled:bg-gov-accent"
        >
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          disabled={guardando}
          className="flex-1 cursor-pointer rounded-md bg-gov-neutral px-3 py-2 text-[13px] font-bold text-gov-gray-a disabled:cursor-default disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>

      {documentos}
    </div>
  )
}

interface MascotaForm {
  tipoAnimal: string
  numeroChip: string
  certificadoChip: File | null
  carnetVacunacion: File | null
}

const mascotaVacia: MascotaForm = {
  tipoAnimal: '',
  numeroChip: '',
  certificadoChip: null,
  carnetVacunacion: null,
}

interface DetalleSag {
  vegetal: boolean
  animal: boolean
  alimentos: boolean
  detalle: string
}

/**
 * Wizard lineal de registro de viaje (CAMBIO 6.1): 5 pasos secuenciales
 * (Viaje → Vehículo → Declaración SAG+Aduanas → Código QR → Finalizar).
 * El avance al paso siguiente solo se habilita cuando el paso actual está
 * guardado en backend; "Atrás" siempre está disponible sin perder datos.
 */
function RegistroViaje() {
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(0)
  const [cargandoInicial, setCargandoInicial] = useState(true)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  // Nombres de campo (ver `clase`/`limpiar` más abajo) que fallaron la última
  // validación: se les marca el borde en rojo tenue hasta que el usuario
  // interactúe con ese campo puntual o reintente la acción.
  const [camposInvalidos, setCamposInvalidos] = useState<Set<string>>(new Set())

  // Paso 1 — Viaje
  const [idViaje, setIdViaje] = useState<number | null>(null)
  const [fechaIngreso, setFechaIngreso] = useState('')
  const [destino, setDestino] = useState('')
  const [pasoFronterizo, setPasoFronterizo] = useState('')
  const [motivoViaje, setMotivoViaje] = useState('')
  const [menoresGuardados, setMenoresGuardados] = useState<MenorInfo[]>([])
  const [menoresNuevos, setMenoresNuevos] = useState<MenorForm[]>([])
  const [mascotasGuardadas, setMascotasGuardadas] = useState<MascotaInfo[]>([])
  const [mascotasNuevas, setMascotasNuevas] = useState<MascotaForm[]>([])
  // idMenor/idMascota que se está quitando (para deshabilitar sus botones puntuales).
  const [quitandoMenor, setQuitandoMenor] = useState<number | null>(null)
  const [quitandoMascota, setQuitandoMascota] = useState<number | null>(null)

  // Paso 2 — Vehículo
  const [sinVehiculo, setSinVehiculo] = useState(false)
  const [principalGuardado, setPrincipalGuardado] = useState(false)
  const [idVehiculoPrincipal, setIdVehiculoPrincipal] = useState<number | null>(null)
  const [patente, setPatente] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [anio, setAnio] = useState('')
  const [permisoCirculacion, setPermisoCirculacion] = useState<File | null>(null)
  const [llevaRemolque, setLlevaRemolque] = useState(false)
  const [remolqueGuardado, setRemolqueGuardado] = useState(false)
  const [idVehiculoRemolque, setIdVehiculoRemolque] = useState<number | null>(null)
  const [patenteRemolque, setPatenteRemolque] = useState('')
  const [marcaRemolque, setMarcaRemolque] = useState('')
  const [modeloRemolque, setModeloRemolque] = useState('')
  const [permisoCirculacionRemolque, setPermisoCirculacionRemolque] = useState<File | null>(null)

  // Paso 3 — Declaración SAG + Aduanas
  const [vegetal, setVegetal] = useState(false)
  const [animal, setAnimal] = useState(false)
  const [alimentos, setAlimentos] = useState(false)
  const [detalleSag, setDetalleSag] = useState('')
  const [sagGuardado, setSagGuardado] = useState(false)
  const [declaraDivisas, setDeclaraDivisas] = useState(false)
  const [montoDivisas, setMontoDivisas] = useState('')
  const [monedaDivisas, setMonedaDivisas] = useState('USD')
  const [declaraMercancias, setDeclaraMercancias] = useState(false)
  const [detalleMercancias, setDetalleMercancias] = useState('')

  // Paso 4/5 — QR
  const [qr, setQr] = useState<QrResponse | null>(null)

  // Carga del expediente activo (si lo hay) para continuar un trámite en curso.
  useEffect(() => {
    const activo = getIdViajeActivo()
    if (!activo) {
      setCargandoInicial(false)
      return
    }
    obtenerViaje(activo)
      .then((viaje) => {
        setIdViaje(viaje.idViaje)
        setFechaIngreso(viaje.fechaIngreso)
        setDestino(viaje.destino)
        setPasoFronterizo(viaje.pasoFronterizo)
        setMotivoViaje(viaje.motivoViaje)
        setMenoresGuardados(viaje.menores)
        setMascotasGuardadas(viaje.mascotas)

        const principal = vehiculoPrincipal(viaje)
        if (principal) {
          setPrincipalGuardado(true)
          setIdVehiculoPrincipal(principal.idVehiculo)
          setPatente(principal.patente)
          setMarca(principal.marca ?? '')
          setModelo(principal.modelo ?? '')
          setAnio(principal.anio ? String(principal.anio) : '')
        }
        const remolque = vehiculoRemolque(viaje)
        if (remolque) {
          setLlevaRemolque(true)
          setRemolqueGuardado(true)
          setIdVehiculoRemolque(remolque.idVehiculo)
          setPatenteRemolque(remolque.patente)
          setMarcaRemolque(remolque.marca ?? '')
          setModeloRemolque(remolque.modelo ?? '')
        }

        if (viaje.sag) {
          setSagGuardado(true)
          setDeclaraDivisas(viaje.sag.declaraDivisas)
          setMontoDivisas(viaje.sag.montoDivisas ? String(viaje.sag.montoDivisas) : '')
          setMonedaDivisas(viaje.sag.monedaDivisas ?? 'USD')
          setDeclaraMercancias(viaje.sag.declaraMercancias)
          setDetalleMercancias(viaje.sag.detalleMercancias ?? '')
          try {
            const datos = JSON.parse(viaje.sag.productos) as Partial<DetalleSag>
            setVegetal(Boolean(datos.vegetal))
            setAnimal(Boolean(datos.animal))
            setAlimentos(Boolean(datos.alimentos))
            setDetalleSag(datos.detalle ?? '')
          } catch {
            // Declaración previa en formato no reconocido: se ignora.
          }
        }

        // Posiciona el wizard en el primer paso aún no completado.
        if (!viaje.sag) setCurrentStep(principal ? 2 : 1)
        else setCurrentStep(3)
      })
      .catch(() => {
        // El expediente guardado ya no existe: se permite crear uno nuevo.
      })
      .finally(() => setCargandoInicial(false))
  }, [])

  const completedSteps = (() => {
    const done: number[] = []
    if (idViaje) done.push(0)
    if (principalGuardado || sinVehiculo) done.push(1)
    if (sagGuardado) done.push(2)
    if (qr) done.push(3)
    return done
  })()

  const irAtras = () => {
    setError('')
    setCamposInvalidos(new Set())
    setCurrentStep((s) => Math.max(0, s - 1))
  }

  /** Borde rojo tenue si `campo` quedó marcado inválido en la última validación. */
  const clase = (campo: string): string =>
    `${inputBaseClass} ${
      camposInvalidos.has(campo) ? 'border-gov-secondary/70 bg-estado-rechazado-bg' : 'border-gov-accent'
    }`

  /** Quita el resaltado rojo de un campo puntual al interactuar con él. */
  const limpiar = (campo: string) => {
    setCamposInvalidos((prev) => {
      if (!prev.has(campo)) return prev
      const siguiente = new Set(prev)
      siguiente.delete(campo)
      return siguiente
    })
  }

  // --- Paso 1: Viaje ---
  const agregarFilaMenor = () => setMenoresNuevos((prev) => [...prev, { ...menorVacio }])
  const quitarFilaMenor = (i: number) =>
    setMenoresNuevos((prev) => prev.filter((_, idx) => idx !== i))
  const actualizarFilaMenor = (i: number, campo: keyof MenorForm, valor: string | boolean) =>
    setMenoresNuevos((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [campo]: valor } : m)),
    )
  const actualizarArchivoMenor = (
    i: number,
    campo: 'carnetIdentidad' | 'papelesAntecedentes' | 'permisoNotarial',
    archivo: File | null,
  ) =>
    setMenoresNuevos((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [campo]: archivo } : m)),
    )

  const agregarFilaMascota = () => setMascotasNuevas((prev) => [...prev, { ...mascotaVacia }])
  const quitarFilaMascota = (i: number) =>
    setMascotasNuevas((prev) => prev.filter((_, idx) => idx !== i))
  const actualizarFilaMascota = (i: number, campo: 'tipoAnimal' | 'numeroChip', valor: string) =>
    setMascotasNuevas((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [campo]: valor } : m)),
    )
  const actualizarArchivoMascota = (
    i: number,
    campo: 'certificadoChip' | 'carnetVacunacion',
    archivo: File | null,
  ) =>
    setMascotasNuevas((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [campo]: archivo } : m)),
    )

  /** Quita un menor ya guardado, definitivamente (RF02). */
  const quitarMenorGuardado = async (idMenor: number) => {
    if (!idViaje) return
    setError('')
    setQuitandoMenor(idMenor)
    try {
      const viajeActualizado = await eliminarMenor(idViaje, idMenor)
      setMenoresGuardados(viajeActualizado.menores)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setQuitandoMenor(null)
    }
  }

  /** Quita una mascota ya guardada, definitivamente (RF02). */
  const quitarMascotaGuardada = async (idMascota: number) => {
    if (!idViaje) return
    setError('')
    setQuitandoMascota(idMascota)
    try {
      const viajeActualizado = await eliminarMascota(idViaje, idMascota)
      setMascotasGuardadas(viajeActualizado.mascotas)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setQuitandoMascota(null)
    }
  }

  const guardarViaje = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setCamposInvalidos(new Set())

    const faltantesViaje: string[] = []
    if (!fechaIngreso) faltantesViaje.push('fechaIngreso')
    if (!destino.trim()) faltantesViaje.push('destino')
    if (!pasoFronterizo) faltantesViaje.push('pasoFronterizo')
    if (!motivoViaje) faltantesViaje.push('motivoViaje')
    if (faltantesViaje.length > 0) {
      setCamposInvalidos(new Set(faltantesViaje))
      setError('Completa todos los campos del viaje')
      return
    }

    for (let i = 0; i < menoresNuevos.length; i++) {
      const menor = menoresNuevos[i]
      const faltantes: string[] = []
      if (!menor.nombre.trim()) faltantes.push(`menor-${i}-nombre`)
      if (!menor.rut.trim()) faltantes.push(`menor-${i}-rut`)
      if (!menor.fechaNacimiento) faltantes.push(`menor-${i}-fechaNacimiento`)
      if (faltantes.length > 0) {
        setCamposInvalidos(new Set(faltantes))
        setError('Completa todos los datos de los menores agregados')
        return
      }
      if (!validarRut(menor.rut)) {
        setCamposInvalidos(new Set([`menor-${i}-rut`]))
        const dvCorrecto = calcularDigitoVerificador(menor.rut)
        const cuerpo = menor.rut.split('-')[0]
        setError(
          dvCorrecto
            ? `El RUT del menor "${menor.nombre}" no es válido (el dígito verificador de ${cuerpo} debería ser ${dvCorrecto})`
            : `El RUT del menor "${menor.nombre}" no es válido`,
        )
        return
      }
      if (!esMenorDeEdad(menor.fechaNacimiento, fechaIngreso)) {
        setCamposInvalidos(new Set([`menor-${i}-fechaNacimiento`]))
        setError(`La fecha de nacimiento de "${menor.nombre}" no corresponde a un menor de edad`)
        return
      }
      const faltantesArchivos: string[] = []
      if (!menor.carnetIdentidad) faltantesArchivos.push(`menor-${i}-carnetIdentidad`)
      if (!menor.papelesAntecedentes) faltantesArchivos.push(`menor-${i}-papelesAntecedentes`)
      if (faltantesArchivos.length > 0) {
        setCamposInvalidos(new Set(faltantesArchivos))
        setError(`Adjunta el carnet de identidad y los papeles de antecedentes de "${menor.nombre}"`)
        return
      }
      if (menor.requiereAutorizacion && !menor.permisoNotarial) {
        setCamposInvalidos(new Set([`menor-${i}-permisoNotarial`]))
        setError(`Adjunta el permiso notarial de "${menor.nombre}" para poder continuar`)
        return
      }
    }
    for (let i = 0; i < mascotasNuevas.length; i++) {
      const mascota = mascotasNuevas[i]
      const faltantes: string[] = []
      if (!mascota.tipoAnimal.trim()) faltantes.push(`mascota-${i}-tipoAnimal`)
      if (!mascota.numeroChip.trim()) faltantes.push(`mascota-${i}-numeroChip`)
      if (faltantes.length > 0) {
        setCamposInvalidos(new Set(faltantes))
        setError('Completa el tipo de animal y el número de chip de las mascotas agregadas')
        return
      }
      const faltantesArchivos: string[] = []
      if (!mascota.certificadoChip) faltantesArchivos.push(`mascota-${i}-certificadoChip`)
      if (!mascota.carnetVacunacion) faltantesArchivos.push(`mascota-${i}-carnetVacunacion`)
      if (faltantesArchivos.length > 0) {
        setCamposInvalidos(new Set(faltantesArchivos))
        setError(`Adjunta el certificado del chip y el carnet de vacunación de "${mascota.tipoAnimal}"`)
        return
      }
    }

    setCargando(true)
    try {
      const payload = { fechaIngreso, destino: destino.trim(), pasoFronterizo, motivoViaje }
      const viaje = idViaje
        ? await actualizarViaje(idViaje, payload)
        : await crearViaje(payload)
      setIdViaje(viaje.idViaje)
      setIdViajeActivo(viaje.idViaje)

      // Se guardan de a uno: cada menor/mascota que ya se agregó se saca de
      // "Nuevos" y pasa a "Guardados" de inmediato, para que si falla un
      // ítem más adelante en el loop (ej. corte de red), reintentar "Guardar
      // y continuar" no vuelva a enviar los que ya quedaron guardados.
      // "Guardados" se toma siempre de la respuesta del backend (no de un id
      // sintético local): sin el id real no se puede después quitar, editar
      // ni ver los documentos ya subidos de ese menor/mascota.
      for (const menor of menoresNuevos) {
        const viajeActualizado = await agregarMenor(
          viaje.idViaje,
          {
            nombre: menor.nombre,
            rut: menor.rut,
            fechaNacimiento: menor.fechaNacimiento,
            requiereAutorizacion: menor.requiereAutorizacion,
          },
          {
            carnetIdentidad: menor.carnetIdentidad,
            papelesAntecedentes: menor.papelesAntecedentes,
            permisoNotarial: menor.permisoNotarial,
          },
        )
        setMenoresGuardados(viajeActualizado.menores)
        setMenoresNuevos((prev) => prev.filter((m) => m !== menor))
      }

      for (const mascota of mascotasNuevas) {
        const viajeActualizado = await agregarMascota(
          viaje.idViaje,
          { tipoAnimal: mascota.tipoAnimal, numeroChip: mascota.numeroChip },
          {
            certificadoChip: mascota.certificadoChip,
            carnetVacunacion: mascota.carnetVacunacion,
          },
        )
        setMascotasGuardadas(viajeActualizado.mascotas)
        setMascotasNuevas((prev) => prev.filter((m) => m !== mascota))
      }

      setCurrentStep(1)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }

  // --- Paso 2: Vehículo ---
  const guardarVehiculoPrincipal = async () => {
    setError('')
    const faltantes: string[] = []
    if (!patente.trim()) faltantes.push('patente')
    if (!marca.trim()) faltantes.push('marca')
    if (!modelo.trim()) faltantes.push('modelo')
    if (!anio) faltantes.push('anio')
    if (faltantes.length > 0) {
      setCamposInvalidos(new Set(faltantes))
      setError('Completa todos los campos del vehículo principal')
      return
    }
    if (!permisoCirculacion) {
      setCamposInvalidos(new Set(['permisoCirculacion']))
      setError('Adjunta el permiso de circulación del vehículo para poder continuar')
      return
    }
    setCamposInvalidos(new Set())
    if (!idViaje) return
    setCargando(true)
    try {
      const viajeActualizado = await registrarVehiculo(
        idViaje,
        {
          patente: patente.trim().toUpperCase(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          anio: Number(anio),
          esRemolque: false,
        },
        permisoCirculacion,
      )
      setIdVehiculoPrincipal(vehiculoPrincipal(viajeActualizado)?.idVehiculo ?? null)
      setPrincipalGuardado(true)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }

  const guardarRemolque = async () => {
    setError('')
    if (!patenteRemolque.trim()) {
      setCamposInvalidos(new Set(['patenteRemolque']))
      setError('La patente del remolque es obligatoria')
      return
    }
    if (!permisoCirculacionRemolque) {
      setCamposInvalidos(new Set(['permisoCirculacionRemolque']))
      setError('Adjunta el permiso de circulación del remolque para poder continuar')
      return
    }
    setCamposInvalidos(new Set())
    if (!idViaje) return
    setCargando(true)
    try {
      const viajeActualizado = await registrarVehiculo(
        idViaje,
        {
          patente: patenteRemolque.trim().toUpperCase(),
          marca: marcaRemolque.trim() || null,
          modelo: modeloRemolque.trim() || null,
          esRemolque: true,
        },
        permisoCirculacionRemolque,
      )
      setIdVehiculoRemolque(vehiculoRemolque(viajeActualizado)?.idVehiculo ?? null)
      setRemolqueGuardado(true)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }

  const omitirVehiculo = () => {
    setSinVehiculo(true)
    setError('')
    setCamposInvalidos(new Set())
    setCurrentStep(2)
  }

  // --- Paso 3: Declaración ---
  const requiereDetalleSag = vegetal || animal || alimentos

  const guardarDeclaracion = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setCamposInvalidos(new Set())
    if (!idViaje) return

    if (declaraDivisas && (!montoDivisas || Number(montoDivisas) <= 0)) {
      setCamposInvalidos(new Set(['montoDivisas']))
      setError('Si declara divisas, indica un monto mayor a cero')
      return
    }
    if (declaraMercancias && !detalleMercancias.trim()) {
      setCamposInvalidos(new Set(['detalleMercancias']))
      setError('Describe las mercancías declaradas')
      return
    }

    setCargando(true)
    try {
      const productos: DetalleSag = { vegetal, animal, alimentos, detalle: detalleSag }
      await guardarSag(idViaje, {
        declaraProductos: requiereDetalleSag,
        productos: JSON.stringify(productos),
        declaraDivisas,
        montoDivisas: declaraDivisas ? Number(montoDivisas) : null,
        monedaDivisas: declaraDivisas ? monedaDivisas : null,
        declaraMercancias,
        detalleMercancias: declaraMercancias ? detalleMercancias.trim() : null,
      })
      setSagGuardado(true)
      setCurrentStep(3)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }

  // --- Paso 4: Generar QR ---
  const generarQr = async () => {
    if (!idViaje) return
    setError('')
    setCargando(true)
    try {
      const datos = await obtenerQR(idViaje)
      setQr(datos)
      setCurrentStep(4)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }

  // --- Paso 5: Descargar / Finalizar ---
  const descargarQr = () => {
    if (!qr) return
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${qr.imagenBase64}`
    link.download = `sffe-qr-${numeroExpediente(idViaje ?? 0)}.png`
    link.click()
  }

  const finalizar = () => {
    // Reset del wizard: el viaje queda en el historial, se limpia el activo.
    localStorage.removeItem('sffe_id_viaje_activo')
    navigate('/dashboard')
  }

  if (cargandoInicial) {
    return (
      <div className="min-h-screen bg-gov-neutral">
        <TopBar />
        <Banner />
        <main className="mx-auto max-w-[520px] px-4 py-6 pb-16">
          <p className="text-gov-gray-a">Cargando…</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gov-neutral">
      <TopBar />
      <Banner />

      <main className="mx-auto max-w-[520px] px-4 py-6 pb-16">
        <h1 className="mb-1 text-[22px] text-gov-black">Nuevo Viaje</h1>
        <p className="mb-4 mt-0 text-sm text-gov-gray-b">
          {idViaje ? numeroExpediente(idViaje) : 'Completa los pasos para obtener tu código QR'}
        </p>

        <WizardStepper steps={STEPS} currentStep={currentStep} completedSteps={completedSteps} />

        {/* ============ PASO 1 — Viaje ============ */}
        {currentStep === 0 && (
          <form onSubmit={guardarViaje}>
            <div className={cardClass}>
              <div className={cardTitleClass}>Datos del Viaje</div>

              <label className={labelClass} htmlFor="fechaIngreso">
                Fecha de Ingreso
              </label>
              <DateInput
                id="fechaIngreso"
                value={fechaIngreso}
                onChange={setFechaIngreso}
                onFocus={() => limpiar('fechaIngreso')}
                className={clase('fechaIngreso')}
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
                onFocus={() => limpiar('destino')}
                className={clase('destino')}
              />

              <label className={labelClass} htmlFor="pasoFronterizo">
                Paso Fronterizo
              </label>
              <select
                id="pasoFronterizo"
                value={pasoFronterizo}
                onChange={(e) => setPasoFronterizo(e.target.value)}
                onFocus={() => limpiar('pasoFronterizo')}
                className={clase('pasoFronterizo')}
              >
                <option value="">Seleccionar…</option>
                {PASOS_FRONTERIZOS.map((p) => (
                  <option key={p} value={p}>
                    {p}
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
                onFocus={() => limpiar('motivoViaje')}
                className={clase('motivoViaje')}
              >
                <option value="">Seleccionar…</option>
                {MOTIVOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className={cardClass}>
              <div className={cardTitleClass}>Menores de Edad (RF02)</div>
              <div className="mb-3 rounded-md bg-gov-primary-light px-3 py-2 text-[13px] text-gov-primary-dark">
                Si viaja con menores de edad, agrégalos aquí. Este paso es opcional.
              </div>

              {menoresGuardados.length > 0 && idViaje && (
                <div className="mb-3 flex flex-col gap-2">
                  {menoresGuardados.map((menor) => (
                    <MenorGuardadoCard
                      key={menor.idMenor}
                      menor={menor}
                      idViaje={idViaje}
                      fechaIngreso={fechaIngreso}
                      onActualizado={setMenoresGuardados}
                      onEliminar={quitarMenorGuardado}
                      eliminando={quitandoMenor === menor.idMenor}
                    />
                  ))}
                </div>
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
                      disabled={cargando}
                      className="cursor-pointer text-[13px] font-semibold text-gov-secondary disabled:cursor-default disabled:opacity-60"
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
                    onFocus={() => limpiar(`menor-${index}-nombre`)}
                    disabled={cargando}
                    className={clase(`menor-${index}-nombre`)}
                  />

                  <label className={labelClass}>RUT del Menor</label>
                  <input
                    type="text"
                    placeholder="12345678-9"
                    value={menor.rut}
                    onChange={(e) =>
                      actualizarFilaMenor(index, 'rut', formatearRutInput(e.target.value))
                    }
                    onFocus={() => limpiar(`menor-${index}-rut`)}
                    disabled={cargando}
                    className={clase(`menor-${index}-rut`)}
                  />

                  <label className={labelClass}>Fecha de Nacimiento</label>
                  <DateInput
                    value={menor.fechaNacimiento}
                    onChange={(valor) => actualizarFilaMenor(index, 'fechaNacimiento', valor)}
                    onFocus={() => limpiar(`menor-${index}-fechaNacimiento`)}
                    disabled={cargando}
                    className={clase(`menor-${index}-fechaNacimiento`)}
                  />

                  <label className={labelClass}>¿Requiere Autorización Notarial?</label>
                  <select
                    value={menor.requiereAutorizacion ? 'true' : 'false'}
                    onChange={(e) =>
                      actualizarFilaMenor(index, 'requiereAutorizacion', e.target.value === 'true')
                    }
                    disabled={cargando}
                    className={inputClass}
                  >
                    <option value="false">No requiere</option>
                    <option value="true">Sí requiere</option>
                  </select>

                  <label className={labelClass}>Carnet de identidad del menor</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      actualizarArchivoMenor(index, 'carnetIdentidad', e.target.files?.[0] ?? null)
                    }
                    onClick={() => limpiar(`menor-${index}-carnetIdentidad`)}
                    disabled={cargando}
                    className={clase(`menor-${index}-carnetIdentidad`)}
                  />

                  <label className={labelClass}>Papeles de antecedentes del menor</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      actualizarArchivoMenor(index, 'papelesAntecedentes', e.target.files?.[0] ?? null)
                    }
                    onClick={() => limpiar(`menor-${index}-papelesAntecedentes`)}
                    disabled={cargando}
                    className={clase(`menor-${index}-papelesAntecedentes`)}
                  />

                  {menor.requiereAutorizacion && (
                    <>
                      <label className={labelClass}>Permiso notarial del menor</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          actualizarArchivoMenor(index, 'permisoNotarial', e.target.files?.[0] ?? null)
                        }
                        onClick={() => limpiar(`menor-${index}-permisoNotarial`)}
                        disabled={cargando}
                        className={clase(`menor-${index}-permisoNotarial`)}
                      />
                    </>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={agregarFilaMenor}
                disabled={cargando}
                className="w-full cursor-pointer rounded-md border border-dashed border-gov-primary px-3 py-2.5 text-[13px] font-semibold text-gov-primary disabled:cursor-default disabled:opacity-60"
              >
                + Agregar menor
              </button>
            </div>

            <div className={cardClass}>
              <div className={cardTitleClass}>Mascotas (RF02)</div>
              <div className="mb-3 rounded-md bg-gov-primary-light px-3 py-2 text-[13px] text-gov-primary-dark">
                Si viaja con mascotas, agrégalas aquí. Este paso es opcional; si agregas una,
                todos sus datos y documentos son obligatorios.
              </div>

              {mascotasGuardadas.length > 0 && idViaje && (
                <div className="mb-3 flex flex-col gap-2">
                  {mascotasGuardadas.map((mascota) => (
                    <MascotaGuardadaCard
                      key={mascota.idMascota}
                      mascota={mascota}
                      idViaje={idViaje}
                      onActualizado={setMascotasGuardadas}
                      onEliminar={quitarMascotaGuardada}
                      eliminando={quitandoMascota === mascota.idMascota}
                    />
                  ))}
                </div>
              )}

              {mascotasNuevas.map((mascota, index) => (
                <div key={index} className="mb-3 rounded-md border border-gov-accent p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-gov-gray-a">
                      Mascota {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => quitarFilaMascota(index)}
                      disabled={cargando}
                      className="cursor-pointer text-[13px] font-semibold text-gov-secondary disabled:cursor-default disabled:opacity-60"
                    >
                      Quitar
                    </button>
                  </div>

                  <label className={labelClass}>Tipo de animal</label>
                  <input
                    type="text"
                    placeholder="Ej: Perro, Gato"
                    value={mascota.tipoAnimal}
                    onChange={(e) => actualizarFilaMascota(index, 'tipoAnimal', e.target.value)}
                    onFocus={() => limpiar(`mascota-${index}-tipoAnimal`)}
                    disabled={cargando}
                    className={clase(`mascota-${index}-tipoAnimal`)}
                  />

                  <label className={labelClass}>Número de chip</label>
                  <input
                    type="text"
                    placeholder="Ej: 981000000000000"
                    value={mascota.numeroChip}
                    onChange={(e) => actualizarFilaMascota(index, 'numeroChip', e.target.value)}
                    onFocus={() => limpiar(`mascota-${index}-numeroChip`)}
                    disabled={cargando}
                    className={clase(`mascota-${index}-numeroChip`)}
                  />

                  <label className={labelClass}>Certificado del chip</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      actualizarArchivoMascota(index, 'certificadoChip', e.target.files?.[0] ?? null)
                    }
                    onClick={() => limpiar(`mascota-${index}-certificadoChip`)}
                    disabled={cargando}
                    className={clase(`mascota-${index}-certificadoChip`)}
                  />

                  <label className={labelClass}>Carnet de vacunación</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      actualizarArchivoMascota(index, 'carnetVacunacion', e.target.files?.[0] ?? null)
                    }
                    onClick={() => limpiar(`mascota-${index}-carnetVacunacion`)}
                    disabled={cargando}
                    className={clase(`mascota-${index}-carnetVacunacion`)}
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={agregarFilaMascota}
                disabled={cargando}
                className="w-full cursor-pointer rounded-md border border-dashed border-gov-primary px-3 py-2.5 text-[13px] font-semibold text-gov-primary disabled:cursor-default disabled:opacity-60"
              >
                + Agregar mascota
              </button>
            </div>

            <ErrorPaso mensaje={error} />
            <button type="submit" disabled={cargando} className={btnPrimario}>
              {cargando ? 'Guardando…' : 'Guardar y continuar'}
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className={btnSecundario}>
              Cancelar
            </button>
          </form>
        )}

        {/* ============ PASO 2 — Vehículo ============ */}
        {currentStep === 1 && (
          <div>
            <div className={cardClass}>
              <div className={cardTitleClass}>Vehículo (RF03)</div>

              <label className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-gov-gray-a">
                <input
                  type="checkbox"
                  checked={sinVehiculo}
                  onChange={(e) => setSinVehiculo(e.target.checked)}
                />
                Viajo a pie / en transporte público (omitir vehículo)
              </label>

              {!sinVehiculo && !principalGuardado && (
                <>
                  <label className={labelClass}>Patente</label>
                  <input
                    type="text"
                    placeholder="Ej: ABCD12"
                    value={patente}
                    onChange={(e) => setPatente(e.target.value)}
                    onFocus={() => limpiar('patente')}
                    className={clase('patente')}
                  />
                  <label className={labelClass}>Marca</label>
                  <input
                    type="text"
                    placeholder="Ej: Toyota"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    onFocus={() => limpiar('marca')}
                    className={clase('marca')}
                  />
                  <label className={labelClass}>Modelo</label>
                  <input
                    type="text"
                    placeholder="Ej: Corolla"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    onFocus={() => limpiar('modelo')}
                    className={clase('modelo')}
                  />
                  <label className={labelClass}>Año</label>
                  <input
                    type="number"
                    placeholder="Ej: 2022"
                    min={1990}
                    max={new Date().getFullYear() + 1}
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    onFocus={() => limpiar('anio')}
                    className={clase('anio')}
                  />
                  <label className={labelClass}>Permiso de circulación</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setPermisoCirculacion(e.target.files?.[0] ?? null)}
                    onClick={() => limpiar('permisoCirculacion')}
                    className={clase('permisoCirculacion')}
                  />

                  <ErrorPaso mensaje={error} />
                  <button
                    type="button"
                    onClick={guardarVehiculoPrincipal}
                    disabled={cargando}
                    className={btnPrimario}
                  >
                    {cargando ? 'Guardando…' : 'Guardar vehículo'}
                  </button>
                </>
              )}

              {!sinVehiculo && principalGuardado && (
                <>
                  <div className="mb-3 rounded-md bg-estado-aprobado-bg px-3 py-2 text-[13px] font-semibold text-estado-aprobado-text">
                    ✓ Vehículo principal guardado — {patente} {marca} {modelo}
                  </div>
                  {idVehiculoPrincipal && (
                    <div className="mt-1">
                      <div className={labelClass}>Permiso de circulación</div>
                      <AdjuntoConReemplazo
                        url={`/viajes/${idViaje}/archivos/vehiculos/${idVehiculoPrincipal}/permiso-circulacion`}
                        etiqueta={`Permiso de circulación — ${patente}`}
                        puedeReemplazar
                        onSubir={(archivo) =>
                          reemplazarArchivoVehiculo(idViaje!, idVehiculoPrincipal, 'permiso-circulacion', archivo)
                        }
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Remolque: solo tras guardar el vehículo principal */}
            {!sinVehiculo && principalGuardado && (
              <div className={cardClass}>
                <label className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-gov-gray-a">
                  <input
                    type="checkbox"
                    checked={llevaRemolque}
                    onChange={(e) => setLlevaRemolque(e.target.checked)}
                  />
                  ¿Lleva carro de arrastre o remolque?
                </label>

                {llevaRemolque && !remolqueGuardado && (
                  <>
                    <label className={labelClass}>Patente del remolque</label>
                    <input
                      type="text"
                      placeholder="Ej: RM1234"
                      value={patenteRemolque}
                      onChange={(e) => setPatenteRemolque(e.target.value)}
                      onFocus={() => limpiar('patenteRemolque')}
                      className={clase('patenteRemolque')}
                    />
                    <label className={labelClass}>Marca (opcional)</label>
                    <input
                      type="text"
                      value={marcaRemolque}
                      onChange={(e) => setMarcaRemolque(e.target.value)}
                      className={inputClass}
                    />
                    <label className={labelClass}>Modelo (opcional)</label>
                    <input
                      type="text"
                      value={modeloRemolque}
                      onChange={(e) => setModeloRemolque(e.target.value)}
                      className={inputClass}
                    />
                    <label className={labelClass}>Permiso de circulación del remolque</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setPermisoCirculacionRemolque(e.target.files?.[0] ?? null)}
                      onClick={() => limpiar('permisoCirculacionRemolque')}
                      className={clase('permisoCirculacionRemolque')}
                    />
                    <ErrorPaso mensaje={error} />
                    <button
                      type="button"
                      onClick={guardarRemolque}
                      disabled={cargando}
                      className={btnPrimario}
                    >
                      {cargando ? 'Guardando…' : 'Guardar remolque'}
                    </button>
                  </>
                )}

                {llevaRemolque && remolqueGuardado && (
                  <>
                    <div className="mb-3 rounded-md bg-estado-aprobado-bg px-3 py-2 text-[13px] font-semibold text-estado-aprobado-text">
                      ✓ Remolque guardado — {patenteRemolque}
                    </div>
                    {idVehiculoRemolque && (
                      <div className="mt-1">
                        <div className={labelClass}>Permiso de circulación del remolque</div>
                        <AdjuntoConReemplazo
                          url={`/viajes/${idViaje}/archivos/vehiculos/${idVehiculoRemolque}/permiso-circulacion`}
                          etiqueta={`Permiso de circulación — ${patenteRemolque}`}
                          puedeReemplazar
                          onSubir={(archivo) =>
                            reemplazarArchivoVehiculo(idViaje!, idVehiculoRemolque, 'permiso-circulacion', archivo)
                          }
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {sinVehiculo ? (
              <button type="button" onClick={omitirVehiculo} className={btnPrimario}>
                Omitir y continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!principalGuardado}
                className={btnPrimario}
              >
                Continuar
              </button>
            )}
            <button type="button" onClick={irAtras} className={btnSecundario}>
              Atrás
            </button>
          </div>
        )}

        {/* ============ PASO 3 — Declaración SAG + Aduanas ============ */}
        {currentStep === 2 && (
          <form onSubmit={guardarDeclaracion}>
            {/* Sección SAG */}
            <div className={cardClass}>
              <div className={cardTitleClass}>Sección 1 — Declaración SAG</div>
              <div className="mb-3 rounded-md bg-estado-pendiente-bg px-3 py-2 text-[13px] text-estado-pendiente-text">
                ⚠️ La declaración falsa puede constituir delito según la normativa SAG vigente.
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

              <label className={labelClass}>
                ¿Transporta animales o productos de origen animal?
              </label>
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

              {requiereDetalleSag && (
                <>
                  <label className={labelClass}>Detalle de productos declarados</label>
                  <textarea
                    value={detalleSag}
                    onChange={(e) => setDetalleSag(e.target.value)}
                    placeholder="Describa los productos…"
                    className={`${inputClass} min-h-[80px] resize-y`}
                  />
                </>
              )}
            </div>

            {/* Sección Aduanas */}
            <div className={cardClass}>
              <div className={cardTitleClass}>Sección 2 — Declaración de Aduanas</div>
              <div className="mb-3 rounded-md bg-estado-pendiente-bg px-3 py-2 text-[13px] text-estado-pendiente-text">
                ⚠️ Omitir o falsear esta declaración ante el Servicio Nacional de Aduanas
                puede constituir delito.
              </div>

              <label className={labelClass}>
                ¿Porta efectivo o equivalentes superiores a USD 10.000?
              </label>
              <select
                value={declaraDivisas ? 'true' : 'false'}
                onChange={(e) => setDeclaraDivisas(e.target.value === 'true')}
                className={inputClass}
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>

              {declaraDivisas && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Monto</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Ej: 12000"
                      value={montoDivisas}
                      onChange={(e) => setMontoDivisas(e.target.value)}
                      onFocus={() => limpiar('montoDivisas')}
                      className={clase('montoDivisas')}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Moneda</label>
                    <select
                      value={monedaDivisas}
                      onChange={(e) => setMonedaDivisas(e.target.value)}
                      className={inputClass}
                    >
                      {MONEDAS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <label className={labelClass}>
                ¿Transporta mercancías que exceden la franquicia del viajero?
              </label>
              <select
                value={declaraMercancias ? 'true' : 'false'}
                onChange={(e) => setDeclaraMercancias(e.target.value === 'true')}
                className={inputClass}
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>

              {declaraMercancias && (
                <>
                  <label className={labelClass}>Detalle de las mercancías</label>
                  <textarea
                    value={detalleMercancias}
                    onChange={(e) => setDetalleMercancias(e.target.value)}
                    onFocus={() => limpiar('detalleMercancias')}
                    placeholder="Describa las mercancías…"
                    className={`${clase('detalleMercancias')} min-h-[80px] resize-y`}
                  />
                </>
              )}
            </div>

            <ErrorPaso mensaje={error} />
            <button type="submit" disabled={cargando} className={btnPrimario}>
              {cargando ? 'Enviando…' : 'Firmar y continuar'}
            </button>
            <button type="button" onClick={irAtras} className={btnSecundario}>
              Atrás
            </button>
          </form>
        )}

        {/* ============ PASO 4 — Generar QR ============ */}
        {currentStep === 3 && (
          <div>
            <div className={cardClass}>
              <div className={cardTitleClass}>Generar Código QR</div>
              <p className="mb-3 text-[14px] text-gov-gray-a">
                Tu expediente está completo. Genera el código QR que presentarás en la
                caseta de fiscalización.
              </p>
              <ErrorPaso mensaje={error} />
              <button type="button" onClick={generarQr} disabled={cargando} className={btnPrimario}>
                {cargando ? 'Generando…' : 'Generar mi código QR'}
              </button>
            </div>
            <button type="button" onClick={irAtras} className={btnSecundario}>
              Atrás
            </button>
          </div>
        )}

        {/* ============ PASO 5 — Descargar / Finalizar ============ */}
        {currentStep === 4 && qr && (
          <div>
            <div className={cardClass}>
              <div className={cardTitleClass}>Tu Código QR</div>
              <div className="text-center">
                <img
                  src={`data:image/png;base64,${qr.imagenBase64}`}
                  alt="Código QR del expediente"
                  className="mx-auto h-[220px] w-[220px]"
                />
                <p className="mt-2 text-[11px] text-gov-gray-b">
                  Si el QR no se puede leer, el funcionario puede ingresar este código manualmente:
                </p>
                <p className="mt-1 break-all rounded-md bg-gov-neutral px-3 py-2 text-center font-mono text-[13px] text-gov-black">
                  {qr.codigo}
                </p>
                <button
                  type="button"
                  onClick={descargarQr}
                  className="mt-3 w-full cursor-pointer rounded-md bg-gov-primary px-3 py-2.5 text-[15px] font-bold text-white hover:bg-gov-primary-dark"
                >
                  Descargar QR
                </button>
              </div>
            </div>
            <div className="mb-4 rounded-md bg-gov-primary-light px-3 py-2.5 text-center text-[13px] text-gov-tertiary">
              Presenta este código en la caseta de fiscalización al llegar al paso fronterizo.
            </div>
            <button type="button" onClick={finalizar} className={btnPrimario}>
              Finalizar
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default RegistroViaje
