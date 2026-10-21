import { ClientSearchPage } from '@/components/features/ClientSearchPage'

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const params = await searchParams
    const initialKeyword = params.q || ''

    return <ClientSearchPage initialKeyword={initialKeyword} />
}
