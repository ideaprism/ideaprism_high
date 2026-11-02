import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export async function createClient() {
    // Some local/dev environments use corporate/self-signed TLS interception.
    // Allow an explicit opt-in fallback for local debugging only.
    if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_INSECURE_TLS === 'true') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    }

    const cookieStore = await cookies()

    const client = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    // console.log('Setting cookies in server client', cookiesToSet)
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )

    console.log('[Server] Connecting to Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    return client
}
