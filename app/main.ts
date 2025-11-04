import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { FFmpegService } from './services/FFmpegService';
import { StreamManager } from './services/StreamManager';
import Store from 'electron-store';

const store = new Store();
let mainWindow: BrowserWindow | null = null;
let ffmpegService: FFmpegService;
let streamManager: StreamManager;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        title: 'PiStream - Streaming Software',
        backgroundColor: '#1a1a1a',
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    // Initialize services
    ffmpegService = new FFmpegService();
    streamManager = new StreamManager(ffmpegService);

    // Setup IPC handlers
    setupIpcHandlers();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

function setupIpcHandlers() {
    // Stream controls
    ipcMain.handle('stream:start', async (_, config) => {
        try {
            await streamManager.startStream(config);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('stream:stop', async () => {
        try {
            await streamManager.stopStream();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('stream:status', async () => {
        return streamManager.getStatus();
    });

    // Recording controls
    ipcMain.handle('record:start', async (_, config) => {
        try {
            await streamManager.startRecording(config);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('record:stop', async () => {
        try {
            await streamManager.stopRecording();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get available sources
    ipcMain.handle('sources:get-displays', async () => {
        return ffmpegService.getDisplays();
    });

    ipcMain.handle('sources:get-audio-devices', async () => {
        return ffmpegService.getAudioDevices();
    });

    // Settings
    ipcMain.handle('settings:get', async (_, key) => {
        return store.get(key);
    });

    ipcMain.handle('settings:set', async (_, key, value) => {
        store.set(key, value);
        return { success: true };
    });

    ipcMain.handle('settings:get-all', async () => {
        return store.store;
    });

    // System info
    ipcMain.handle('system:info', async () => {
        return {
            platform: process.platform,
            arch: process.arch,
            version: app.getVersion(),
            isARM: process.arch.includes('arm'),
        };
    });
}

// Send status updates to renderer
function sendStatusUpdate(status: any) {
    if (mainWindow) {
        mainWindow.webContents.send('stream:status-update', status);
    }
}

export { sendStatusUpdate };
