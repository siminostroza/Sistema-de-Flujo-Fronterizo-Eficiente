import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Banner from '../components/layout/Banner'
import Footer from '../components/layout/Footer'
import { useAuth } from '../context/AuthContext'
import { etiquetaTipoDocumento } from '../utils/documento'
import { actualizarCorreo, mensajeDeError, solicitarCambioPassword } from '../services/authService'

const cardClass = 'mb-4 rounded-lg border border-gov-neutral bg-white p-5'
const filaClass = 'mb-3 last:mb-0'
const labelFilaClass = 'text-[13px] font-semibold text-gov-gray-a'
const valorFilaClass = 'text-[15px] text-gov-black'
const inputBaseClass =
  'mb-2 w-full rounded-md border px-3 py-2.5 text-[15px] outline-none focus:border-gov-primary'

/**
 * Perfil del pasajero (RF01): muestra sus datos de sesión (identificador sin
 * enmascarar — el enmascarado de RNF10 aplica solo en vistas de
 * funcionario) y permite editar correo y contraseña.
 */
function Perfil() {
  const { sesion, logout, actualizarCorreoSesion } = useAuth()
  const navigate = useNavigate()

  const [editandoCorreo, setEditandoCorreo] = useState(false)
  const [nuevoCorreo, setNuevoCorreo] = useState('')
  const [correoInvalido, setCorreoInvalido] = useState(false)
  const [errorCorreo, setErrorCorreo] = useState('')
  const [guardandoCorreo, setGuardandoCorreo] = useState(false)
  const [avisoCorreo, setAvisoCorreo] = useState('')

  const [errorPassword, setErrorPassword] = useState('')
  const [enviandoPassword, setEnviandoPassword] = useState(false)
  const [avisoPassword, setAvisoPassword] = useState('')

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  const iniciarEdicionCorreo = () => {
    setNuevoCorreo(sesion?.correo ?? '')
    setEditandoCorreo(true)
    setErrorCorreo('')
    setCorreoInvalido(false)
    setAvisoCorreo('')
  }

  const cancelarEdicionCorreo = () => {
    setEditandoCorreo(false)
    setErrorCorreo('')
    setCorreoInvalido(false)
  }

  const guardarCorreo = async (e: FormEvent) => {
    e.preventDefault()
    setErrorCorreo('')

    const valor = nuevoCorreo.trim()
    if (!valor || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
      setCorreoInvalido(true)
      setErrorCorreo('Ingresa un correo con formato válido')
      return
    }

    setGuardandoCorreo(true)
    try {
      await actualizarCorreo(valor)
      actualizarCorreoSesion(valor)
      setEditandoCorreo(false)
      setAvisoCorreo('Correo actualizado. Te enviamos un enlace para verificar la nueva dirección.')
    } catch (err) {
      setCorreoInvalido(true)
      setErrorCorreo(mensajeDeError(err))
    } finally {
      setGuardandoCorreo(false)
    }
  }

  const cambiarPassword = async () => {
    setErrorPassword('')
    setAvisoPassword('')
    // La pestaña se abre ANTES del await: la mayoría de los navegadores solo
    // permiten window.open() sin bloqueo de popup si ocurre de forma
    // síncrona dentro del gesto de clic. Una vez llega el token, se navega
    // esa misma pestaña ya abierta en vez de intentar abrir una nueva.
    const ventana = window.open('', '_blank')
    setEnviandoPassword(true)
    try {
      const { token } = await solicitarCambioPassword()
      // Para el testeo: en vez de exigir revisar Mailpit, se simula que el
      // correo ya fue abierto y su enlace clickeado, redirigiendo
      // directamente a la pestaña de restablecimiento.
      if (ventana) {
        ventana.location.href = `/restablecer-password?token=${token}`
      }
      setAvisoPassword(
        'Te enviamos un correo con el enlace para cambiar tu contraseña. Para pruebas, ya lo abrimos en una pestaña nueva.',
      )
    } catch (err) {
      ventana?.close()
      setErrorPassword(mensajeDeError(err))
    } finally {
      setEnviandoPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-gov-neutral">
      <TopBar />
      <Banner />

      <main className="mx-auto max-w-[520px] px-4 py-6 pb-16">
        <h1 className="mb-1 text-[22px] text-gov-black">Mi perfil</h1>
        <p className="mt-0 text-sm text-gov-gray-b">Datos de tu cuenta SFFE</p>

        <div className={cardClass}>
          <div className={filaClass}>
            <div className={labelFilaClass}>Nombre</div>
            <div className={valorFilaClass}>{sesion?.nombre}</div>
          </div>
          <div className={filaClass}>
            <div className={labelFilaClass}>Tipo de documento</div>
            <div className={valorFilaClass}>{etiquetaTipoDocumento(sesion?.tipoDocumento)}</div>
          </div>
          <div className={filaClass}>
            <div className={labelFilaClass}>Identificador</div>
            <div className={valorFilaClass}>{sesion?.identificador}</div>
          </div>
        </div>

        {/* ---- Correo electrónico ---- */}
        <div className={cardClass}>
          <div className={labelFilaClass}>Correo electrónico</div>

          {!editandoCorreo ? (
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className={valorFilaClass}>{sesion?.correo || '—'}</span>
              <button
                type="button"
                onClick={iniciarEdicionCorreo}
                className="cursor-pointer text-[13px] font-semibold text-gov-primary"
              >
                Editar
              </button>
            </div>
          ) : (
            <form onSubmit={guardarCorreo} className="mt-1">
              <input
                type="email"
                value={nuevoCorreo}
                onChange={(e) => {
                  setNuevoCorreo(e.target.value)
                  setCorreoInvalido(false)
                }}
                onFocus={() => setCorreoInvalido(false)}
                className={`${inputBaseClass} ${correoInvalido ? 'border-gov-secondary/70 bg-estado-rechazado-bg' : 'border-gov-accent'}`}
                autoComplete="email"
              />

              {errorCorreo && (
                <p
                  role="alert"
                  className="mb-3 rounded-md bg-estado-rechazado-bg px-2.5 py-2 text-[13px] text-estado-rechazado-text"
                >
                  {errorCorreo}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={guardandoCorreo}
                  className="flex-1 cursor-pointer rounded-md bg-gov-primary px-3 py-2.5 text-[14px] font-bold text-white hover:bg-gov-primary-dark disabled:cursor-default disabled:bg-gov-accent"
                >
                  {guardandoCorreo ? 'Guardando…' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={cancelarEdicionCorreo}
                  disabled={guardandoCorreo}
                  className="flex-1 cursor-pointer rounded-md bg-gov-neutral px-3 py-2.5 text-[14px] font-bold text-gov-gray-a"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {avisoCorreo && (
            <p className="mt-3 rounded-md bg-estado-aprobado-bg px-2.5 py-2 text-[13px] text-estado-aprobado-text">
              {avisoCorreo}
            </p>
          )}
          <p className="mt-3 text-[13px] text-gov-gray-b">
            A este correo llegará el aviso cuando tu ingreso sea autorizado o rechazado.
          </p>
        </div>

        {/* ---- Contraseña ---- */}
        <div className={cardClass}>
          <div className={labelFilaClass}>Contraseña</div>
          <p className="mb-3 mt-1 text-[13px] text-gov-gray-b">
            Te enviaremos un correo con un enlace para elegir una nueva contraseña.
          </p>

          {errorPassword && (
            <p
              role="alert"
              className="mb-3 rounded-md bg-estado-rechazado-bg px-2.5 py-2 text-[13px] text-estado-rechazado-text"
            >
              {errorPassword}
            </p>
          )}
          {avisoPassword && (
            <p className="mb-3 rounded-md bg-estado-aprobado-bg px-2.5 py-2 text-[13px] text-estado-aprobado-text">
              {avisoPassword}
            </p>
          )}

          <button
            type="button"
            onClick={cambiarPassword}
            disabled={enviandoPassword}
            className="w-full cursor-pointer rounded-md bg-gov-neutral px-3 py-2.5 text-[14px] font-bold text-gov-gray-a disabled:cursor-default disabled:opacity-60"
          >
            {enviandoPassword ? 'Enviando…' : 'Cambiar contraseña'}
          </button>
        </div>

        <button
          onClick={onLogout}
          className="w-full cursor-pointer rounded-md bg-gov-secondary px-4 py-2.5 text-white"
        >
          Cerrar sesión
        </button>

        <p className="mt-4 text-center text-sm">
          <Link to="/dashboard" className="text-gov-primary">
            Volver al inicio
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  )
}

export default Perfil
