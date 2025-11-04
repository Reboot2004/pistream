#!/bin/bash

# Build script for ARM64 (Raspberry Pi)
# Run this on your Raspberry Pi or ARM64 Linux machine

echo "🎬 Building PiStream for ARM64..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Package for ARM64
echo "📦 Packaging for ARM64..."
npm run build:arm64

echo "✅ Build complete! Check the release/ directory for the .deb package"
echo "📌 Install with: sudo dpkg -i release/pistream_1.0.0_arm64.deb"
