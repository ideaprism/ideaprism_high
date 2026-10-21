import { getInventions } from '@/utils/supabase/queries'
import { TestGallery } from './TestGallery'

export default async function TestPage() {
    // Fetch a batch of inventions to test the card layout
    const { data: inventions } = await getInventions({ page: '1' })

    return (
        <div className="min-h-screen bg-surface-container-low p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-on-surface mb-2">UI Component Test Lab</h1>
                <p className="text-on-surface-variant">Testing InventionCardV2 layout with fetching real data.</p>
            </header>

            <TestGallery inventions={inventions} />
        </div>
    )
}
