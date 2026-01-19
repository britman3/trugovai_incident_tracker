import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-teal text-white hover:bg-teal/90',
    secondary: 'bg-navy text-white hover:bg-navy/90',
    outline: 'border-2 border-teal text-teal hover:bg-teal hover:text-white',
    danger: 'bg-severity-critical text-white hover:bg-severity-critical/90',
    ghost: 'text-slate-700 hover:bg-gray-100',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-small',
    md: 'px-4 py-3 text-body',
    lg: 'px-6 py-4 text-body',
  }

  return (
    <button
      className={cn(
        'rounded-button font-bold transition-colors inline-flex items-center justify-center',
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
