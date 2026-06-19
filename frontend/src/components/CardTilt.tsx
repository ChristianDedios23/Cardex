'use client';

import { useCallback, useState, type MouseEvent, type ReactNode } from 'react';

const TILT_TRANSITION = 'transform 400ms cubic-bezier(0.03, 0.98, 0.52, 0.99)';

function throttle<T extends (...args: never[]) => void>(func: T, delay: number): T {
    let lastCall = 0;

    return ((...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall < delay) {
            return;
        }
        lastCall = now;
        func(...args);
    }) as T;
}

type CardTiltProps = {
    children: ReactNode;
    className?: string;
};

export function CardTilt({ children, className = '' }: CardTiltProps) {
    const [rotate, setRotate] = useState({ x: 0, y: 0 });

    const onMouseMove = useCallback(
        throttle((event: MouseEvent<HTMLDivElement>) => {
            const box = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - box.left;
            const y = event.clientY - box.top;
            const centerX = box.width / 2;
            const centerY = box.height / 2;
            const rotateX = (y - centerY) / 14;
            const rotateY = (centerX - x) / 14;

            setRotate({ x: rotateX, y: rotateY });
        }, 100),
        [],
    );

    const onMouseLeave = () => {
        setRotate({ x: 0, y: 0 });
    };

    return (
        <div
            className={`will-change-transform ${className}`.trim()}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
                transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(1, 1, 1)`,
                transition: TILT_TRANSITION,
            }}
        >
            {children}
        </div>
    );
}
