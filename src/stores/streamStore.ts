import { create } from 'zustand';

export interface StreamStatus {
    isStreaming: boolean;
    isRecording: boolean;
    streamStartTime?: number;
    recordStartTime?: number;
    fps: number;
    bitrate: number;
    droppedFrames: number;
}

export interface StreamSettings {
    platform: 'twitch' | 'youtube' | 'custom';
    streamKey: string;
    customUrl?: string;
    resolution: string;
    fps: number;
    videoBitrate: string;
    audioBitrate: string;
    videoCodec?: string;
    // recordingFormat: 'auto' picks platform default (webm on Linux), otherwise 'mp4' or 'webm'
    recordingFormat?: 'auto' | 'mp4' | 'webm';
}

interface StreamStore {
    status: StreamStatus;
    settings: StreamSettings;
    setStreamStatus: (status: Partial<StreamStatus>) => void;
    updateSettings: (settings: Partial<StreamSettings>) => void;
    resetStatus: () => void;
}

const defaultStatus: StreamStatus = {
    isStreaming: false,
    isRecording: false,
    fps: 0,
    bitrate: 0,
    droppedFrames: 0,
};

const defaultSettings: StreamSettings = {
    platform: 'twitch',
    streamKey: '',
    resolution: '1280x720',
    fps: 30,
    videoBitrate: '2500k',
    audioBitrate: '128k',
    videoCodec: 'auto',
    recordingFormat: 'auto',
};

export const useStreamStore = create<StreamStore>((set) => ({
    status: defaultStatus,
    settings: defaultSettings,
    setStreamStatus: (status) =>
        set((state) => ({
            status: { ...state.status, ...status },
        })),
    updateSettings: (settings) =>
        set((state) => ({
            settings: { ...state.settings, ...settings },
        })),
    resetStatus: () => set({ status: defaultStatus }),
}));
