import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Banner from '../components/layout/Banner'
import Footer from '../components/layout/Footer'
import { useAuth } from '../context/AuthContext'
import { mensajeDeError } from '../services/authService'
import {
  getIdViajeActivo,
  misViajes,
  numeroExpediente,
  obtenerViaje,
  setIdViajeActivo,
  vehiculoPrincipal,
  vehiculoRemolque,
  type Viaje,
} from '../services/viajeService'
import { obtenerQR, type QrResponse } from '../services/qrService'
import { estadoBadge } from '../utils/estado'
import { etiquetaTipoDocumento } from '../utils/documento'
import AdjuntoViewer from '../components/ui/AdjuntoViewer'

const cardClass = 'mb-4 rounded-lg border border-gov-neutral bg-white p-5'
const cardTitleClass = 'mb-3 text-sm font-bold text-gov-black'
const filaClass = 'mb-3 last:mb-0'
const labelFilaClass = 'text-[13px] font-semibold text-gov-gray-a'
const valorFilaClass = 'text-[15px] text-gov-black'

/**
 * Estado del trámite y código QR de un expediente (RF04, RF05). El viaje a
 * mostrar viene del query param {@code ?id=}; si no se indica, se usa el
 * expediente activo o el más reciente del usuario. El QR se genera de forma
 * idempotente (requiere Declaración completada).
 */
function EstadoTramite() {
  const { sesion } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [idViaje, setIdViaje] = useState<number | null>(null)
  const [viaje, setViaje] = useState<Viaje | null>(null)
  const [qr, setQr] = useState<QrResponse | null>(null)
  const [cargandoInicial, setCargandoInicial] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Resuelve el id del viaje: query param > activo en localStorage > más reciente.
    const resolverId = async (): Promise<number | null> => {
      const param = searchParams.get('id')
      if (param) return Number(param)
      const activo = getIdViajeActivo()
      if (activo) return activo
      const viajes = await misViajes()
      if (viajes.length === 0) return null
      return viajes.reduce((a, b) => (b.idViaje > a.idViaje ? b : a)).idViaje
    }

    resolverId()
      .then(async (id) => {
        if (!id) {
          navigate('/dashboard', { replace: true })
          return
        }
        setIdViaje(id)
        setIdViajeActivo(id)
        const datos = await obtenerViaje(id)
        setViaje(datos)
        if (datos.sag) {
          await obtenerQR(id)
            .then(setQr)
            .catch(() => {
              // Aún no existe un QR activo: se ofrece el botón para generarlo.
            })
        }
      })
      .catch(() => {
        // Si no se puede cargar el expediente, se muestra la pantalla vacía.
      })
      .finally(() => setCargandoInicial(false))
  }, [navigate, searchParams])

  const sagCompletado = !!viaje?.sag

  const onGenerarQr = async () => {
    if (!idViaje) return
    setError('')
    setGenerando(true)
    try {
      const datos = await obtenerQR(idViaje)
      setQr(datos)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setGenerando(false)
    }
  }

  const onDescargar = () => {
    if (!qr) return
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${qr.imagenBase64}`
    link.download = `sffe-qr-${numeroExpediente(idViaje ?? 0)}.png`
    link.click()
  }

  const continuarTramite = () => {
    if (idViaje) setIdViajeActivo(idViaje)
    navigate('/registro-viaje')
  }

  if (cargandoInicial) {
    return (
      <div className="min-h-screen bg-gov-neutral">
        <TopBar />
        <Banner />
        <main className="mx-auto max-w-[520px] px-4 py-6 pb-16">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gov-primary border-t-transparent" />
          </div>
        </main>
      </div>
    )
  }

  const badge = estadoBadge(viaje?.estado ?? 'PENDIENTE')
  const principal = viaje ? vehiculoPrincipal(viaje) : null
  const remolque = viaje ? vehiculoRemolque(viaje) : null

  return (
    <div className="min-h-screen bg-gov-neutral">
      <TopBar />
      <Banner />

      <main className="mx-auto max-w-[520px] px-4 py-6 pb-16">
        <h1 className="mb-1 text-[22px] text-gov-black">Mi código QR</h1>
        <p className="mt-0 text-sm text-gov-gray-b">
          RF04 — Estado del trámite y código de cruce fronterizo
        </p>

        <div className={cardClass}>
          <div className={cardTitleClass}>Estado del Trámite</div>
          <div
            className={`rounded-md px-3 py-2.5 text-center text-[13px] font-semibold ${badge.clases}`}
          >
            {badge.texto}
            {viaje ? ` — ${numeroExpediente(viaje.idViaje)}` : ''}
          </div>
          {viaje?.estado === 'RECHAZADO' && viaje.motivoRechazo && (
            <div className="mt-3 rounded-md bg-estado-rechazado-bg px-3 py-2.5 text-[13px] text-estado-rechazado-text">
              <span className="font-semibold">Motivo del rechazo: </span>
              {viaje.motivoRechazo}
            </div>
          )}
        </div>

        <div className={cardClass}>
          <div className={cardTitleClass}>Código QR</div>

          {qr ? (
            <div className="text-center">
              <img
                src={`data:image/png;base64,${qr.imagenBase64}`}
                alt="Código QR del expediente"
                className="mx-auto h-[220px] w-[220px]"
              />
              <button
                onClick={onDescargar}
                className="mt-3 w-full cursor-pointer rounded-md bg-gov-primary px-3 py-2.5 text-[15px] font-bold text-white hover:bg-gov-primary-dark"
              >
                Descargar QR
              </button>
            </div>
          ) : sagCompletado ? (
            <button
              onClick={onGenerarQr}
              disabled={generando}
              className="w-full cursor-pointer rounded-md bg-gov-primary px-3 py-2.5 text-[15px] font-bold text-white hover:bg-gov-primary-dark disabled:cursor-default disabled:bg-gov-accent"
            >
              {generando ? 'Generando…' : 'Generar mi código QR'}
            </button>
          ) : (
            <div className="rounded-md bg-estado-pendiente-bg px-3 py-2.5 text-[13px] text-estado-pendiente-text">
              Completa tu trámite antes de generar el QR.{' '}
              <button onClick={continuarTramite} className="font-semibold underline">
                Continuar trámite
              </button>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-md bg-estado-rechazado-bg px-2.5 py-2 text-[13px] text-estado-rechazado-text"
            >
              {error}
            </p>
          )}
        </div>

        {viaje && (
          <div className={cardClass}>
            <div className={cardTitleClass}>Resumen del expediente</div>

            <div className={filaClass}>
              <div className={labelFilaClass}>Identificador</div>
              <div className={valorFilaClass}>
                {sesion?.identificador} ({etiquetaTipoDocumento(sesion?.tipoDocumento)})
              </div>
            </div>
            <div className={filaClass}>
              <div className={labelFilaClass}>Destino</div>
              <div className={valorFilaClass}>{viaje.destino}</div>
            </div>
            <div className={filaClass}>
              <div className={labelFilaClass}>Paso fronterizo</div>
              <div className={valorFilaClass}>{viaje.pasoFronterizo}</div>
            </div>
            <div className={filaClass}>
              <div className={labelFilaClass}>Motivo de viaje</div>
              <div className={valorFilaClass}>{viaje.motivoViaje || '—'}</div>
            </div>

            {principal && (
              <div className={filaClass}>
                <div className={labelFilaClass}>Vehículo</div>
                <div className={valorFilaClass}>
                  {principal.patente} — {principal.marca} {principal.modelo}
                </div>
              </div>
            )}
            {remolque && (
              <div className={filaClass}>
                <div className={labelFilaClass}>Remolque</div>
                <div className={valorFilaClass}>{remolque.patente}</div>
              </div>
            )}

            <div className={filaClass}>
              <div className={labelFilaClass}>Declaración</div>
              <div className={valorFilaClass}>
                {viaje.sag
                  ? viaje.sag.declaraProductos || viaje.sag.declaraDivisas || viaje.sag.declaraMercancias
                    ? 'Con elementos declarados'
                    : 'Sin elementos que declarar'
                  : 'Pendiente'}
              </div>
            </div>
          </div>
        )}

        {viaje && (
          <div className={cardClass}>
            <div className={cardTitleClass}>Documentos adjuntos</div>

            {sesion?.tipoDocumento !== 'SIN_DOCUMENTO' && (
              <div className={filaClass}>
                <div className={labelFilaClass}>Mis documentos</div>
                <div className="mt-1.5 flex gap-3">
                  <AdjuntoViewer
                    url={`/viajes/${viaje.idViaje}/archivos/usuario/carnet-identidad`}
                    etiqueta="Mi carnet de identidad"
                  />
                  <AdjuntoViewer
                    url={`/viajes/${viaje.idViaje}/archivos/usuario/papeles-antecedentes`}
                    etiqueta="Mis papeles de antecedentes"
                  />
                </div>
              </div>
            )}

            {[principal, remolque].filter(Boolean).map((veh) => (
              <div key={veh!.idVehiculo} className={filaClass}>
                <div className={labelFilaClass}>
                  Permiso de circulación {veh!.esRemolque ? '(remolque)' : ''} — {veh!.patente}
                </div>
                <div className="mt-1.5">
                  <AdjuntoViewer
                    url={`/viajes/${viaje.idViaje}/archivos/vehiculos/${veh!.idVehiculo}/permiso-circulacion`}
                    etiqueta={`Permiso de circulación — ${veh!.patente}`}
                  />
                </div>
              </div>
            ))}

            {viaje.mascotas.map((mascota) => (
              <div key={mascota.idMascota} className={filaClass}>
                <div className={labelFilaClass}>{mascota.tipoAnimal} · chip {mascota.numeroChip}</div>
                <div className="mt-1.5 flex gap-3">
                  <AdjuntoViewer
                    url={`/viajes/${viaje.idViaje}/archivos/mascotas/${mascota.idMascota}/certificado-chip`}
                    etiqueta={`Certificado del chip — ${mascota.tipoAnimal}`}
                  />
                  <AdjuntoViewer
                    url={`/viajes/${viaje.idViaje}/archivos/mascotas/${mascota.idMascota}/carnet-vacunacion`}
                    etiqueta={`Carnet de vacunación — ${mascota.tipoAnimal}`}
                  />
                </div>
              </div>
            ))}

            {viaje.menores.map((menor) => (
              <div key={menor.idMenor} className={filaClass}>
                <div className={labelFilaClass}>{menor.nombre} · {menor.rut}</div>
                <div className="mt-1.5 flex flex-wrap gap-3">
                  <AdjuntoViewer
                    url={`/viajes/${viaje.idViaje}/archivos/menores/${menor.idMenor}/carnet-identidad`}
                    etiqueta={`Carnet de identidad — ${menor.nombre}`}
                  />
                  <AdjuntoViewer
                    url={`/viajes/${viaje.idViaje}/archivos/menores/${menor.idMenor}/papeles-antecedentes`}
                    etiqueta={`Papeles de antecedentes — ${menor.nombre}`}
                  />
                  {menor.requiereAutorizacion && (
                    <AdjuntoViewer
                      url={`/viajes/${viaje.idViaje}/archivos/menores/${menor.idMenor}/permiso-notarial`}
                      etiqueta={`Permiso notarial — ${menor.nombre}`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-md bg-gov-primary-light px-3 py-2.5 text-center text-[13px] text-gov-tertiary">
          Presenta este código en la caseta de fiscalización al llegar al paso fronterizo
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default EstadoTramite
