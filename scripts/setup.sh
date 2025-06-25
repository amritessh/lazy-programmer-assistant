#!/bin/bash

echo "🚀 Setting up Lazy Programmer's Assistant..."

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p services/{api-gateway,context-service,ai-service,learning-service,file-service}/src
mkdir -p frontend/src
mkdir -p vscode-extension/src
mkdir -p shared/src
mkdir -p database/supabase
mkdir -p ai-training/{datasets,scripts,prompts}
mkdir -p docs scripts infra/{docker,kubernetes,terraform}

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file - please update with your keys"
fi

# Initialize Supabase
echo "🗄️ Setting up Supabase..."
cd database && supabase init && cd ..

# Install all dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Initialize shared package
echo "🔧 Setting up shared package..."
cd shared && npm init -y && cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your API keys"
echo "2. Run 'npm run supabase:start' to start Supabase"
echo "3. Run 'npm run dev' to start all services"
echo "4. Visit http://localhost:3000 for the frontend"