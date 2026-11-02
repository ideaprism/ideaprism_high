import { useQuery } from '@tanstack/react-query'
import { getInventions, getInventionById, InventionSearchParams } from '@/utils/supabase/queries'

export function useInventions(params: InventionSearchParams) {
    return useQuery({
        queryKey: ['inventions', params],
        queryFn: () => getInventions(params),
        placeholderData: (previousData) => previousData,
    })
}

export function useInventionDetail(id: string) {
    return useQuery({
        queryKey: ['invention', id],
        queryFn: () => getInventionById(id),
        enabled: !!id,
    })
}
