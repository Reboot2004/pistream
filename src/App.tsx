import { useState, useEffect } from 'react';
import Header from './components/Header';
import Preview from './components/Preview';
import SourceList from './components/SourceList';
import SceneManager from './components/SceneManager';
import StreamControls from './components/StreamControls';
import Settings from './components/Settings';
import { useStreamStore } from './stores/streamStore';

function App() {
    const [showSettings, setShowSettings] = useState(false);
    const [systemInfo, setSystemInfo] = useState<any>(null);
    const { setStreamStatus } = useStreamStore();

    useEffect(() => {
        // Get system info
        if (window.electronAPI) {
            window.electronAPI.getSystemInfo().then(setSystemInfo);

            // Listen for stream status updates
            window.electronAPI.onStreamStatusUpdate((status) => {
                setStreamStatus(status);
            });
        }
    }, [setStreamStatus]);

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            <Header onSettingsClick={() => setShowSettings(true)} />

            <div className="flex-1 flex overflow-hidden">
                {/* Left sidebar - Sources & Scenes */}
                <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        <SceneManager />
                    </div>
                    <div className="flex-1 overflow-y-auto border-t border-gray-700">
                        <SourceList />
                    </div>
                </div>

                {/* Main content - Preview */}
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 p-4">
                        <Preview />
                    </div>

                    {/* Bottom controls */}
                    <div className="bg-gray-800 border-t border-gray-700">
                        <StreamControls systemInfo={systemInfo} />
                    </div>
                </div>
            </div>

            {/* Settings modal */}
            {showSettings && (
                <Settings onClose={() => setShowSettings(false)} />
            )}
        </div>
    );
}

export default App;
