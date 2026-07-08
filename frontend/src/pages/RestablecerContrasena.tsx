import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Banner from '../components/layout/Banner'
import Footer from '../components/layout/Footer'
import { restablecerPassword, mensajeDeError } from '../services/authService'

const inputClass =
  'mb-3.5 w-full rounded-md border border-gov-accent px-3 py-2.5 text-[15px] outline-none focus:border-gov-primary'
const labelClass = 'mb-1 block text-[13px] font-semibold text-gov-gray-a'

/** Aplica la nueva contraseña a partir del enlace de recuperación (RF01). Ruta pública. */
function RestablecerContrasena() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [listo, setListo] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Falta el token de recuperación en el enlace')
      return
    }
    if (nuevaContrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (nuevaContrasena !== confirmacion) {
      setError('Las contraseñas no coinciden')
      return
    }

    setCargando(true)
    try {
      await restablecerPassword(token, nuevaContrasena)
      setListo(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gov-neutral">
      <TopBar />
      <Banner />
      <main className="mx-auto max-w-[520px] px-4 py-6">
        <h1 className="mb-1 text-[22px] text-gov-black">Restablecer contraseña</h1>
        <p className="mt-0 text-sm text-gov-gray-a">Elige tu nueva contraseña</p>

        <div className="mt-4 rounded-lg border border-gov-neutral bg-white p-5">
          {listo ? (
            <p className="text-[14px] text-estado-aprobado-text">
              Contraseña actualizada. Te llevamos al inicio de sesión…
            </p>
          ) : !token ? (
            <p className="text-[14px] text-estado-rechazado-text">
              El enlace no incluye un token válido. Solicita uno nuevo desde{' '}
              <Link to="/olvide-password" className="font-semibold underline">
                recuperar contraseña
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={onSubmit}>
              <label className={labelClass} htmlFor="nueva-contrasena">
                Nueva contraseña
              </label>
              <input
                id="nueva-contrasena"
                type="password"
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />

              <label className={labelClass} htmlFor="confirmar-contrasena">
                Confirma la contraseña
              </label>
              <input
                id="confirmar-contrasena"
                type="password"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />

              {error && (
                <p
                  role="alert"
                  className="my-1 mb-3 rounded-md bg-estado-rechazado-bg px-2.5 py-2 text-[13px] text-estado-rechazado-text"
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
                {cargando ? 'Guardando…' : 'Guardar nueva contraseña'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gov-gray-a">
          <Link to="/login" className="text-gov-primary">
            Volver al inicio de sesión
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  )
}

export default RestablecerContrasena
