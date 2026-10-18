#!/bin/bash
# Production start script for DanBot Hosting

echo "🚀 Starting Banh Cuon Bot..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci --production
fi

# Build if dist doesn't exist
if [ ! -d "dist" ]; then
    echo "🔨 Building TypeScript..."
    npm run build
fi

# Start bot
echo "✅ Bot starting..."
node --expose-gc dist/src/index.js
