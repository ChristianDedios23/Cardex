import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProvider } from '@/components/app-shell/AppProvider';
import { AppShell } from '@/components/app-shell/AppShell';
import './globals.css';

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Cardex',
    description: 'Pokémon card collection app',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={`${inter.variable} antialiased`}>
                <AppProvider>
                    <AppShell>{children}</AppShell>
                </AppProvider>
            </body>
        </html>
    );
}
