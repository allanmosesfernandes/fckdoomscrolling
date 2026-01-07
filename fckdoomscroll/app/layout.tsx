import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from './components/Header';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'FckDoomScroll - Your Daily Dose of Knowledge',
    description:
        'Reduce doomscrolling with daily curated content: words, capitals, facts, and history',
    openGraph: {
        title: 'FckDoomScroll',
        description: 'Daily anti-doomscrolling content',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <Header />
                <div className="flex min-h-screen justify-center bg-zinc-50 font-sans dark:bg-black">
                    <main className="flex min-h-screen w-full max-w-350 flex-col justify-between md:px-16 md:py-16 px-4 py-4 bg-white dark:bg-black sm:items-start">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
