import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next(); // Initialize response

    // Create Supabase server-side client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        supabaseResponse.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // Get user session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Check if user is authenticated and trying to access the login page
    if (pathname.startsWith('/login') && user) {
        // Prevent redirect loops by avoiding the same redirect if already there
        if (pathname !== '/dashboard') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    // Check if user is not authenticated and trying to access a protected page
    if ((pathname.startsWith('/dashboard') || pathname.startsWith('/profile')) && !user) {
        // Prevent redirect loops by avoiding redirecting if already on login page
        if (pathname !== '/login') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    if (pathname.endsWith('/dashboard/insights') && !user) {
        return NextResponse.redirect(new URL('/dashboard/insights/general', request.url));
    }

    // Return the updated response
    return supabaseResponse;
}