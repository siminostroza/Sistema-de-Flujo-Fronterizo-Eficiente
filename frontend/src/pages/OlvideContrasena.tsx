import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Banner from '../components/layout/Banner'
import Footer from '../components/layout/Footer'
import { olvidePassword, mensajeDeError } from '../services/authService'

const inputClass =
  'mb-3.5 w-full rounded-md border border-gov-accent px-3 py-2.5 text-[15px] outline-none focus:border-gov-primary'
const labelClass = 'mb-1 block text-[13px] font-semibold text-gov-gray-a'

/** Solicitud de recuperación de contraseña (RF01). Ruta pública. */
function OlvideContrasena() {
  const [valor, setValor] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!valor.trim()) {
      setError('Ingresa tu identificador o tu correo')
      return
    }
    setCargando(true)
    try {
      const datos = await olvidePassword(valor.trim())
      setMensaje(datos.mensaje)
      setEnviado(true)
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
        <h1 className="mb-1 text-[22px] text-gov-black">Recuperar contraseña</h1>
        <p className="mt-0 text-sm text-gov-gray-a">
          Te enviaremos un enlace a tu correo para elegir una nueva contraseña
        </p>

        <div className="mt-4 rounded-lg border border-gov-neutral bg-white p-5">
          {enviado ? (
            <p className="text-[14px] text-estado-aprobado-text">{mensaje}</p>
          ) : (
            <form onSubmit={onSubmit}>
              <label className={labelClass} htmlFor="identificador-o-correo">
                RUT, pasaporte, cédula o correo
              </label>
              <input
                id="identificador-o-correo"
                type="text"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className={inputClass}
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
                {cargando ? 'Enviando…' : 'Enviar enlace'}
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

export default OlvideContrasena
