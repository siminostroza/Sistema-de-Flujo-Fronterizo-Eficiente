import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { validarQR, type ExpedienteResponse } from '../services/qrService'
import {
  resolverFiscalizacion,
  type DecisionFiscalizacion,
} from '../services/fiscalizacionService'
import { mensajeDeError } from '../services/authService'
import { estadoBadge } from '../utils/estado'
import { etiquetaTipoDocumento } from '../utils/documento'

const cardClass = 'rounded-lg border border-gov-neutral bg-white p-5'
const cardTitleClass = 'mb-3 text-sm font-bold text-gov-black'
const labelFilaClass = 'text-[12px] font-semibold uppercase tracking-wide text-gov-gray-b'
const valorFilaClass = 'text-[15px] text-gov-black'

interface BotonDecision {
  decision: DecisionFiscalizacion
  label: string
  clases: string
}

/** Botones de resolución disponibles según el rol del funcionario (RF05). */
function botonesPorRol(rol: string): BotonDecision[] {
  switch (rol) {
    case 'FUNCIONARIO_ADUANA':
      return [
        { decision: 'APROBADO', label: 'Autorizar Ingreso', clases: 'bg-gov-green hover:opacity-90' },
        { decision: 'RECHAZADO', label: 'Denegar Ingreso', clases: 'bg-gov-secondary hover:opacity-90' },
        { decision: 'SOSPECHA', label: 'Marcar Sospecha', clases: 'bg-gov-gray-a hover:opacity-90' },
      ]
    case 'FUNCIONARIO_PDI':
      return [
        { decision: 'VALIDACION_IDENTIDAD', label: 'Validar Identidad', clases: 'bg-gov-primary hover:bg-gov-primary-dark' },
        { decision: 'SOSPECHA', label: 'Marcar Sospecha', clases: 'bg-gov-gray-a hover:opacity-90' },
      ]
    case 'FUNCIONARIO_SAG':
      return [
        { decision: 'VALIDACION_SAG', label: 'Validar Declaración SAG', clases: 'bg-gov-primary hover:bg-gov-primary-dark' },
        { decision: 'SOSPECHA', label: 'Marcar Sospecha', clases: 'bg-gov-gray-a hover:opacity-90' },
      ]
    default:
      return []
  }
}

/** RECHAZADO y SOSPECHA exigen que el funcionario detalle el motivo (RF05). */
function requiereMotivo(decision: DecisionFiscalizacion): boolean {
  return decision === 'RECHAZADO' || decision === 'SOSPECHA'
}

const ETIQUETAS_DECISION: Record<DecisionFiscalizacion, string> = {
  APROBADO: 'autorizar el ingreso',
  RECHAZADO: 'el motivo del rechazo',
  SOSPECHA: 'el motivo de la sospecha',
  VALIDACION_IDENTIDAD: 'validar la identidad',
  VALIDACION_SAG: 'validar la declaración SAG',
}

/** Extrae el campo "detalle" del JSON de productos de la declaración SAG, si existe. */
function detalleSag(productos: string | null | undefined): string {
  if (!productos) {
    return ''
  }
  try {
    const parsed = JSON.parse(productos) as { detalle?: string }
    return parsed.detalle?.trim() ?? ''
  } catch {
    return ''
  }
}

/**
 * Panel de control fronterizo (RF05): el funcionario valida un código QR, ve el
 * expediente consolidado del viajero (identificador enmascarado, RNF10) y
 * registra su resolución según los permisos de su rol.
 */
function FiscalizacionQr() {
  const { sesion } = useAuth()
  const rol = sesion?.rol ?? ''

  const [codigo, setCodigo] = useState('')
  const [codigoValidado, setCodigoValidado] = useState('')
  const [expediente, setExpediente] = useState<ExpedienteResponse | null>(null)
  const [validando, setValidando] = useState(false)
  const [resolviendo, setResolviendo] = useState(false)
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState('')
  const [confirmacion, setConfirmacion] = useState('')

  const botones = botonesPorRol(rol)
  const esSoloLectura = botones.length === 0

  const onValidar = async (e: FormEvent) => {
    e.preventDefault()
    const codigoLimpio = codigo.trim()
    if (!codigoLimpio) {
      return
    }
    setError('')
    setConfirmacion('')
    setExpediente(null)
    setValidando(true)
    try {
      const datos = await validarQR(codigoLimpio)
      setExpediente(datos)
      setCodigoValidado(codigoLimpio)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setValidando(false)
    }
  }

  const onResolver = async (decision: DecisionFiscalizacion) => {
    if (!codigoValidado) {
      return
    }
    setError('')
    setConfirmacion('')
    if (requiereMotivo(decision) && !observaciones.trim()) {
      setError(`Debes indicar ${ETIQUETAS_DECISION[decision]} antes de continuar`)
      return
    }
    setResolviendo(true)
    try {
      const respuesta = await resolverFiscalizacion(
        codigoValidado,
        decision,
        observaciones,
      )
      setConfirmacion(respuesta.mensaje)
      // Limpia el formulario para el siguiente pasajero.
      setExpediente(null)
      setCodigo('')
      setCodigoValidado('')
      setObservaciones('')
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setResolviendo(false)
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-[22px] text-gov-black">Control fronterizo</h1>
      <p className="mb-5 text-sm text-gov-gray-b">
        RF05 — Escanea o ingresa el código QR del viajero para ver su expediente
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Columna izquierda: escaneo + resolución */}
        <div className="flex flex-col gap-5">
          <form onSubmit={onValidar} className={cardClass}>
            <div className={cardTitleClass}>Validar código QR</div>
            <label className="mb-1 block text-[13px] font-semibold text-gov-gray-a">
              Código del expediente
            </label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ingresa o escanea el código QR"
              disabled={validando}
              className="mb-3 w-full rounded-md border border-gov-accent px-3 py-2.5 text-[15px] outline-none focus:border-gov-primary disabled:bg-gov-neutral"
            />
            <button
              type="submit"
              disabled={validando}
              className={`w-full rounded-md px-3 py-2.5 text-[15px] font-bold text-white ${
                validando
                  ? 'cursor-default bg-gov-accent'
                  : 'cursor-pointer bg-gov-primary hover:bg-gov-primary-dark'
              }`}
            >
              {validando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Validando…
                </span>
              ) : (
                'Validar QR'
              )}
            </button>
          </form>

          {confirmacion && (
            <div
              role="status"
              className="rounded-md bg-estado-aprobado-bg px-4 py-3 text-[14px] font-semibold text-estado-aprobado-text"
            >
              ✓ {confirmacion}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-md bg-estado-rechazado-bg px-4 py-3 text-[14px] text-estado-rechazado-text"
            >
              {error}
            </div>
          )}

          {/* Panel de resolución */}
          {expediente && (
            <div className={cardClass}>
              <div className={cardTitleClass}>Resolución</div>

              {esSoloLectura ? (
                <p className="rounded-md bg-gov-primary-light px-3 py-2.5 text-[13px] text-gov-tertiary">
                  Tu rol tiene acceso de solo lectura al expediente.
                </p>
              ) : (
                <>
                  <label className="mb-1 block text-[13px] font-semibold text-gov-gray-a">
                    Observaciones — obligatorias para "Denegar Ingreso" y "Marcar Sospecha"
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Detalla el motivo si vas a rechazar o marcar sospecha…"
                    className="mb-3 w-full resize-none rounded-md border border-gov-accent px-3 py-2.5 text-[14px] outline-none focus:border-gov-primary"
                  />
                  <div className="flex flex-col gap-2">
                    {botones.map((boton) => (
                      <button
                        key={boton.decision}
                        onClick={() => onResolver(boton.decision)}
                        disabled={resolviendo}
                        className={`w-full rounded-md px-3 py-2.5 text-[15px] font-bold text-white disabled:cursor-default disabled:bg-gov-accent ${
                          resolviendo ? '' : `cursor-pointer ${boton.clases}`
                        }`}
                      >
                        {boton.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Columna derecha: expediente consolidado */}
        <div className={cardClass}>
          <div className={cardTitleClass}>Expediente del viajero</div>

          {!expediente ? (
            <div className="text-center py-8">
              <p className="text-[14px] text-gov-gray-b">
                {validando ? 'Cargando expediente…' : 'Valida un código QR para ver el expediente consolidado.'}
              </p>
            </div>
          ) : (
            <>
              {expediente.estadoQr === 'USADO' && (
                <div
                  role="status"
                  className="mb-3 rounded-md bg-estado-pendiente-bg px-3 py-2.5 text-[13px] font-semibold text-estado-pendiente-text"
                >
                  ⚠️ Este ingreso ya fue autorizado por Aduana. Puedes registrar tu validación igualmente.
                </div>
              )}
              <ExpedientePanel expediente={expediente} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Render del expediente consolidado del viajero, con datos enmascarados (RNF10). */
function ExpedientePanel({ expediente }: { expediente: ExpedienteResponse }) {
  const badge = estadoBadge(expediente.estadoViaje)
  const detalle = detalleSag(expediente.declaracionSag?.productos)

  return (
    <div className="flex flex-col gap-4">
      {/* Pasajero */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-bold text-gov-tertiary">
            Datos del pasajero
          </span>
          <span
            className={`rounded-md px-2.5 py-1 text-[12px] font-semibold ${badge.clases}`}
          >
            {badge.texto}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Nombre" valor={expediente.nombrePasajero} />
          <Campo
            label="Identificador"
            valor={`${expediente.identificadorEnmascarado} (${etiquetaTipoDocumento(expediente.tipoDocumento)})`}
          />
        </div>
      </section>

      {/* Viaje */}
      <section className="border-t border-gov-neutral pt-3">
        <div className="mb-2 text-[13px] font-bold text-gov-tertiary">
          Datos del viaje
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Destino" valor={expediente.destino} />
          <Campo label="Paso fronterizo" valor={expediente.pasoFronterizo || '—'} />
          <Campo label="Motivo" valor={expediente.motivoViaje || '—'} />
        </div>
      </section>

      {/* Vehículos (principal + remolque) */}
      <section className="border-t border-gov-neutral pt-3">
        <div className="mb-2 text-[13px] font-bold text-gov-tertiary">Vehículos</div>
        {expediente.vehiculos.length > 0 ? (
          <div className="flex flex-col gap-3">
            {expediente.vehiculos.map((veh) => (
              <div key={veh.idVehiculo} className="grid grid-cols-2 gap-3">
                <Campo
                  label={veh.esRemolque ? 'Patente (remolque)' : 'Patente'}
                  valor={veh.patente}
                />
                <Campo
                  label="Marca / Modelo"
                  valor={`${veh.marca ?? '—'} ${veh.modelo ?? ''}`.trim()}
                />
                <Campo label="Año" valor={veh.anio ? String(veh.anio) : '—'} />
                <Campo
                  label="Permiso de circulación"
                  valor={veh.permisoCirculacion ? '✓ Adjuntado' : '✗ No adjuntado'}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-gov-gray-b">Sin vehículo registrado.</p>
        )}
      </section>

      {/* Mascotas */}
      <section className="border-t border-gov-neutral pt-3">
        <div className="mb-2 text-[13px] font-bold text-gov-tertiary">Mascotas</div>
        {expediente.mascotas.length > 0 ? (
          <div className="flex flex-col gap-3">
            {expediente.mascotas.map((mascota) => (
              <div key={mascota.idMascota} className="grid grid-cols-2 gap-3">
                <Campo label="Tipo de animal" valor={mascota.tipoAnimal} />
                <Campo label="Número de chip" valor={mascota.numeroChip} />
                <Campo
                  label="Certificado del chip"
                  valor={mascota.certificadoChip ? '✓ Adjuntado' : '✗ No adjuntado'}
                />
                <Campo
                  label="Carnet de vacunación"
                  valor={mascota.carnetVacunacion ? '✓ Adjuntado' : '✗ No adjuntado'}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-gov-gray-b">Sin mascotas registradas.</p>
        )}
      </section>

      {/* Declaración SAG + Aduanas */}
      <section className="border-t border-gov-neutral pt-3">
        <div className="mb-2 text-[13px] font-bold text-gov-tertiary">
          Declaración SAG + Aduanas
        </div>
        {expediente.declaracionSag ? (
          <div className="grid grid-cols-1 gap-3">
            <Campo
              label="Productos SAG"
              valor={
                expediente.declaracionSag.declaraProductos
                  ? 'Declara productos'
                  : 'Sin productos que declarar'
              }
            />
            {detalle && <Campo label="Detalle SAG" valor={detalle} />}
            <Campo
              label="Divisas (> USD 10.000)"
              valor={
                expediente.declaracionSag.declaraDivisas
                  ? `Declara ${expediente.declaracionSag.montoDivisas ?? ''} ${
                      expediente.declaracionSag.monedaDivisas ?? ''
                    }`.trim()
                  : 'No declara'
              }
            />
            <Campo
              label="Mercancías sobre franquicia"
              valor={
                expediente.declaracionSag.declaraMercancias
                  ? `Declara: ${expediente.declaracionSag.detalleMercancias ?? '—'}`
                  : 'No declara'
              }
            />
          </div>
        ) : (
          <p className="text-[14px] text-gov-gray-b">
            Sin declaración registrada.
          </p>
        )}
      </section>

      {/* Menores */}
      <section className="border-t border-gov-neutral pt-3">
        <div className="mb-2 text-[13px] font-bold text-gov-tertiary">
          Menores acompañantes
        </div>
        {expediente.menores.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {expediente.menores.map((menor) => (
              <li
                key={menor.idMenor}
                className="rounded-md bg-gov-neutral px-3 py-2 text-[14px] text-gov-black"
              >
                {menor.nombre} · {menor.rut}
                {menor.requiereAutorizacion && (
                  <span className="ml-2 text-[12px] font-semibold text-gov-secondary">
                    requiere autorización
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-gov-gray-b">Sin menores en el grupo.</p>
        )}
      </section>
    </div>
  )
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <div className={labelFilaClass}>{label}</div>
      <div className={valorFilaClass}>{valor}</div>
    </div>
  )
}

export default FiscalizacionQr
