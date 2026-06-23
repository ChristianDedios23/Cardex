import { useEffect, useState } from 'react';

export function useTypingEffect(text: string, duration: number, isTypeByLetter = false): string {
    const [currentPosition, setCurrentPosition] = useState(0);
    const items = isTypeByLetter ? text.split('') : text.split(' ');

    useEffect(() => {
        setCurrentPosition(0);
    }, [text]);

    useEffect(() => {
        if (currentPosition >= items.length) {
            return;
        }

        const intervalId = window.setInterval(() => {
            setCurrentPosition((prevPosition) => prevPosition + 1);
        }, duration);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [currentPosition, items, duration]);

    return items.slice(0, currentPosition).join(isTypeByLetter ? '' : ' ');
}
