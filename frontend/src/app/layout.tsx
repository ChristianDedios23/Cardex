import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { AppProvider } from '@/components/app-shell/AppProvider';
import { AppShell } from '@/components/app-shell/AppShell';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Cardex',
    description: 'Pokémon card collection app',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} antialiased`}>                <AppProvider>
                    <AppShell>{children}</AppShell>
                </AppProvider>
            </body>
        </html>
    );
}
