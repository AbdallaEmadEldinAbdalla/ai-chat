import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';

const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
        cookies: {
            get(name: string) {
                return getCookie(name);
            },
            set(name: string, value: string, options: CookieOptions) {
                try {
                    setCookie(name, value, options);
                } catch (error) {
                    // The `set` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                }
            },
            remove(name: string, options: CookieOptions) {
                try {
                    deleteCookie(name, options);
                } catch (error) {
                    // The `delete` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                }
            },
        },
        auth: {
            autoRefreshToken: true
        }
    }
);

const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY!,
    {
        cookies: {
            get(name: string) {
                return getCookie(name);
            },
            set(name: string, value: string, options: CookieOptions) {
                try {
                    setCookie(name, value, options);
                } catch (error) {
                    // The `set` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                }
            },
            remove(name: string, options: CookieOptions) {
                try {
                    deleteCookie(name, options);
                } catch (error) {
                    // The `delete` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                }
            },
        },
        auth: {
            autoRefreshToken: true
        }
    }
);

export const createClient = () => {
    return client
};

export const createAdminClient = () => {
    return adminClient
};