import { FiCheck } from 'react-icons/fi'

export default function StepIndicator({ steps, currentStep, onStepClick }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto py-4">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        const isClickable = index < currentStep

        return (
          <div key={step} className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={`step-indicator w-8 h-8 text-xs sm:w-10 sm:h-10 sm:text-sm ${
                isCompleted ? 'step-completed' : isActive ? 'step-active' : 'step-pending'
              } ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
            >
              {isCompleted ? <FiCheck className="w-5 h-5" /> : index + 1}
            </button>
            <span className={`text-xs sm:text-sm font-medium hidden sm:block truncate ${
              isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-white/30'
            }`}>
              {step}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-8 sm:w-16 h-0.5 transition-all duration-500 ${
                isCompleted ? 'bg-green-500' : 'bg-white/10'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
