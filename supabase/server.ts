import { createServerClient } from '@supabase/ssr';
import { cookies as nextCookies } from 'next/headers';

export async function createClient() {
    // Asynchronously get cookies with a delay
    const getCookiesWithDelay = async (): Promise<
        { name: string; value: string }[]
    > => {
        const cookieData = nextCookies().getAll();
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(cookieData.map(({ name, value }) => ({ name, value })));
            }, 1000); // 1000ms delay
        });
    };

    const allCookies = await getCookiesWithDelay();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_KEY!,
        {
            cookies: {
                async getAll() {
                    return allCookies;
                },
                async setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            nextCookies().set(name, value, options)
                        );
                    } catch {
                        // Ignore errors when called from a Server Component
                    }
                },
            },
        }
    );
}