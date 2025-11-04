import { useState, useEffect } from 'react';
import { useSceneStore } from '../stores/sceneStore';

export default function SourceList() {
    const { scenes, activeSceneId, addSourceToScene, removeSourceFromScene, toggleSource } = useSceneStore();
    const [displays, setDisplays] = useState<any[]>([]);
    const [audioDevices, setAudioDevices] = useState<any[]>([]);
    const [showAddMenu, setShowAddMenu] = useState(false);

    const activeScene = scenes.find(s => s.id === activeSceneId);

    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.getDisplays().then(setDisplays);
            window.electronAPI.getAudioDevices().then(setAudioDevices);
        }
    }, []);

    const addDisplaySource = (display: any) => {
        if (activeScene) {
            addSourceToScene(activeScene.id, {
                id: `source-${Date.now()}`,
                name: display.name,
                type: 'display',
                enabled: true,
                settings: { display: display.id },
            });
            setShowAddMenu(false);
        }
    };

    const addAudioSource = (device: any) => {
        if (activeScene) {
            addSourceToScene(activeScene.id, {
                id: `source-${Date.now()}`,
                name: device.name,
                type: 'audio',
                enabled: true,
                settings: { device: device.id },
            });
            setShowAddMenu(false);
        }
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-300 uppercase">Sources</h2>
                <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 rounded transition-colors"
                >
                    + Add
                </button>
            </div>

            {activeScene && (
                <div className="space-y-2">
                    {activeScene.sources.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-8">
                            No sources added yet
                        </div>
                    ) : (
                        activeScene.sources.map((source) => (
                            <div
                                key={source.id}
                                className="p-3 bg-gray-700 rounded-lg flex items-center justify-between"
                            >
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => toggleSource(activeScene.id, source.id)}
                                        className={`w-4 h-4 rounded ${source.enabled ? 'bg-green-500' : 'bg-gray-500'
                                            }`}
                                    />
                                    <span className="text-sm">{source.name}</span>
                                </div>
                                <button
                                    onClick={() => removeSourceFromScene(activeScene.id, source.id)}
                                    className="text-gray-400 hover:text-red-400 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {showAddMenu && (
                <div className="mt-3 p-3 bg-gray-700 rounded-lg space-y-2">
                    <div>
                        <div className="text-xs text-gray-400 mb-1">Display Capture</div>
                        {displays.map((display) => (
                            <button
                                key={display.id}
                                onClick={() => addDisplaySource(display)}
                                className="w-full text-left px-2 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded mb-1"
                            >
                                {display.name}
                            </button>
                        ))}
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 mb-1">Audio Input</div>
                        {audioDevices.map((device) => (
                            <button
                                key={device.id}
                                onClick={() => addAudioSource(device)}
                                className="w-full text-left px-2 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded mb-1"
                            >
                                {device.name}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowAddMenu(false)}
                        className="w-full px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}
