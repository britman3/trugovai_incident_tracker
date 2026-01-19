import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="label">
            {label}
            {props.required && <span className="text-severity-critical ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'input',
            error && 'border-severity-critical focus:ring-severity-critical',
            className
          )}
          {...props}
        />
        {error && <p className="text-small text-severity-critical mt-1">{error}</p>}
        {helperText && !error && (
          <p className="text-small text-slate-700 mt-1">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="label">
            {label}
            {props.required && <span className="text-severity-critical ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'input min-h-[120px] resize-y',
            error && 'border-severity-critical focus:ring-severity-critical',
            className
          )}
          {...props}
        />
        {error && <p className="text-small text-severity-critical mt-1">{error}</p>}
        {helperText && !error && (
          <p className="text-small text-slate-700 mt-1">{helperText}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  placeholder?: string
  options: { value: string | number; label: string; description?: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, placeholder = 'Select...', options, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="label">
            {label}
            {props.required && <span className="text-severity-critical ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'input',
            error && 'border-severity-critical focus:ring-severity-critical',
            className
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-small text-severity-critical mt-1">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

interface CheckboxGroupProps {
  label?: string
  options: { value: string; label: string }[]
  values: string[]
  onChange: (values: string[]) => void
  error?: string
}

export function CheckboxGroup({
  label,
  options,
  values,
  onChange,
  error,
}: CheckboxGroupProps) {
  const handleChange = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...values, value])
    } else {
      onChange(values.filter((v) => v !== value))
    }
  }

  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={values.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              className="w-4 h-4 text-teal rounded focus:ring-teal border-gray-300"
            />
            <span className="text-small text-slate-700">{option.label}</span>
          </label>
        ))}
      </div>
      {error && <p className="text-small text-severity-critical mt-1">{error}</p>}
    </div>
  )
}
