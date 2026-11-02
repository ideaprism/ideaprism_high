'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'

/**
 * 스크롤 시 페이드인 애니메이션 컴포넌트
 * IntersectionObserver를 사용하여 뷰포트에 들어올 때 애니메이션 실행
 */
export function FadeInSection({
    children,
    delay = 0,
    className = ''
}: {
    children: ReactNode
    delay?: number
    className?: string
}) {
    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => setIsVisible(true), delay)
                    observer.unobserve(entry.target)
                }
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        )

        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => observer.disconnect()
    }, [delay])

    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out ${isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
                } ${className}`}
        >
            {children}
        </div>
    )
}

/**
 * 스크롤 시 회전 + 페이드인 애니메이션 컴포넌트
 * 스캠퍼 가이드 등에서 활용
 */
export function RotateInSection({
    children,
    delay = 0,
    className = ''
}: {
    children: ReactNode
    delay?: number
    className?: string
}) {
    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => setIsVisible(true), delay)
                    observer.unobserve(entry.target)
                }
            },
            { threshold: 0.1 }
        )

        if (ref.current) {
            observer.observe(ref.current)
        }
        return () => observer.disconnect()
    }, [delay])

    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out ${isVisible
                ? 'opacity-100 rotate-0 scale-100'
                : 'opacity-0 rotate-[-2deg] scale-95'
                } ${className}`}
        >
            {children}
        </div>
    )
}
