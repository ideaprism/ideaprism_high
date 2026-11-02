import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'elevated' | 'filled' | 'outlined'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'elevated', ...props }, ref) => {
        const baseStyles = "rounded-[20px] p-6 transition-all duration-200"

        const variants = {
            elevated: "bg-surface shadow-md hover:shadow-lg",
            filled: "bg-surface-variant hover:bg-surface-variant/80",
            outlined: "bg-surface border border-outline-variant"
        }

        return (
            <div
                ref={ref}
                className={cn(baseStyles, variants[variant], className)}
                {...props}
            />
        )
    }
)
Card.displayName = "Card"

export { Card }
