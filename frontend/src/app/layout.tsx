import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProvider } from '@/components/app-shell/AppProvider';
import { AppShell } from '@/components/app-shell/AppShell';
import { TestApp } from '@/components/TestApp';
import { UI_ASSETS } from '@/lib/ui-assets';
import './globals.css';

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Cardex',
    description: 'Pokémon card collection app',
    icons: {
        icon: UI_ASSETS.brand.favicon,
    },
};
export default function RootLayout({ children: _children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={`${inter.variable} antialiased`}>
                <AppProvider>
                    <AppShell>
                        <TestApp />
                    </AppShell>
                </AppProvider>
            </body>
        </html>
    );
}
