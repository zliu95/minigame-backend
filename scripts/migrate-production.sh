#!/bin/bash

# Production Database Migration Script
# This script handles database migrations for production environment

set -e  # Exit on any error

echo "🚀 Starting production database migration..."

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

if [ -z "$NODE_ENV" ]; then
    echo "❌ Error: NODE_ENV environment variable is not set"
    exit 1
fi

if [ "$NODE_ENV" != "production" ]; then
    echo "❌ Error: This script should only be run in production environment"
    echo "Current NODE_ENV: $NODE_ENV"
    exit 1
fi

# Backup database before migration (optional but recommended)
echo "📦 Creating database backup..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE" || {
    echo "⚠️  Warning: Could not create database backup. Continuing anyway..."
}

# Check database connection
echo "🔍 Checking database connection..."
npx prisma db pull --preview-feature || {
    echo "❌ Error: Cannot connect to database"
    exit 1
}

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Verify migration status
echo "✅ Verifying migration status..."
npx prisma migrate status

# Optional: Run database seeding for production (uncomment if needed)
# echo "🌱 Seeding production database..."
# npm run db:seed:production

echo "🎉 Production database migration completed successfully!"

# Clean up backup if migration was successful
if [ -f "$BACKUP_FILE" ]; then
    echo "🗑️  Backup created at: $BACKUP_FILE"
    echo "   You can remove it after verifying the migration was successful"
fi

echo "✨ Migration process finished!"