import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'filled' | 'outlined' | 'text' | 'tonal'
    size?: 'sm' | 'md' | 'lg'
    fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'filled', size = 'md', fullWidth = false, ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer"

        const sizeStyles = {
            sm: "px-4 py-1.5 text-xs",
            md: "px-6 py-2.5 text-sm",
            lg: "px-8 py-3 text-base"
        }

        const variants = {
            filled: "bg-primary text-on-primary hover:shadow-md hover:bg-primary/90 active:shadow-none",
            outlined: "border border-outline text-primary hover:bg-primary/10",
            text: "text-primary hover:bg-primary/10 px-4",
            tonal: "bg-secondary-container text-on-secondary-container hover:shadow-md hover:bg-secondary-container/80"
        }

        return (
            <button
                ref={ref}
                className={cn(baseStyles, sizeStyles[size], variants[variant], fullWidth ? "w-full" : "", className)}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
