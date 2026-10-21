'use client'

import { useState } from 'react'
import { InventionV2, InventionCardV2 } from '@/components/features/InventionCardV2'
import { InventionDetailModal } from '@/components/features/InventionDetailModal'

interface TestGalleryProps {
    inventions: InventionV2[]
}

export function TestGallery({ inventions }: TestGalleryProps) {
    const [selectedInvention, setSelectedInvention] = useState<InventionV2 | null>(null)

    return (
        <>
            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {inventions.map((inv) => (
                    <InventionCardV2
                        key={inv.id}
                        invention={inv}
                        onClick={() => setSelectedInvention(inv)}
                    />
                ))}
            </main>

            {selectedInvention && (
                <InventionDetailModal
                    invention={selectedInvention}
                    onClose={() => setSelectedInvention(null)}
                />
            )}
        </>
    )
}
