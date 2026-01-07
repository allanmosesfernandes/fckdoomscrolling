interface ContentCardProps {
    title: string;
    type: string;
    icon: string;
    content: string;
    metadata?: string;
}

export default function ContentCard({ title, type, icon, content, metadata }: ContentCardProps) {
    return (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm hover:shadow-md transition-shadow my-4">
            <div className="flex items-start gap-4">
                {/* <div className="text-2xl">{icon}</div> */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-50 capitalize">
                            {title}
                        </h3>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">{content}</p>
                    {metadata && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-500">{metadata}</p>
                    )}
                    <button className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition text-sm cursor-pointer">
                        ❤️ Save
                    </button>
                </div>
            </div>
        </div>
    );
}
