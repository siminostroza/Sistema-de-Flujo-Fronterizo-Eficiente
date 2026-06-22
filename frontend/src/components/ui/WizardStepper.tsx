/**
 * Indicador visual de pasos del wizard de registro de viaje (CAMBIO 6.1).
 * Muestra el paso actual resaltado, los pasos completados con un checkmark
 * en gov-green y los pasos bloqueados/pendientes en gris.
 * En móvil (< 480px), muestra "Paso X de 5" en lugar de los círculos.
 */
interface WizardStepperProps {
  steps: string[]
  /** Índice (base 0) del paso actual. */
  currentStep: number
  /** Índices (base 0) de los pasos ya completados/guardados en backend. */
  completedSteps: number[]
}

function WizardStepper({ steps, currentStep, completedSteps }: WizardStepperProps) {
  return (
    <>
      {/* Vista desktop: círculos y líneas */}
      <ol className="mb-5 hidden items-center sm:flex">
        {steps.map((label, index) => {
          const completo = completedSteps.includes(index)
          const actual = index === currentStep
          const esUltimo = index === steps.length - 1

          const circulo = completo
            ? 'bg-gov-green text-white border-gov-green'
            : actual
              ? 'bg-gov-primary text-white border-gov-primary'
              : 'bg-white text-gov-accent border-gov-accent'

          return (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[13px] font-bold ${circulo}`}
                >
                  {completo ? '✓' : index + 1}
                </span>
                <span
                  className={`mt-1 max-w-[72px] text-center text-[10px] font-semibold leading-tight ${
                    actual ? 'text-gov-primary' : completo ? 'text-gov-green' : 'text-gov-accent'
                  }`}
                >
                  {label}
                </span>
              </div>
              {!esUltimo && (
                <span
                  className={`mx-1 h-0.5 flex-1 ${
                    completo ? 'bg-gov-green' : 'bg-gov-neutral'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>

      {/* Vista móvil: texto "Paso X de 5" */}
      <div className="mb-5 text-center text-[14px] font-semibold text-gov-primary sm:hidden">
        Paso {currentStep + 1} de {steps.length}
      </div>
    </>
  )
}

export default WizardStepper
