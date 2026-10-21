import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    active?: boolean
    label: string
}

const Chip = forwardRef<HTMLButtonElement, ChipProps>(
    ({ className, active = false, label, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center h-8 px-4 text-sm font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap",
                    active
                        ? "bg-secondary-container text-on-secondary-container border-transparent"
                        : "bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-variant/50",
                    className
                )}
                {...props}
            >
                {label}
            </button>
        )
    }
)
Chip.displayName = "Chip"

export { Chip }
