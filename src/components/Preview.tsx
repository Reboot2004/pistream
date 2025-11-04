export default function Preview() {
    return (
        <div className="h-full bg-black rounded-lg border border-gray-700 flex items-center justify-center relative overflow-hidden">
            {/* Preview canvas will be rendered here */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                    <div className="mb-4">
                        <svg className="w-24 h-24 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="text-gray-400 text-lg">Stream Preview</p>
                    <p className="text-gray-500 text-sm mt-2">Add sources and start streaming to see preview</p>
                </div>
            </div>

            {/* Stats overlay */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-75 px-3 py-2 rounded text-xs space-y-1">
                <div className="flex justify-between space-x-4">
                    <span className="text-gray-400">FPS:</span>
                    <span className="text-green-400 font-mono">0</span>
                </div>
                <div className="flex justify-between space-x-4">
                    <span className="text-gray-400">Bitrate:</span>
                    <span className="text-blue-400 font-mono">0 kb/s</span>
                </div>
            </div>
        </div>
    );
}
