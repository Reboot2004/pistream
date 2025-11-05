import ffmpeg from 'fluent-ffmpeg';
import { exec, execSync } from 'child_process';
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
                console.error('If you are on Debian/Ubuntu or WSL, install pactl (PulseAudio utils): sudo apt-get install -y pulseaudio-utils');
                console.error('If your system uses PipeWire, ensure pipewire-pulse is installed and pactl is available.');
                return [
                    {
                        id: 'default',
                        name: 'Default Microphone',
                        type: 'input',
                    },
                ];
            }
        }

        if (platform === 'win32') {
            try {
                // Use ffmpeg to list dshow devices. Output appears on stderr.
                const { stderr } = await execAsync('ffmpeg -list_devices true -f dshow -i dummy 2>&1');
                const lines = (stderr || '').split('\n');
                const devices: AudioDevice[] = [];

                let inAudioSection = false;
                for (const raw of lines) {
                    const line = raw.trim();
                    if (!line) continue;
                    if (line.includes('DirectShow audio devices')) {
                        inAudioSection = true;
                        continue;
                    }
                    if (inAudioSection) {
                        // Device lines are like: "Microphone (High Definition Audio Device)"
                        const m = line.match(/"(.+)"/);
                        if (m && m[1]) {
                            const name = m[1];
                            devices.push({ id: name, name, type: 'input' });
                        } else if (line.startsWith('"') && line.endsWith('"')) {
                            const name = line.slice(1, -1);
                            devices.push({ id: name, name, type: 'input' });
                        }
                    }
                }

                if (devices.length > 0) return devices;
            } catch (err) {
                console.error('Failed to list Windows audio devices via ffmpeg:', err);
                // Fall through to default
            }

            return [
                { id: 'default', name: 'Default Microphone', type: 'input' }
            ];
        }

        // Other platforms: return an empty list by default
        return [];
    }

    /**
     * Get optimal video codec for the platform
     */
    getVideoCodec(): string {
        // Prefer platform-specific/hardware encoders when available, but fall
        // back to libx264 if the requested encoder isn't present in ffmpeg.
        try {
            const encodersOutput = execSync('ffmpeg -encoders', { encoding: 'utf8' });

            const preferredARM = ['h264_omx', 'h264_v4l2m2m', 'h264_vaapi', 'libx264'];
            const preferredGeneric = ['libx264', 'h264_vaapi', 'h264_nvenc'];

            const list = this.isARM ? preferredARM : preferredGeneric;

            for (const codec of list) {
                if (encodersOutput.includes(codec)) {
                    return codec;
                }
            }
        } catch (err) {
            // If ffmpeg isn't available or the command fails, fall through and
            // return a safe default.
            // detectFFmpeg already logs detection at startup; ignore here.
        }

        return 'libx264';
    }

    /**
     * Check whether a given encoder is available in this ffmpeg build
     */
    isEncoderAvailable(encoder: string): boolean {
        if (!encoder) return false;
        try {
            const encodersOutput = execSync('ffmpeg -encoders', { encoding: 'utf8' });
            return encodersOutput.includes(encoder);
        } catch (err) {
            // If ffmpeg isn't available or the command fails, assume unavailable
            return false;
        }
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
        videoCodec?: string;
    }): ffmpeg.FfmpegCommand {
        const command = ffmpeg();

        // Video input (screen capture)
        command.input(config.display)
            .inputFormat('x11grab')
            .inputFPS(config.fps)
            .size(config.resolution);

        // Audio input (if specified)
        if (config.audioDevice) {
            if (os.platform() === 'win32') {
                // On Windows, use dshow and specify audio=<device name>
                // ffmpeg expects the device name quoted; fluent-ffmpeg will handle
                // the argument as a single input string.
                command.input(`audio=${config.audioDevice}`)
                    .inputFormat('dshow');
            } else {
                command.input(config.audioDevice)
                    .inputFormat('pulse');
            }
        }

        // Video encoding
        const codec = (config.videoCodec && config.videoCodec !== 'auto') ? config.videoCodec : this.getVideoCodec();

        // If user explicitly selected a codec, verify it's available before
        // starting ffmpeg. This prevents launching ffmpeg with an unsupported
        // encoder (which previously resulted in runtime errors).
        if (config.videoCodec && config.videoCodec !== 'auto') {
            if (!this.isEncoderAvailable(codec)) {
                // Throwing here lets StreamManager catch and return an error to the UI
                throw new Error(`Requested video codec '${codec}' is not available in this ffmpeg build. ` +
                    `Run 'ffmpeg -encoders | grep ${codec}' to check available encoders, or choose 'Auto' in Settings.`);
            }
        }

        command.videoCodec(codec)
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
        videoCodec?: string;
    }): ffmpeg.FfmpegCommand {
        const command = ffmpeg();

        // Video input
        command.input(config.display)
            .inputFormat('x11grab')
            .inputFPS(config.fps)
            .size(config.resolution);

        // Audio input
        if (config.audioDevice) {
            if (os.platform() === 'win32') {
                command.input(`audio=${config.audioDevice}`)
                    .inputFormat('dshow');
            } else {
                command.input(config.audioDevice)
                    .inputFormat('pulse');
            }
        }

        // Encoding / container selection based on output extension
        const outPath = (config.outputPath || '').toLowerCase();
        let chosenCodec: string | undefined = undefined;
        if (outPath.endsWith('.webm')) {
            // For webm prefer VP8/VP9 and Opus audio
            // Respect user-selected codec if provided and available
            if (config.videoCodec && config.videoCodec !== 'auto') {
                if (!this.isEncoderAvailable(config.videoCodec)) {
                    throw new Error(`Requested video codec '${config.videoCodec}' is not available in this ffmpeg build.`);
                }
                chosenCodec = config.videoCodec;
            } else {
                // Prefer libvpx-vp9, then libvpx
                if (this.isEncoderAvailable('libvpx-vp9')) chosenCodec = 'libvpx-vp9';
                else if (this.isEncoderAvailable('libvpx')) chosenCodec = 'libvpx';
                else chosenCodec = this.getVideoCodec();
            }

            command.videoCodec(chosenCodec)
                .videoBitrate(config.videoBitrate)
                .size(config.resolution)
                .fps(config.fps)
                .addOption('-pix_fmt', 'yuv420p');

            if (config.audioBitrate) {
                // Use Opus if available
                if (this.isEncoderAvailable('libopus')) {
                    command.audioCodec('libopus').audioBitrate(config.audioBitrate);
                } else {
                    command.audioCodec('aac').audioBitrate(config.audioBitrate);
                }
            }

            command.format('webm').output(config.outputPath);
            return command;
        }

        // Default to mp4 behavior
        const codec = (config.videoCodec && config.videoCodec !== 'auto') ? config.videoCodec : this.getVideoCodec();
        if (config.videoCodec && config.videoCodec !== 'auto' && !this.isEncoderAvailable(codec)) {
            throw new Error(`Requested video codec '${codec}' is not available in this ffmpeg build.`);
        }
        command.videoCodec(codec)
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
