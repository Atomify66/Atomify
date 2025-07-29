#!/bin/bash

# Izomergen Production Startup Script

echo "🚀 Starting Izomergen in production mode..."

# Set environment variables
export NODE_ENV=production
export PORT=3000

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the server
echo "🔧 Environment: $NODE_ENV"
echo "🔧 Port: $PORT"
echo "📍 Starting server..."

node server.js 