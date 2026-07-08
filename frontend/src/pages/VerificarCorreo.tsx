import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Banner from '../components/layout/Banner'
import Footer from '../components/layout/Footer'
import { useAuth } from '../context/AuthContext'
import { verificarCorreo, mensajeDeError } from '../services/authService'

/** Confirma el correo del pasajero a partir del enlace enviado al registrarse (RF01). Ruta pública. */
function VerificarCorreo() {
  const [searchParams] = useSearchParams()
  const { marcarCorreoVerificado } = useAuth()
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'error'>('cargando')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setEstado('error')
      setMensaje('Falta el token de verificación en el enlace')
      return
    }
    verificarCorreo(token)
      .then((datos) => {
        setEstado('ok')
        setMensaje(datos.mensaje)
        marcarCorreoVerificado()
      })
      .catch((err) => {
        setEstado('error')
        setMensaje(mensajeDeError(err))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gov-neutral">
      <TopBar />
      <Banner />
      <main className="mx-auto max-w-[520px] px-4 py-6">
        <div className="mt-4 rounded-lg border border-gov-neutral bg-white p-6 text-center">
          {estado === 'cargando' && (
            <>
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gov-primary border-t-transparent" />
              <p className="text-sm text-gov-gray-a">Verificando tu correo…</p>
            </>
          )}
          {estado === 'ok' && (
            <>
              <div className="mb-2 text-3xl">✅</div>
              <p className="mb-4 text-[15px] font-semibold text-estado-aprobado-text">{mensaje}</p>
              <Link to="/login" className="font-semibold text-gov-primary">
                Ir a iniciar sesión
              </Link>
            </>
          )}
          {estado === 'error' && (
            <>
              <div className="mb-2 text-3xl">⚠️</div>
              <p className="mb-4 text-[15px] text-estado-rechazado-text">{mensaje}</p>
              <Link to="/login" className="font-semibold text-gov-primary">
                Volver al inicio de sesión
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default VerificarCorreo
