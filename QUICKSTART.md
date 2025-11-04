# 🚀 Quick Start - Testing on Your Raspberry Pi

## Option 1: Transfer via Git (Recommended)

### On Windows (this machine):
```powershell
cd "d:\Projects\New Project"
git init
git add .
git commit -m "Initial commit: PiStream streaming software"

# Push to GitHub (create a repo first at github.com/new)
git remote add origin https://github.com/YOUR_USERNAME/pistream.git
git branch -M main
git push -u origin main
```

### On Raspberry Pi:
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/pistream.git
cd pistream

# Continue with setup below
```

---

## Option 2: Transfer via USB Drive

### On Windows:
1. Copy entire `d:\Projects\New Project` folder to USB drive
2. Plug USB into Raspberry Pi
3. Copy from USB to Pi home directory

### On Raspberry Pi:
```bash
# Mount USB (if not auto-mounted)
sudo mount /dev/sda1 /mnt

# Copy project
cp -r /mnt/pistream ~/pistream
cd ~/pistream
```

---

## Option 3: Transfer via Network (SCP)

### On Windows (PowerShell):
```powershell
# Install OpenSSH client if needed
# Then transfer files:
scp -r "d:\Projects\New Project" pi@YOUR_PI_IP:~/pistream
```

---

## Setup on Raspberry Pi

### 1. Install Node.js (if not installed)
```bash
# Check if Node.js is installed
node --version

# If not installed:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should be v18+
npm --version
```

### 2. Install FFmpeg
```bash
sudo apt-get update
sudo apt-get install -y ffmpeg

# Verify
ffmpeg -version

# Check for hardware encoding
ffmpeg -codecs | grep h264
# Look for h264_omx or h264_v4l2m2m
```

### 3. Install Project Dependencies
```bash
cd ~/pistream
npm install
# This will take 5-10 minutes on Raspberry Pi 3B
```

### 4. Build the Application
```bash
# Compile TypeScript
npm run build:main

# Build React app
npm run build:renderer
```

### 5. Test Run (Development Mode)
```bash
# Start the application
npm start

# Or run dev mode (if you have X server)
npm run dev
```

---

## First Time Usage

### 1. Get Your Stream Key

**For Twitch:**
1. Go to https://dashboard.twitch.tv/settings/stream
2. Copy your "Primary Stream Key"

**For YouTube:**
1. Go to https://studio.youtube.com/
2. Click "Create" → "Go Live"
3. Copy "Stream key" from Stream settings

### 2. Configure PiStream

1. Click **⚙️ Settings** (top right)
2. Select platform (Twitch or YouTube)
3. Paste your stream key
4. Set quality:
   - **Pi 3B**: 720p, 30 FPS, 2500 kbps
   - **Pi 4**: 1080p, 30 FPS, 4500 kbps
5. Click **Save Settings**

### 3. Add Sources

1. Click **+ Add** in Sources panel
2. Select **Display Capture** → Main Display
3. (Optional) Add **Audio Input** for microphone
4. Enable sources by clicking checkbox

### 4. Start Streaming!

1. Click **Start Streaming** button (bottom right)
2. Watch the live indicator turn red
3. Monitor FPS and bitrate
4. Go to your Twitch/YouTube to verify stream

### 5. Stop Streaming

Click **Stop Streaming** button

---

## Building Installation Package

### Create .deb Package

```bash
cd ~/pistream

# Build for ARM64
npm run build:arm64

# Package will be in: release/pistream_1.0.0_arm64.deb
```

### Install System-wide

```bash
sudo dpkg -i release/pistream_1.0.0_arm64.deb

# Now you can launch from anywhere:
pistream
```

---

## Troubleshooting

### Issue: "npm install" fails
```bash
# Increase swap space
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Change CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Try again
npm install
```

### Issue: "Cannot find module 'electron'"
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Issue: Low FPS during streaming
- Lower resolution to 480p
- Reduce bitrate to 1500 kbps
- Set FPS to 24
- Close other applications
- Check CPU temp: `vcgencmd measure_temp`

### Issue: No audio devices detected
```bash
# Install PulseAudio
sudo apt-get install -y pulseaudio

# List devices
pactl list sources short
```

### Issue: Stream key not working
- Verify no extra spaces in stream key
- Check platform selection matches your service
- Ensure your account has streaming enabled

---

## Performance Tips

### For Raspberry Pi 3B

1. **Enable hardware encoding** (edit `/boot/config.txt`):
   ```
   gpu_mem=256
   start_x=1
   ```

2. **Close unnecessary apps**:
   ```bash
   # Close Chromium, file managers, etc.
   ```

3. **Use Ethernet instead of WiFi** for more stable upload

4. **Recommended settings**:
   - Resolution: 1280x720 (720p)
   - FPS: 30
   - Bitrate: 2500 kbps

### For Raspberry Pi 4

1. **Better settings possible**:
   - Resolution: 1920x1080 (1080p)
   - FPS: 30-60
   - Bitrate: 4500-6000 kbps

---

## Testing Checklist

- [ ] Application launches without errors
- [ ] Settings can be opened and saved
- [ ] Display source can be added
- [ ] Audio source can be added (if microphone available)
- [ ] Stream starts successfully
- [ ] Stream appears on Twitch/YouTube
- [ ] FPS and bitrate are displayed
- [ ] Stream can be stopped
- [ ] Recording works (optional test)

---

## Next Steps

1. **Test the application** on your Pi
2. **Take screenshots** of the UI for portfolio
3. **Stream to Twitch/YouTube** and record a demo
4. **Push to GitHub** for public portfolio
5. **Update LinkedIn** with project details
6. **Add to resume** with technical achievements

---

## Getting Help

If you encounter issues:

1. Check `npm-debug.log` for Node.js errors
2. Check electron console for runtime errors (Ctrl+Shift+I)
3. Verify FFmpeg works: `ffmpeg -version`
4. Check system resources: `htop`
5. Monitor temperature: `vcgencmd measure_temp`

---

## 🎉 You're Ready!

Your streaming software is built and ready to deploy on Raspberry Pi.

Good luck with testing and showcasing this project! 🚀
