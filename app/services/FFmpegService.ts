import ffmpeg from 'fluent-ffmpeg';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export interface Display {
    id: string;
    name: string;
    resolution: string;
}

export interface AudioDevice {
    id: string;
    name: string;
    type: 'input' | 'output';
}

export class FFmpegService {
    private isARM: boolean;

    constructor() {
        this.isARM = process.arch.includes('arm');
        this.detectFFmpeg();
    }

    private async detectFFmpeg() {
        try {
            await execAsync('ffmpeg -version');
            console.log('✓ FFmpeg detected');
        } catch (error) {
            console.error('✗ FFmpeg not found. Please install FFmpeg.');
        }
    }

    /**
     * Get available displays for screen capture
     */
    async getDisplays(): Promise<Display[]> {
        const platform = os.platform();

        if (platform === 'linux') {
            // For Linux/X11, typically :0.0 is the main display
            return [
                {
                    id: ':0.0',
                    name: 'Main Display',
                    resolution: '1920x1080', // Default, can be detected with xrandr
                },
            ];
        }

        return [];
    }

    /**
     * Get available audio devices
     */
    async getAudioDevices(): Promise<AudioDevice[]> {
        const platform = os.platform();

        if (platform === 'linux') {
            try {
                // Use pactl to list audio sources
                const { stdout } = await execAsync('pactl list sources short');
                const sources = stdout.split('\n').filter(line => line.trim());

                return sources.map((line, index) => {
                    const parts = line.split('\t');
                    return {
                        id: parts[1] || `source_${index}`,
                        name: parts[1] || `Audio Source ${index + 1}`,
                        type: 'input' as const,
                    };
                });
            } catch (error) {
                console.error('Could not detect audio devices:', error);
                return [
                    {
                        id: 'default',
                        name: 'Default Microphone',
                        type: 'input',
                    },
                ];
            }
        }

        return [];
    }

    /**
     * Get optimal video codec for the platform
     */
    getVideoCodec(): string {
        if (this.isARM) {
            // Try hardware encoding on Raspberry Pi
            // h264_omx for older Pi, h264_v4l2m2m for Pi 4+
            return 'h264_omx';
        }
        return 'libx264';
    }

    /**
     * Get encoding preset based on platform
     */
    getEncodingPreset(): string {
        if (this.isARM) {
            // ARM devices need lighter presets
            return 'ultrafast';
        }
        return 'fast';
    }

    /**
     * Create FFmpeg command for streaming
     */
    createStreamCommand(config: {
        display: string;
        audioDevice?: string;
        rtmpUrl: string;
        videoBitrate: string;
        audioBitrate: string;
        resolution: string;
        fps: number;
    }): ffmpeg.FfmpegCommand {
        const command = ffmpeg();

        // Video input (screen capture)
        command.input(config.display)
            .inputFormat('x11grab')
            .inputFPS(config.fps)
            .size(config.resolution);

        // Audio input (if specified)
        if (config.audioDevice) {
            command.input(config.audioDevice)
                .inputFormat('pulse');
        }

        // Video encoding
        command.videoCodec(this.getVideoCodec())
            .videoBitrate(config.videoBitrate)
            .size(config.resolution)
            .fps(config.fps)
            .addOption('-preset', this.getEncodingPreset())
            .addOption('-tune', 'zerolatency')
            .addOption('-pix_fmt', 'yuv420p');

        // Audio encoding
        if (config.audioDevice) {
            command.audioCodec('aac')
                .audioBitrate(config.audioBitrate)
                .audioChannels(2)
                .audioFrequency(44100);
        } else {
            command.noAudio();
        }

        // Output format and destination
        command.format('flv')
            .output(config.rtmpUrl);

        return command;
    }

    /**
     * Create FFmpeg command for recording
     */
    createRecordCommand(config: {
        display: string;
        audioDevice?: string;
        outputPath: string;
        videoBitrate: string;
        audioBitrate: string;
        resolution: string;
        fps: number;
    }): ffmpeg.FfmpegCommand {
        const command = ffmpeg();

        // Video input
        command.input(config.display)
            .inputFormat('x11grab')
            .inputFPS(config.fps)
            .size(config.resolution);

        // Audio input
        if (config.audioDevice) {
            command.input(config.audioDevice)
                .inputFormat('pulse');
        }

        // Encoding
        command.videoCodec(this.getVideoCodec())
            .videoBitrate(config.videoBitrate)
            .size(config.resolution)
            .fps(config.fps)
            .addOption('-preset', this.getEncodingPreset())
            .addOption('-pix_fmt', 'yuv420p');

        if (config.audioDevice) {
            command.audioCodec('aac')
                .audioBitrate(config.audioBitrate);
        } else {
            command.noAudio();
        }

        // Output
        command.format('mp4')
            .output(config.outputPath);

        return command;
    }
}
