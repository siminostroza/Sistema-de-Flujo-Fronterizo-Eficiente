import {
  TIPOS_DOCUMENTO,
  etiquetaIdentificador,
  placeholderIdentificador,
  type TipoDocumento,
} from '../../utils/documento'

const inputClass =
  'mb-3.5 w-full rounded-md border border-gov-accent px-3 py-2.5 text-[15px] outline-none focus:border-gov-primary'
const labelClass = 'mb-1 block text-[13px] font-semibold text-gov-gray-a'

interface DocumentoFieldsProps {
  tipoDocumento: TipoDocumento
  identificador: string
  onTipoDocumentoChange: (tipo: TipoDocumento) => void
  onIdentificadorChange: (valor: string) => void
  /**
   * En modo "registro" el tipo SIN_DOCUMENTO oculta el campo identificador
   * (el backend lo genera). En modo "login" siempre se pide el identificador,
   * incluyendo el código temporal TEMP-... para pasajeros sin documento.
   */
  modo: 'login' | 'registro'
  idPrefix: string
}

/**
 * Selector de tipo de documento + campo identificador dinámico, reutilizado
 * en los formularios de login y registro de pasajero y funcionario (RF01).
 */
function DocumentoFields({
  tipoDocumento,
  identificador,
  onTipoDocumentoChange,
  onIdentificadorChange,
  modo,
  idPrefix,
}: DocumentoFieldsProps) {
  const ocultarIdentificador = modo === 'registro' && tipoDocumento === 'SIN_DOCUMENTO'

  return (
    <>
      <label className={labelClass} htmlFor={`${idPrefix}-tipo-documento`}>
        Tipo de documento
      </label>
      <select
        id={`${idPrefix}-tipo-documento`}
        value={tipoDocumento}
        onChange={(e) => onTipoDocumentoChange(e.target.value as TipoDocumento)}
        className={inputClass}
      >
        {TIPOS_DOCUMENTO.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>

      {ocultarIdentificador ? (
        <p className="mb-3.5 rounded-md bg-gov-primary-light px-3 py-2.5 text-[13px] text-gov-primary-dark">
          Se generará un código temporal. Presenta tu identidad al funcionario en la caseta.
        </p>
      ) : (
        <>
          <label className={labelClass} htmlFor={`${idPrefix}-identificador`}>
            {etiquetaIdentificador(tipoDocumento)}
          </label>
          <input
            id={`${idPrefix}-identificador`}
            type="text"
            placeholder={placeholderIdentificador(tipoDocumento)}
            value={identificador}
            onChange={(e) => onIdentificadorChange(e.target.value)}
            className={inputClass}
            autoComplete="username"
          />
        </>
      )}
    </>
  )
}

export default DocumentoFields
