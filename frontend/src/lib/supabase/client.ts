import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
        );
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export async function getAccessToken() {
    const supabase = createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
        return null;
    }

    const expiresAt = session.expires_at ?? 0;
    const expiresSoon = expiresAt * 1000 - Date.now() < 60_000;

    if (!expiresSoon) {
        return session.access_token;
    }

    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session?.access_token) {
        return session.access_token;
    }

    return data.session.access_token;
}
