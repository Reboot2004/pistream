import { FFmpegService } from './FFmpegService';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import os from 'os';

export interface StreamConfig {
    platform: 'twitch' | 'youtube' | 'custom';
    streamKey: string;
    customUrl?: string;
    display: string;
    audioDevice?: string;
    resolution: string;
    fps: number;
    videoBitrate: string;
    audioBitrate: string;
    videoCodec?: string;
}

export interface RecordConfig {
    display: string;
    audioDevice?: string;
    outputPath: string;
    resolution: string;
    fps: number;
    videoBitrate: string;
    audioBitrate: string;
    videoCodec?: string;
}

export interface StreamStatus {
    isStreaming: boolean;
    isRecording: boolean;
    streamStartTime?: number;
    recordStartTime?: number;
    fps: number;
    bitrate: number;
    droppedFrames: number;
}

export class StreamManager {
    private ffmpegService: FFmpegService;
    private streamProcess: ffmpeg.FfmpegCommand | null = null;
    private recordProcess: ffmpeg.FfmpegCommand | null = null;
    private status: StreamStatus;

    constructor(ffmpegService: FFmpegService) {
        this.ffmpegService = ffmpegService;
        this.status = {
            isStreaming: false,
            isRecording: false,
            fps: 0,
            bitrate: 0,
            droppedFrames: 0,
        };
    }

    /**
     * Start streaming
     */
    async startStream(config: StreamConfig): Promise<void> {
        if (this.streamProcess) {
            throw new Error('Stream already running');
        }

        const rtmpUrl = this.getRtmpUrl(config);

        const streamConfig = {
            display: config.display,
            audioDevice: config.audioDevice,
            rtmpUrl,
            videoBitrate: config.videoBitrate,
            audioBitrate: config.audioBitrate,
            resolution: config.resolution,
            fps: config.fps,
            videoCodec: (config as any).videoCodec,
        };

        this.streamProcess = this.ffmpegService.createStreamCommand(streamConfig);

        return new Promise((resolve, reject) => {
            this.streamProcess!
                .on('start', (commandLine) => {
                    console.log('Stream started:', commandLine);
                    this.status.isStreaming = true;
                    this.status.streamStartTime = Date.now();
                    resolve();
                })
                .on('progress', (progress) => {
                    this.status.fps = progress.currentFps || 0;
                    this.status.bitrate = progress.currentKbps || 0;
                    // Send update to renderer process
                })
                .on('error', (err, stdout, stderr) => {
                    console.error('Stream error:', err.message);
                    console.error('FFmpeg stderr:', stderr);
                    this.status.isStreaming = false;
                    this.streamProcess = null;
                    reject(err);
                })
                .on('end', () => {
                    console.log('Stream ended');
                    this.status.isStreaming = false;
                    this.streamProcess = null;
                })
                .run();
        });
    }

    /**
     * Stop streaming
     */
    async stopStream(): Promise<void> {
        if (!this.streamProcess) {
            throw new Error('No stream running');
        }

        return new Promise((resolve) => {
            this.streamProcess!.on('end', () => {
                this.status.isStreaming = false;
                this.streamProcess = null;
                resolve();
            });
            this.streamProcess!.kill('SIGINT');
        });
    }

    /**
     * Start recording
     */
    async startRecording(config: RecordConfig): Promise<void> {
        if (this.recordProcess) {
            throw new Error('Recording already running');
        }

        // Ensure output directory exists
        const outputDir = path.dirname(config.outputPath);
        if (!outputDir) {
            config.outputPath = path.join(os.homedir(), 'Videos', `recording-${Date.now()}.mp4`);
        }

        this.recordProcess = this.ffmpegService.createRecordCommand(config);

        return new Promise((resolve, reject) => {
            this.recordProcess!
                .on('start', (commandLine) => {
                    console.log('Recording started:', commandLine);
                    this.status.isRecording = true;
                    this.status.recordStartTime = Date.now();
                    resolve();
                })
                .on('progress', (progress) => {
                    // Update recording progress
                })
                .on('error', (err) => {
                    console.error('Recording error:', err.message);
                    this.status.isRecording = false;
                    this.recordProcess = null;
                    reject(err);
                })
                .on('end', () => {
                    console.log('Recording ended');
                    this.status.isRecording = false;
                    this.recordProcess = null;
                })
                .run();
        });
    }

    /**
     * Stop recording
     */
    async stopRecording(): Promise<void> {
        if (!this.recordProcess) {
            throw new Error('No recording running');
        }

        return new Promise((resolve) => {
            this.recordProcess!.on('end', () => {
                this.status.isRecording = false;
                this.recordProcess = null;
                resolve();
            });
            this.recordProcess!.kill('SIGINT');
        });
    }

    /**
     * Get current status
     */
    getStatus(): StreamStatus {
        return { ...this.status };
    }

    /**
     * Get RTMP URL for platform
     */
    private getRtmpUrl(config: StreamConfig): string {
        switch (config.platform) {
            case 'twitch':
                return `rtmp://live.twitch.tv/app/${config.streamKey}`;
            case 'youtube':
                return `rtmp://a.rtmp.youtube.com/live2/${config.streamKey}`;
            case 'custom':
                return config.customUrl || '';
            default:
                throw new Error('Invalid platform');
        }
    }
}
