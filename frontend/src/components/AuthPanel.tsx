'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

type AuthPanelProps = {
    initialMode?: 'signin' | 'signup';
    onAuthChange: (user: User | null) => void;
    onClose?: () => void;
};

export function AuthPanel({ initialMode = 'signin', onAuthChange, onClose }: AuthPanelProps) {
    const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    function switchMode(next: 'signin' | 'signup') {
        setMode(next);
        setMessage(null);
        setShowPassword(false);
        setConfirmPassword('');
    }

    async function handleSignIn() {
        setLoading(true);
        setMessage(null);

        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        setLoading(false);

        if (error) {
            setMessage(error.message);
            return;
        }

        if (!data.session) {
            setMessage('Sign in succeeded but no session was returned. Confirm your email first.');
            return;
        }

        onAuthChange(data.user);
        onClose?.();
    }

    async function handleSignUp() {
        if (password !== confirmPassword) {
            setMessage('Passwords do not match.');
            return;
        }

        setLoading(true);
        setMessage(null);

        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({ email, password });

        setLoading(false);

        if (error) {
            setMessage(error.message);
            return;
        }

        if (data.session && data.user) {
            onAuthChange(data.user);
            onClose?.();
        } else {
            setMessage('Account created. Check your email if confirmation is required.');
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (mode !== 'signin' || loading || !email || !password) return;

        void handleSignIn();
    }

    function blockEnterOnSignUp(event: KeyboardEvent<HTMLInputElement>) {
        if (mode === 'signup' && event.key === 'Enter') {
            event.preventDefault();
        }
    }

    const passwordsMatch = password === confirmPassword;
    const canSignUp = !loading && Boolean(email && password && confirmPassword) && passwordsMatch;

    return (
        <section className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
            <h2 id="auth-dialog-title" className="mb-4 text-lg font-medium">
                {mode === 'signin' ? 'Welcome Back!' : 'Create an Account!'}
            </h2>
            <form onSubmit={handleSubmit} className="grid gap-3 text-left">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={blockEnterOnSignUp}
                    autoComplete="email"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                />
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={blockEnterOnSignUp}
                        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-3 pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--muted)] hover:text-[var(--foreground)]"
                    >
                        {showPassword ? (
                            <FaEyeSlash className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <FaEye className="h-4 w-4" aria-hidden="true" />
                        )}
                    </button>
                </div>
                {mode === 'signup' && (
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={blockEnterOnSignUp}
                        autoComplete="new-password"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                    />
                )}
                <div className="flex justify-center pt-1">
                    {mode === 'signin' ? (
                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                        >
                            Sign in
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => void handleSignUp()}
                            disabled={!canSignUp}
                            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                        >
                            Sign up
                        </button>
                    )}
                </div>
                {mode === 'signup' && confirmPassword && !passwordsMatch && (
                    <p className="text-center text-sm text-[var(--danger)]">
                        Passwords do not match.
                    </p>
                )}
                {message && <p className="text-center text-sm text-[var(--muted)]">{message}</p>}
                <p className="text-center text-sm text-[var(--muted)]">
                    {mode === 'signin' ? (
                        <>
                            Don&apos;t have an account?{' '}
                            <button
                                type="button"
                                onClick={() => switchMode('signup')}
                                className="text-[var(--accent)] hover:text-[var(--accent-hover)]"
                            >
                                Sign Up
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => switchMode('signin')}
                                className="text-[var(--accent)] hover:text-[var(--accent-hover)]"
                            >
                                Sign In
                            </button>
                        </>
                    )}
                </p>
            </form>
        </section>
    );
}
