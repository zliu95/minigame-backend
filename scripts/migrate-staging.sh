#!/bin/bash

# Staging Database Migration Script
# This script handles database migrations for staging environment

set -e  # Exit on any error

echo "🚀 Starting staging database migration..."

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Verify migration status
echo "✅ Verifying migration status..."
npx prisma migrate status

# Run database seeding for staging
echo "🌱 Seeding staging database..."
npm run db:seed

echo "🎉 Staging database migration completed successfully!"
echo "✨ Migration process finished!"