import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Banner from '../components/layout/Banner'
import { useAuth } from '../context/AuthContext'
import { login as loginRequest, mensajeDeError } from '../services/authService'
import { validarRut } from '../utils/rut'

const inputClass =
  'mb-3.5 w-full rounded-md border border-gov-accent px-3 py-2.5 text-[15px] outline-none focus:border-gov-primary'
const labelClass = 'mb-1 block text-[13px] font-semibold text-gov-gray-a'

/**
 * Login del PASAJERO. Mobile-first: una columna centrada, ancho máximo 520px.
 */
function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [rut, setRut] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validarRut(rut)) {
      setError('El RUT ingresado no es válido. Formato esperado: 12345678-9')
      return
    }

    setCargando(true)
    try {
      const datos = await loginRequest({ rut, contrasena })
      login(datos)
      navigate(datos.rol === 'PASAJERO' ? '/dashboard' : '/fiscalizacion')
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
        <h1 className="mb-1 text-[22px] text-gov-black">Iniciar sesión</h1>
        <p className="mt-0 text-sm text-gov-gray-a">
          Portal del pasajero · Trámites de cruce fronterizo
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-4 rounded-lg border border-gov-neutral bg-white p-5"
        >
          <label className={labelClass} htmlFor="rut">
            RUT
          </label>
          <input
            id="rut"
            type="text"
            placeholder="12345678-9"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            className={inputClass}
            autoComplete="username"
          />

          <label className={labelClass} htmlFor="contrasena">
            Contraseña
          </label>
          <input
            id="contrasena"
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className={inputClass}
            autoComplete="current-password"
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
            className={`w-full rounded-md px-3 py-3 text-[15px] font-bold text-white ${cargando
              ? 'cursor-default bg-gov-accent'
              : 'cursor-pointer bg-gov-primary hover:bg-gov-primary-dark'
              }`}
          >
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-sm text-gov-gray-a">
          ¿Eres funcionario?{' '}
          <Link to="/funcionario/login" className="text-gov-primary">
            Ingreso institucional
          </Link>
        </p>
      </main>
    </div>
  )
}

export default Login
