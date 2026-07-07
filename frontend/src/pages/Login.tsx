import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Banner from '../components/layout/Banner'
import Footer from '../components/layout/Footer'
import DocumentoFields from '../components/ui/DocumentoFields'
import { useAuth } from '../context/AuthContext'
import {
  login as loginRequest,
  register as registerRequest,
  mensajeDeError,
} from '../services/authService'
import {
  normalizarIdentificador,
  validarIdentificador,
  mensajeValidacionIdentificador,
  type TipoDocumento,
} from '../utils/documento'

const inputClass =
  'mb-3.5 w-full rounded-md border border-gov-accent px-3 py-2.5 text-[15px] outline-none focus:border-gov-primary'
const labelClass = 'mb-1 block text-[13px] font-semibold text-gov-gray-a'

type Modo = 'login' | 'registro'

/**
 * Acceso del PASAJERO: inicio de sesión y creación de cuenta. Mobile-first:
 * una columna centrada, ancho máximo 520px.
 */
function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [modo, setModo] = useState<Modo>('login')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  // Login
  const [tipoDocumentoLogin, setTipoDocumentoLogin] = useState<TipoDocumento>('RUT')
  const [identificadorLogin, setIdentificadorLogin] = useState('')
  const [contrasenaLogin, setContrasenaLogin] = useState('')

  // Registro
  const [nombre, setNombre] = useState('')
  const [tipoDocumentoRegistro, setTipoDocumentoRegistro] = useState<TipoDocumento>('RUT')
  const [identificadorRegistro, setIdentificadorRegistro] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [contrasenaRegistro, setContrasenaRegistro] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [carnetIdentidad, setCarnetIdentidad] = useState<File | null>(null)
  const [papelesAntecedentes, setPapelesAntecedentes] = useState<File | null>(null)

  // El carnet y los papeles de antecedentes no aplican a SIN_DOCUMENTO: ese
  // tipo de documento implica precisamente no tener carnet que adjuntar.
  const requiereArchivosIdentidad = tipoDocumentoRegistro !== 'SIN_DOCUMENTO'

  const cambiarModo = (nuevoModo: Modo) => {
    setModo(nuevoModo)
    setError('')
    setMensaje('')
  }

  const onSubmitLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validarIdentificador(identificadorLogin, tipoDocumentoLogin)) {
      setError(mensajeValidacionIdentificador(tipoDocumentoLogin))
      return
    }

    setCargando(true)
    try {
      const datos = await loginRequest({
        identificador: identificadorLogin,
        contrasena: contrasenaLogin,
      })
      login({ ...datos, identificador: normalizarIdentificador(identificadorLogin) })
      navigate(datos.rol === 'PASAJERO' ? '/dashboard' : '/fiscalizacion')
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }

  const onSubmitRegistro = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMensaje('')

    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    if (!validarIdentificador(identificadorRegistro, tipoDocumentoRegistro)) {
      setError(mensajeValidacionIdentificador(tipoDocumentoRegistro))
      return
    }
    if (contrasenaRegistro.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (!fechaNacimiento) {
      setError('La fecha de nacimiento es obligatoria')
      return
    }
    if (requiereArchivosIdentidad && (!carnetIdentidad || !papelesAntecedentes)) {
      setError('Debes adjuntar tu carnet de identidad y tus papeles de antecedentes para continuar')
      return
    }

    setCargando(true)
    try {
      const datos = await registerRequest(
        {
          nombre,
          tipoDocumento: tipoDocumentoRegistro,
          identificador:
            tipoDocumentoRegistro === 'SIN_DOCUMENTO' ? undefined : identificadorRegistro,
          correo,
          contrasena: contrasenaRegistro,
          telefono: telefono || undefined,
          fechaNacimiento,
        },
        { carnetIdentidad, papelesAntecedentes },
      )

      setMensaje(
        tipoDocumentoRegistro === 'SIN_DOCUMENTO'
          ? `Registro exitoso. Tu código temporal es ${datos.identificador}. Guárdalo: lo necesitas para iniciar sesión.`
          : 'Registro exitoso. Ya puedes iniciar sesión.',
      )

      setNombre('')
      setIdentificadorRegistro('')
      setCorreo('')
      setTelefono('')
      setContrasenaRegistro('')
      setFechaNacimiento('')
      setCarnetIdentidad(null)
      setPapelesAntecedentes(null)
      setModo('login')
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
        <h1 className="mb-1 text-[22px] text-gov-black">
          {modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </h1>
        <p className="mt-0 text-sm text-gov-gray-a">
          Portal del pasajero · Trámites de cruce fronterizo
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => cambiarModo('login')}
            className={`flex-1 cursor-pointer rounded-md border px-3 py-2 text-[13px] font-semibold ${modo === 'login'
              ? 'border-gov-primary bg-gov-primary-light text-gov-primary-dark'
              : 'border-gov-accent bg-white text-gov-gray-a'
              }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => cambiarModo('registro')}
            className={`flex-1 cursor-pointer rounded-md border px-3 py-2 text-[13px] font-semibold ${modo === 'registro'
              ? 'border-gov-primary bg-gov-primary-light text-gov-primary-dark'
              : 'border-gov-accent bg-white text-gov-gray-a'
              }`}
          >
            Crear cuenta
          </button>
        </div>

        {mensaje && (
          <p className="my-3 rounded-md bg-estado-aprobado-bg px-2.5 py-2 text-[13px] text-estado-aprobado-text">
            {mensaje}
          </p>
        )}

        {modo === 'login' ? (
          <form
            onSubmit={onSubmitLogin}
            className="mt-4 rounded-lg border border-gov-neutral bg-white p-5"
          >
            <DocumentoFields
              tipoDocumento={tipoDocumentoLogin}
              identificador={identificadorLogin}
              onTipoDocumentoChange={setTipoDocumentoLogin}
              onIdentificadorChange={setIdentificadorLogin}
              modo="login"
              idPrefix="login"
            />

            <label className={labelClass} htmlFor="contrasena">
              Contraseña
            </label>
            <input
              id="contrasena"
              type="password"
              value={contrasenaLogin}
              onChange={(e) => setContrasenaLogin(e.target.value)}
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
        ) : (
          <form
            onSubmit={onSubmitRegistro}
            className="mt-4 rounded-lg border border-gov-neutral bg-white p-5"
          >
            <label className={labelClass} htmlFor="nombre">
              Nombre completo
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={inputClass}
              autoComplete="name"
            />

            <DocumentoFields
              tipoDocumento={tipoDocumentoRegistro}
              identificador={identificadorRegistro}
              onTipoDocumentoChange={setTipoDocumentoRegistro}
              onIdentificadorChange={setIdentificadorRegistro}
              modo="registro"
              idPrefix="registro"
            />

            <label className={labelClass} htmlFor="fecha-nacimiento">
              Fecha de nacimiento
            </label>
            <input
              id="fecha-nacimiento"
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              className={inputClass}
            />

            {requiereArchivosIdentidad && (
              <>
                <label className={labelClass} htmlFor="carnet-identidad">
                  Carnet de identidad
                </label>
                <input
                  id="carnet-identidad"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setCarnetIdentidad(e.target.files?.[0] ?? null)}
                  className={inputClass}
                />

                <label className={labelClass} htmlFor="papeles-antecedentes">
                  Papeles de antecedentes
                </label>
                <input
                  id="papeles-antecedentes"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setPapelesAntecedentes(e.target.files?.[0] ?? null)}
                  className={inputClass}
                />
              </>
            )}

            <label className={labelClass} htmlFor="correo">
              Correo electrónico
            </label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className={inputClass}
              autoComplete="email"
            />

            <label className={labelClass} htmlFor="telefono">
              Teléfono (opcional)
            </label>
            <input
              id="telefono"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className={inputClass}
              autoComplete="tel"
            />

            <label className={labelClass} htmlFor="contrasena-registro">
              Contraseña
            </label>
            <input
              id="contrasena-registro"
              type="password"
              value={contrasenaRegistro}
              onChange={(e) => setContrasenaRegistro(e.target.value)}
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
              className={`w-full rounded-md px-3 py-3 text-[15px] font-bold text-white ${cargando
                ? 'cursor-default bg-gov-accent'
                : 'cursor-pointer bg-gov-primary hover:bg-gov-primary-dark'
                }`}
            >
              {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gov-gray-a">
          ¿Eres funcionario?{' '}
          <Link to="/funcionario/login" className="text-gov-primary">
            Ingreso institucional
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  )
}

export default Login
