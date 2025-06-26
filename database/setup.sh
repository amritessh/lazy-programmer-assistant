#!/bin/bash

# database/setup.sh
# Database setup script for Lazy Programmer's Assistant

set -e

echo "🗄️  Setting up Lazy Programmer's Assistant Database..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    echo "Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    print_error "Please run this script from the database directory"
    exit 1
fi

# Start Supabase
print_status "Starting Supabase local development environment..."
supabase start

if [ $? -eq 0 ]; then
    print_success "Supabase started successfully!"
else
    print_error "Failed to start Supabase"
    exit 1
fi

# Wait a moment for services to be ready
sleep 2

# Get the status to show connection details
print_status "Getting Supabase connection details..."
supabase status

# Run migrations
print_status "Running database migrations..."
supabase db push

if [ $? -eq 0 ]; then
    print_success "Database migrations completed successfully!"
else
    print_error "Database migrations failed"
    exit 1
fi

# Generate TypeScript types
print_status "Generating TypeScript types..."
supabase gen types typescript --local > ../shared/src/types/database.types.ts

if [ $? -eq 0 ]; then
    print_success "TypeScript types generated successfully!"
else
    print_warning "Failed to generate TypeScript types (this is optional)"
fi

# Show final status
echo ""
print_success "🎉 Database setup completed successfully!"
echo ""
print_status "Connection details:"
echo "  📊 Studio URL: http://localhost:54323"
echo "  🔗 API URL: http://localhost:54321"  
echo "  💾 DB URL: postgresql://postgres:postgres@localhost:54322/postgres"
echo ""
print_status "Next steps:"
echo "  1. Copy the Anon Key and Service Role Key from the output above"
echo "  2. Update your .env files with the keys"
echo "  3. Start your application services"
echo ""
print_warning "Important: Keep Supabase running while developing (supabase stop to stop)"

