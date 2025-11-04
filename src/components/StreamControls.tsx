import { useState } from 'react';
import { useStreamStore } from '../stores/streamStore';
import { useSceneStore } from '../stores/sceneStore';

interface StreamControlsProps {
    systemInfo: any;
}

export default function StreamControls({ systemInfo }: StreamControlsProps) {
    const { status, settings, setStreamStatus } = useStreamStore();
    const { scenes, activeSceneId } = useSceneStore();
    const [isStarting, setIsStarting] = useState(false);

    const activeScene = scenes.find(s => s.id === activeSceneId);

    const handleStartStream = async () => {
        if (!settings.streamKey) {
            alert('Please set your stream key in settings first!');
            return;
        }

        const displaySource = activeScene?.sources.find(s => s.type === 'display' && s.enabled);
        if (!displaySource) {
            alert('Please add and enable a display source first!');
            return;
        }

        setIsStarting(true);
        try {
            const result = await window.electronAPI.startStream({
                ...settings,
                display: displaySource.settings.display,
                audioDevice: activeScene?.sources.find(s => s.type === 'audio' && s.enabled)?.settings.device,
            });

            if (result.success) {
                setStreamStatus({ isStreaming: true });
            } else {
                alert(`Failed to start stream: ${result.error}`);
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsStarting(false);
        }
    };

    const handleStopStream = async () => {
        try {
            const result = await window.electronAPI.stopStream();
            if (result.success) {
                setStreamStatus({ isStreaming: false });
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        }
    };

    const handleStartRecording = async () => {
        const displaySource = activeScene?.sources.find(s => s.type === 'display' && s.enabled);
        if (!displaySource) {
            alert('Please add and enable a display source first!');
            return;
        }

        try {
            const result = await window.electronAPI.startRecording({
                display: displaySource.settings.display,
                audioDevice: activeScene?.sources.find(s => s.type === 'audio' && s.enabled)?.settings.device,
                outputPath: `recording-${Date.now()}.mp4`,
                resolution: settings.resolution,
                fps: settings.fps,
                videoBitrate: settings.videoBitrate,
                audioBitrate: settings.audioBitrate,
            });

            if (result.success) {
                setStreamStatus({ isRecording: true });
            } else {
                alert(`Failed to start recording: ${result.error}`);
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        }
    };

    const handleStopRecording = async () => {
        try {
            const result = await window.electronAPI.stopRecording();
            if (result.success) {
                setStreamStatus({ isRecording: false });
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        }
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between">
                {/* Left side - Stream info */}
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${status.isStreaming ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
                        <span className="text-sm">
                            {status.isStreaming ? 'LIVE' : 'Offline'}
                        </span>
                    </div>

                    {status.isStreaming && (
                        <>
                            <div className="text-sm">
                                <span className="text-gray-400">FPS:</span>
                                <span className="ml-1 font-mono text-green-400">{status.fps.toFixed(1)}</span>
                            </div>
                            <div className="text-sm">
                                <span className="text-gray-400">Bitrate:</span>
                                <span className="ml-1 font-mono text-blue-400">{(status.bitrate / 1000).toFixed(1)} Mbps</span>
                            </div>
                        </>
                    )}

                    {systemInfo?.isARM && (
                        <div className="text-xs bg-purple-600 px-2 py-1 rounded">
                            ARM64 Optimized
                        </div>
                    )}
                </div>

                {/* Right side - Controls */}
                <div className="flex items-center space-x-3">
                    {/* Start/Stop Streaming */}
                    {!status.isStreaming ? (
                        <button
                            onClick={handleStartStream}
                            disabled={isStarting}
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                            </svg>
                            <span>{isStarting ? 'Starting...' : 'Start Streaming'}</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleStopStream}
                            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                            </svg>
                            <span>Stop Streaming</span>
                        </button>
                    )}

                    {/* Start/Stop Recording */}
                    {!status.isRecording ? (
                        <button
                            onClick={handleStartRecording}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            title="Start Recording"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="6" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            onClick={handleStopRecording}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors animate-pulse"
                            title="Stop Recording"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <rect x="6" y="6" width="8" height="8" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
