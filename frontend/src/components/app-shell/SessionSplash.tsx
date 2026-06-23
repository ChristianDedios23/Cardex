'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { useTypingEffect } from '@/hooks/useTypingEffect';

const SPLASH_BRAND_TEXT = 'Cardex';
const SPLASH_TYPING_MS = 100;
const SPLASH_HOLD_AFTER_TYPING_MS = 400;
const SPLASH_EXIT_MS = 900;

type SplashPhase = 'hidden' | 'visible' | 'exiting';

export function SessionSplash() {
    const [phase, setPhase] = useState<SplashPhase>('hidden');
    const typedText = useTypingEffect(SPLASH_BRAND_TEXT, SPLASH_TYPING_MS, true);
    const isTypingComplete = typedText.length === SPLASH_BRAND_TEXT.length;

    useLayoutEffect(() => {
        setPhase('visible');
        document.documentElement.classList.add('session-splash-active');
    }, []);

    useEffect(() => {
        if (phase !== 'visible' || !isTypingComplete) {
            return;
        }

        const exitTimer = window.setTimeout(() => {
            setPhase('exiting');
        }, SPLASH_HOLD_AFTER_TYPING_MS);

        return () => window.clearTimeout(exitTimer);
    }, [phase, isTypingComplete]);

    useEffect(() => {
        if (phase === 'hidden') {
            document.documentElement.classList.remove('session-splash-active');
        }
    }, [phase]);

    function handleExitComplete() {
        if (phase !== 'exiting') {
            return;
        }

        document.documentElement.classList.remove('session-splash-active');
        setPhase('hidden');
    }

    if (phase === 'hidden') {
        return null;
    }

    return (
        <div
            className={`session-splash ${phase === 'exiting' ? 'session-splash--exiting' : ''}`}
            style={phase === 'exiting' ? { animationDuration: `${SPLASH_EXIT_MS}ms` } : undefined}
            onAnimationEnd={handleExitComplete}
            role="status"
            aria-live="polite"
            aria-label="Loading Cardex"
        >
            <div className="app-dot-grid-bg session-splash-bg" aria-hidden="true" />
            <p className="session-splash-title" aria-hidden="true">
                {typedText}
                <span className="session-splash-cursor">|</span>
            </p>
        </div>
    );
}
