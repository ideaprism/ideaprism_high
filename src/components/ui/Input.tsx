import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && (
                    <label className="text-sm font-medium text-on-surface-variant ml-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        type={type}
                        className={cn(
                            "flex h-12 w-full rounded-lg border border-outline bg-surface px-4 py-2 text-on-surface transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-outline-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
                            error && "border-error focus-visible:ring-error",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-xs text-error ml-3 mt-0.5">{error}</p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
