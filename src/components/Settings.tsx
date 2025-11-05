import { useState, useEffect } from 'react';
import { useStreamStore } from '../stores/streamStore';

interface SettingsProps {
    onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
    const { settings, updateSettings } = useStreamStore();
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSave = () => {
        updateSettings(localSettings);
        // Save to electron store
        if (window.electronAPI) {
            window.electronAPI.setSetting('streamSettings', localSettings);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Settings</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Streaming Platform */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Streaming Platform</label>
                            <select
                                value={localSettings.platform}
                                onChange={(e) => setLocalSettings({ ...localSettings, platform: e.target.value as any })}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                            >
                                <option value="twitch">Twitch</option>
                                <option value="youtube">YouTube</option>
                                <option value="custom">Custom RTMP</option>
                            </select>
                        </div>

                        {/* Stream Key */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Stream Key</label>
                            <input
                                type="password"
                                value={localSettings.streamKey}
                                onChange={(e) => setLocalSettings({ ...localSettings, streamKey: e.target.value })}
                                placeholder="Enter your stream key..."
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                {localSettings.platform === 'twitch' && 'Get your stream key from Twitch Dashboard → Settings → Stream'}
                                {localSettings.platform === 'youtube' && 'Get your stream key from YouTube Studio → Go Live → Stream Settings'}
                                {localSettings.platform === 'custom' && 'Enter your RTMP stream key'}
                            </p>
                        </div>

                        {/* Custom RTMP URL */}
                        {localSettings.platform === 'custom' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Custom RTMP URL</label>
                                <input
                                    type="text"
                                    value={localSettings.customUrl || ''}
                                    onChange={(e) => setLocalSettings({ ...localSettings, customUrl: e.target.value })}
                                    placeholder="rtmp://your-server.com/live"
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        )}

                        {/* Video Settings */}
                        <div className="border-t border-gray-700 pt-6">
                            <h3 className="text-lg font-semibold mb-4">Video Settings</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Resolution</label>
                                    <select
                                        value={localSettings.resolution}
                                        onChange={(e) => setLocalSettings({ ...localSettings, resolution: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="1920x1080">1920x1080 (1080p)</option>
                                        <option value="1280x720">1280x720 (720p)</option>
                                        <option value="854x480">854x480 (480p)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Frame Rate</label>
                                    <select
                                        value={localSettings.fps}
                                        onChange={(e) => setLocalSettings({ ...localSettings, fps: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="60">60 FPS</option>
                                        <option value="30">30 FPS</option>
                                        <option value="24">24 FPS</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Video Bitrate</label>
                                    <select
                                        value={localSettings.videoBitrate}
                                        onChange={(e) => setLocalSettings({ ...localSettings, videoBitrate: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="6000k">6000 kbps (High)</option>
                                        <option value="4500k">4500 kbps</option>
                                        <option value="3000k">3000 kbps (Medium)</option>
                                        <option value="2500k">2500 kbps</option>
                                        <option value="1500k">1500 kbps (Low)</option>
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Recommended for Raspberry Pi: 1500-2500 kbps
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Audio Bitrate</label>
                                    <select
                                        value={localSettings.audioBitrate}
                                        onChange={(e) => setLocalSettings({ ...localSettings, audioBitrate: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="320k">320 kbps</option>
                                        <option value="192k">192 kbps</option>
                                        <option value="128k">128 kbps</option>
                                        <option value="96k">96 kbps</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Video Codec</label>
                                    <select
                                        value={localSettings.videoCodec || 'auto'}
                                        onChange={(e) => setLocalSettings({ ...localSettings, videoCodec: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="auto">Auto (recommended)</option>
                                        <option value="libx264">libx264 (software)</option>
                                        <option value="h264_omx">h264_omx (Raspberry Pi legacy)</option>
                                        <option value="h264_v4l2m2m">h264_v4l2m2m (Pi4+)</option>
                                        <option value="h264_vaapi">h264_vaapi (Intel/VAAPI)</option>
                                        <option value="h264_nvenc">h264_nvenc (NVIDIA)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* About */}
                        <div className="border-t border-gray-700 pt-6">
                            <h3 className="text-lg font-semibold mb-2">About PiStream</h3>
                            <p className="text-sm text-gray-400">
                                Lightweight streaming software for ARM64 devices like Raspberry Pi.
                                Alternative to OBS Studio with hardware-accelerated encoding support.
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Version 1.0.0 | Built for ARM64 & x64
                            </p>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-700">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                        >
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
