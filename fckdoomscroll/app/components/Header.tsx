import Link from 'next/link';

interface HeaderProps {
    isAuthenticated?: boolean;
    userName?: string;
}

export default function Header({ isAuthenticated = false, userName }: HeaderProps) {
    return (
        <nav className="flex justify-center bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex w-full max-w-350 items-center md:px-16 md:py-4 px-4 py-3">
                <Link
                    href="/"
                    className="font-semibold text-lg hover:text-zinc-600 dark:hover:text-zinc-400"
                >
                    PrinterPix
                </Link>
                {isAuthenticated ? (
                    <div className="flex ml-auto gap-4 items-center">
                        <Link
                            href="/favorites"
                            className="text-gray-300 hover:text-white transition"
                        >
                            Favorites
                        </Link>
                        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition">
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <div className="flex ml-auto gap-4 items-center">
                        <Link href="/login" className="text-gray-300 hover:text-white transition">
                            Sign In
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
