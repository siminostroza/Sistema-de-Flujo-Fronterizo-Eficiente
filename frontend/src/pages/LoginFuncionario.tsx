import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Banner from '../components/layout/Banner'
import { useAuth } from '../context/AuthContext'
import { login as loginRequest, mensajeDeError } from '../services/authService'
import { validarRut } from '../utils/rut'

type Institucion = 'ADUANA' | 'PDI' | 'SAG' | 'ADMIN'

const INSTITUCIONES: { id: Institucion; label: string }[] = [
  { id: 'ADUANA', label: 'Aduana' },
  { id: 'PDI', label: 'PDI' },
  { id: 'SAG', label: 'SAG' },
  { id: 'ADMIN', label: 'Admin' },
]

const inputClass =
  'mb-3.5 w-full rounded-md border border-gov-accent px-3 py-2.5 text-[15px] outline-none focus:border-gov-primary'
const labelClass = 'mb-1 block text-[13px] font-semibold text-gov-gray-a'

/**
 * Login del FUNCIONARIO. Desktop-first: panel lateral institucional + formulario.
 * Incluye selector de institución visible antes del formulario. El rol efectivo
 * proviene del JWT; la institución seleccionada es una guía de acceso.
 */
function LoginFuncionario() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [institucion, setInstitucion] = useState<Institucion>('ADUANA')
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
      if (datos.rol === 'PASAJERO') {
        setError('Esta cuenta es de pasajero. Usa el ingreso de pasajeros.')
        return
      }
      login(datos)
      navigate('/fiscalizacion')
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-[380px_1fr]">
      {/* Panel institucional lateral */}
      <aside className="flex flex-col justify-center bg-gov-tertiary px-7 py-8 text-white">
        <div className="text-xs font-bold tracking-wider">GOB.CL</div>
        <h1 className="mb-1 mt-3 text-[28px]">SFFE</h1>
        <p className="m-0 text-sm text-gov-accent">
          Control Fronterizo · Acceso institucional
        </p>
        <p className="mt-6 text-[13px] text-gov-accent">
          Servicio Nacional de Aduanas · Gobierno de Chile
        </p>
      </aside>

      {/* Formulario */}
      <section className="flex flex-col bg-gov-neutral">
        <Banner />
        <main className="flex flex-1 items-center justify-center p-6">
          <form
            onSubmit={onSubmit}
            className="w-full max-w-[440px] rounded-lg border border-gov-neutral bg-white p-7"
          >
            <h2 className="mt-0 text-xl text-gov-black">Ingreso de funcionario</h2>

            {/* Selector de institución */}
            <label className={labelClass}>Institución</label>
            <div className="mb-4 flex gap-2">
              {INSTITUCIONES.map((opt) => {
                const activa = institucion === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setInstitucion(opt.id)}
                    className={`flex-1 cursor-pointer rounded-md border px-1 py-2 text-[13px] font-semibold ${
                      activa
                        ? 'border-gov-primary bg-gov-primary-light text-gov-primary-dark'
                        : 'border-gov-accent bg-white text-gov-gray-a'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>

            <label className={labelClass} htmlFor="rut-func">
              RUT
            </label>
            <input
              id="rut-func"
              type="text"
              placeholder="12345678-9"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              className={inputClass}
              autoComplete="username"
            />

            <label className={labelClass} htmlFor="contrasena-func">
              Contraseña
            </label>
            <input
              id="contrasena-func"
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
              className={`w-full rounded-md px-3 py-3 text-[15px] font-bold text-white ${
                cargando
                  ? 'cursor-default bg-gov-accent'
                  : 'cursor-pointer bg-gov-primary hover:bg-gov-primary-dark'
              }`}
            >
              {cargando ? 'Ingresando…' : 'Ingresar'}
            </button>

            <p className="mb-0 text-center text-[13px] text-gov-gray-a">
              ¿Eres pasajero?{' '}
              <Link to="/login" className="text-gov-primary">
                Ingreso de pasajeros
              </Link>
            </p>
          </form>
        </main>
      </section>
    </div>
  )
}

export default LoginFuncionario
