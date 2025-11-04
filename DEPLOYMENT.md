# Deployment Guide for Raspberry Pi

## Prerequisites on Raspberry Pi

### 1. Install FFmpeg
```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
```

### 2. Verify FFmpeg Installation
```bash
ffmpeg -version
# Should show FFmpeg version 4.x or higher
```

### 3. Check for Hardware Encoding Support
```bash
ffmpeg -codecs | grep h264
# Look for h264_omx or h264_v4l2m2m
```

## Installation Methods

### Method 1: Install Pre-built Package (Easiest)

```bash
# Download the latest release
wget https://github.com/yourusername/pistream/releases/latest/download/pistream_1.0.0_arm64.deb

# Install
sudo dpkg -i pistream_1.0.0_arm64.deb

# Install any missing dependencies
sudo apt-get install -f

# Launch
pistream
```

### Method 2: Build from Source on Raspberry Pi

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/yourusername/pistream.git
cd pistream

# Run build script
chmod +x scripts/build-arm64.sh
./scripts/build-arm64.sh

# Install the built package
sudo dpkg -i release/pistream_1.0.0_arm64.deb
```

### Method 3: Run from Source (Development)

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build:main

# Start the app
npm start
```

## Optimization for Raspberry Pi 3B

### 1. Enable Hardware Encoding

Edit `/boot/config.txt`:
```bash
sudo nano /boot/config.txt
```

Add these lines:
```
# Enable hardware video encoding
gpu_mem=256
start_x=1
```

Reboot:
```bash
sudo reboot
```

### 2. Optimize Performance

```bash
# Increase swap size (helps with compilation)
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### 3. Recommended Stream Settings

For **Raspberry Pi 3B**:
- Resolution: 1280x720 (720p)
- FPS: 30
- Video Bitrate: 2500 kbps
- Audio Bitrate: 128 kbps
- Encoder: h264_omx

For **Raspberry Pi 4**:
- Resolution: 1920x1080 (1080p)
- FPS: 30-60
- Video Bitrate: 4500 kbps
- Audio Bitrate: 192 kbps
- Encoder: h264_v4l2m2m

## Auto-start on Boot (Optional)

Create a systemd service:

```bash
sudo nano /etc/systemd/system/pistream.service
```

Add:
```ini
[Unit]
Description=PiStream Streaming Software
After=network.target

[Service]
Type=simple
User=pi
Environment=DISPLAY=:0
ExecStart=/usr/local/bin/pistream
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable pistream
sudo systemctl start pistream
```

## Troubleshooting

### Issue: App won't start
```bash
# Check if all dependencies are installed
ldd /usr/local/bin/pistream

# Reinstall
sudo apt-get install -f
```

### Issue: No hardware encoding
```bash
# Check available encoders
ffmpeg -encoders | grep h264

# If h264_omx not found, update firmware
sudo rpi-update
sudo reboot
```

### Issue: Low FPS
- Lower resolution
- Reduce bitrate
- Close other applications
- Check CPU temperature (throttling)

## Network Configuration

### For Remote Streaming

If streaming over WiFi, use Ethernet for better stability:
```bash
# Check network speed
iperf3 -c speedtest.net
```

### Port Forwarding (if needed)

For custom RTMP server:
- Forward port 1935 (RTMP) in your router

## Performance Monitoring

```bash
# Monitor CPU usage
htop

# Monitor temperature
vcgencmd measure_temp

# Monitor network
iftop
```

## Uninstallation

```bash
sudo dpkg -r pistream
# or
sudo apt-get remove pistream
```

## Support

For issues specific to Raspberry Pi, please include:
- Pi model (3B, 4, 5)
- OS version (`cat /etc/os-release`)
- FFmpeg version (`ffmpeg -version`)
- Output of `ffmpeg -encoders | grep h264`
