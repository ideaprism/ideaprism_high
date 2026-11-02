'use client'

import { useState } from 'react'
import { Invention, InventionCard } from './InventionCard'
import { InventionDetailModal } from './InventionDetailModal'

interface SearchResultGalleryProps {
    inventions: Invention[]
    viewMode?: 'grid' | 'list'
}

export function SearchResultGallery({ inventions, viewMode = 'grid' }: SearchResultGalleryProps) {
    const [selectedInvention, setSelectedInvention] = useState<Invention | null>(null)

    return (
        <>
            <div className={viewMode === 'list'
                ? "flex flex-col gap-4"
                : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8"
            }>
                {inventions.map((inv) => (
                    <div key={inv.id}>
                        <InventionCard
                            invention={inv}
                            onClick={() => setSelectedInvention(inv)}
                        />
                    </div>
                ))}
            </div>

            {selectedInvention && (
                <InventionDetailModal
                    invention={selectedInvention}
                    onClose={() => setSelectedInvention(null)}
                />
            )}
        </>
    )
}
