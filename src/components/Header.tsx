interface HeaderProps {
    onSettingsClick: () => void;
}

export default function Header({ onSettingsClick }: HeaderProps) {
    return (
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold">PiStream</h1>
                <span className="text-sm text-gray-400">Streaming Software</span>
            </div>

            <div className="flex items-center space-x-2">
                <button
                    onClick={onSettingsClick}
                    className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                    ⚙️ Settings
                </button>
            </div>
        </header>
    );
}
