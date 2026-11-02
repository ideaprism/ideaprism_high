'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DeprecatedInquiriesPage() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/admin/codes')
    }, [router])

    return (
        <div className="flex items-center justify-center h-96">
            <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-500 font-bold">Redirecting to Codes Management...</p>
            </div>
        </div>
    )
}
