import { useEffect, useRef, useState } from 'react';
import { useSceneStore } from '../stores/sceneStore';

export default function Preview() {
    const { scenes, activeSceneId } = useSceneStore();
    const activeScene = scenes.find(s => s.id === activeSceneId);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [previewLabel, setPreviewLabel] = useState<string>('Stream Preview');

    useEffect(() => {
        let currentStream: MediaStream | null = null;

        const displaySource = activeScene?.sources.find(s => s.type === 'display' && s.enabled);
        if (displaySource) {
            // Use Electron desktopCapturer (exposed via preload) to list sources and
            // then call getUserMedia with the chromeMediaSourceId to get a prompt-free preview.
            (async () => {
                try {
                    const sources = await (window as any).electronAPI.getDesktopSources({ types: ['screen', 'window'], thumbnailSize: { width: 0, height: 0 } });
                    // Try to match by name, otherwise pick first screen source
                    let picked = sources.find((s: any) => s.name && displaySource.name && s.name.includes(displaySource.name));
                    if (!picked) picked = sources.find((s: any) => s.id && s.id.startsWith('screen')) || sources[0];

                    if (!picked) throw new Error('No desktop source available for preview');

                    const constraints: any = {
                        audio: false,
                        video: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: picked.id,
                            }
                        }
                    };

                    const stream = await (navigator.mediaDevices as any).getUserMedia(constraints);
                    currentStream = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play().catch(() => { /* ignore */ });
                    }
                    setPreviewLabel(displaySource.name || 'Display');
                } catch (err) {
                    console.error('Display preview failed (desktopCapturer):', err);
                    setPreviewLabel('Preview unavailable');
                    if (videoRef.current) videoRef.current.srcObject = null;
                }
            })();
        } else {
            // No display source enabled - clear preview
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            setPreviewLabel('Stream Preview');
        }

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(t => t.stop());
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [activeSceneId, (activeScene?.sources.map(s => s.enabled).join(',') ?? '')]);

    return (
        <div className="h-full bg-black rounded-lg border border-gray-700 flex items-center justify-center relative overflow-hidden">
            {/* Video preview */}
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted />

            {!activeScene?.sources.find(s => s.type === 'display' && s.enabled) && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="mb-4">
                            <svg className="w-24 h-24 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-400 text-lg">{previewLabel}</p>
                        <p className="text-gray-500 text-sm mt-2">Add sources and enable a display source to see live preview</p>
                    </div>
                </div>
            )}

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

            {/* Audio sources summary */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-2 rounded text-xs">
                {activeScene?.sources.filter(s => s.type === 'audio' && s.enabled).length ? (
                    <div className="space-y-1">
                        <div className="text-gray-300 text-xs">Audio Sources:</div>
                        {activeScene?.sources.filter(s => s.type === 'audio' && s.enabled).map((a) => (
                            <div key={a.id} className="text-sm text-gray-200">{a.name}</div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-400">No audio source</div>
                )}
            </div>
        </div>
    );
}
