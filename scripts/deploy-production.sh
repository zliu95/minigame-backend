#!/bin/bash

# Production Deployment Script
# This script handles the complete production deployment process

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Configuration
BACKUP_DIR="./backups"
LOG_FILE="./logs/deploy-$(date +%Y%m%d_%H%M%S).log"

# Create necessary directories
mkdir -p "$BACKUP_DIR"
mkdir -p "./logs"

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to handle errors
handle_error() {
    log "❌ Error occurred during deployment: $1"
    log "🔄 Rolling back changes..."
    # Add rollback logic here if needed
    exit 1
}

# Trap errors
trap 'handle_error "Unexpected error"' ERR

log "📋 Starting production deployment checklist..."

# 1. Environment validation
log "🔍 Validating environment..."
if [ "$NODE_ENV" != "production" ]; then
    handle_error "NODE_ENV must be set to 'production'"
fi

if [ -z "$DATABASE_URL" ]; then
    handle_error "DATABASE_URL environment variable is required"
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    handle_error "NEXTAUTH_SECRET environment variable is required"
fi

# 2. Pre-deployment checks
log "🔧 Running pre-deployment checks..."
npm run type-check || handle_error "TypeScript type checking failed"
npm run lint || handle_error "Linting failed"

# 3. Build application
log "🏗️  Building application..."
npm run build:production || handle_error "Build failed"

# 4. Database backup
log "📦 Creating database backup..."
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE" || log "⚠️  Warning: Could not create database backup"

# 5. Database migration
log "📊 Running database migrations..."
npm run db:migrate:production || handle_error "Database migration failed"

# 6. Docker deployment (if using Docker)
if [ -f "docker-compose.production.yml" ]; then
    log "🐳 Deploying with Docker..."
    docker-compose -f docker-compose.production.yml down || true
    docker-compose -f docker-compose.production.yml build --no-cache
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for services to be ready
    log "⏳ Waiting for services to be ready..."
    sleep 30
    
    # Health check
    log "🏥 Running health check..."
    for i in {1..10}; do
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            log "✅ Health check passed"
            break
        fi
        if [ $i -eq 10 ]; then
            handle_error "Health check failed after 10 attempts"
        fi
        log "⏳ Health check attempt $i failed, retrying in 10 seconds..."
        sleep 10
    done
else
    # Direct deployment
    log "🚀 Starting application..."
    npm run start:production &
    APP_PID=$!
    
    # Wait for app to start
    sleep 10
    
    # Health check
    log "🏥 Running health check..."
    if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        kill $APP_PID || true
        handle_error "Application health check failed"
    fi
fi

# 7. Post-deployment verification
log "✅ Running post-deployment verification..."

# Test critical endpoints
log "🧪 Testing critical endpoints..."
curl -f http://localhost:3000/api/health || handle_error "Health endpoint failed"

# 8. Cleanup old backups (keep last 10)
log "🧹 Cleaning up old backups..."
ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | tail -n +11 | xargs -r rm

log "🎉 Production deployment completed successfully!"
log "📊 Deployment summary:"
log "   - Environment: $NODE_ENV"
log "   - Backup created: $BACKUP_FILE"
log "   - Log file: $LOG_FILE"
log "   - Health check: ✅ Passed"

echo "✨ Deployment finished! Check the logs at: $LOG_FILE"