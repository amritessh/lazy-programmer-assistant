#!/bin/bash

echo "🏗️ Building all services..."

# Build shared package first
echo "Building shared package..."
cd shared && npm run build && cd ..

# Build all services
echo "Building services..."
cd services/api-gateway && npm run build && cd ../..
cd services/context-service && npm run build && cd ../..
cd services/ai-service && npm run build && cd ../..
cd services/learning-service && npm run build && cd ../..
cd services/file-service && npm run build && cd ../..

# Build frontend
echo "Building frontend..."
cd frontend && npm run build && cd ..

# Build VS Code extension
echo "Building VS Code extension..."
cd vscode-extension && npm run build && cd ..

echo "✅ All builds complete!"