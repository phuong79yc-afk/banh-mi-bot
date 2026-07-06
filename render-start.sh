#!/bin/bash
# Render.com start script

echo "🚀 Starting bot..."
npm run build
node dist/src/index.js
