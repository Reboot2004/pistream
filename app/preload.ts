import { contextBridge, ipcRenderer, desktopCapturer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Stream controls
    startStream: (config: any) => ipcRenderer.invoke('stream:start', config),
    stopStream: () => ipcRenderer.invoke('stream:stop'),
    getStreamStatus: () => ipcRenderer.invoke('stream:status'),
    onStreamStatusUpdate: (callback: (status: any) => void) => {
        ipcRenderer.on('stream:status-update', (_, status) => callback(status));
    },

    // Recording controls
    startRecording: (config: any) => ipcRenderer.invoke('record:start', config),
    stopRecording: () => ipcRenderer.invoke('record:stop'),

    // Sources
    getDisplays: () => ipcRenderer.invoke('sources:get-displays'),
    getAudioDevices: () => ipcRenderer.invoke('sources:get-audio-devices'),
    // Desktop capture sources (screens/windows)
    getDesktopSources: (opts?: any) => desktopCapturer.getSources(opts || { types: ['screen', 'window'], thumbnailSize: { width: 0, height: 0 } }),

    // Settings
    getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
    setSetting: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
    getAllSettings: () => ipcRenderer.invoke('settings:get-all'),

    // System info
    getSystemInfo: () => ipcRenderer.invoke('system:info'),
    // Dialogs
    showSaveDialog: (defaultPath?: string) => ipcRenderer.invoke('dialog:save-file', defaultPath),
});

// Type definitions for TypeScript
export interface ElectronAPI {
    startStream: (config: any) => Promise<{ success: boolean; error?: string }>;
    stopStream: () => Promise<{ success: boolean; error?: string }>;
    getStreamStatus: () => Promise<any>;
    onStreamStatusUpdate: (callback: (status: any) => void) => void;
    startRecording: (config: any) => Promise<{ success: boolean; error?: string }>;
    stopRecording: () => Promise<{ success: boolean; error?: string }>;
    getDisplays: () => Promise<any[]>;
    getAudioDevices: () => Promise<any[]>;
    getSetting: (key: string) => Promise<any>;
    setSetting: (key: string, value: any) => Promise<{ success: boolean }>;
    getAllSettings: () => Promise<any>;
    getSystemInfo: () => Promise<any>;
    showSaveDialog: (defaultPath?: string) => Promise<{ canceled: boolean; filePath?: string | undefined }>;
    getDesktopSources: (opts?: any) => Promise<Electron.DesktopCapturerSource[]>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
