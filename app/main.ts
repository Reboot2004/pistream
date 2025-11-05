import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { FFmpegService } from './services/FFmpegService';
import { StreamManager } from './services/StreamManager';
import Store from 'electron-store';

const store = new Store();
let mainWindow: BrowserWindow | null = null;
let ffmpegService: FFmpegService;
let streamManager: StreamManager;

import fs from 'fs';
const isDevEnv = process.env.NODE_ENV === 'development';

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

    // Prefer loading built files unless explicitly running in dev mode
    const rendererIndex = path.join(__dirname, '../renderer/index.html');
    const hasBuiltRenderer = fs.existsSync(rendererIndex);

    if (isDevEnv && process.env.VITE_DEV_SERVER_URL) {
        // Explicit dev server URL provided (npm run dev scenario)
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else if (hasBuiltRenderer) {
        // Load the built renderer (production/start:prod scenario)
        mainWindow.loadFile(rendererIndex);
    } else {
        // Fallback to dev server if available, otherwise show a helpful error page
        const devUrl = 'http://localhost:3000';
        mainWindow.loadURL(devUrl).catch(() => {
            // If dev server is not running, display a simple message
            const html = `<!doctype html><html><body style="background:#111;color:#eee;font:14px sans-serif;padding:24px;">
                    <h2>Renderer not found</h2>
                    <p>No built files detected at <code>${rendererIndex}</code> and Vite dev server not running at <code>${devUrl}</code>.</p>
                    <ol>
                        <li>For production: run <code>npm run build</code> then <code>npm run start:prod</code></li>
                        <li>For development: run <code>npm run dev</code></li>
                    </ol>
                </body></html>`;
            mainWindow!.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
        });
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

    // Dialogs
    ipcMain.handle('dialog:save-file', async (_, defaultPath?: string) => {
        const win = mainWindow as BrowserWindow | null;
        const opts: Electron.SaveDialogOptions = {
            title: 'Save recording',
            defaultPath: defaultPath || `recording-${Date.now()}.mp4`,
            filters: [{ name: 'MP4 Video', extensions: ['mp4'] }],
        };
        const result = await dialog.showSaveDialog(opts);
        return { canceled: result.canceled, filePath: result.filePath };
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
