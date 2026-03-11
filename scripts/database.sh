#!/bin/bash

# Database migration and backup script
set -e

# Configuration
ENVIRONMENT=${1:-staging}
MONGODB_URI=${MONGODB_URI:-"mongodb://localhost:27017/novastream"}
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🗃️ Database operations for NovaStream ($ENVIRONMENT)"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to create database backup
create_backup() {
    echo "💾 Creating database backup..."
    
    BACKUP_NAME="novastream_backup_$TIMESTAMP"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    mkdir -p "$BACKUP_PATH"
    
    # Use mongodump for backup
    if command -v mongodump &> /dev/null; then
        mongodump --uri="$MONGODB_URI" --out="$BACKUP_PATH"
        
        # Compress backup
        tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
        rm -rf "$BACKUP_PATH"
        
        echo "✅ Backup created: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
        
        # Keep only last 10 backups
        ls -t "$BACKUP_DIR"/*.tar.gz | tail -n +11 | xargs -r rm
        
    else
        echo "❌ mongodump not found. Please install MongoDB tools."
        return 1
    fi
}

# Function to restore database from backup
restore_backup() {
    local backup_file=$1
    
    if [[ -z "$backup_file" ]]; then
        echo "❌ Backup file required for restore"
        return 1
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        echo "❌ Backup file not found: $backup_file"
        return 1
    fi
    
    echo "🔄 Restoring database from backup: $backup_file"
    
    # Extract backup
    TEMP_DIR="./temp_restore_$TIMESTAMP"
    mkdir -p "$TEMP_DIR"
    tar -xzf "$backup_file" -C "$TEMP_DIR"
    
    # Find the backup directory
    BACKUP_DIR_CONTENT=$(ls "$TEMP_DIR")
    RESTORE_PATH="$TEMP_DIR/$BACKUP_DIR_CONTENT"
    
    # Restore using mongorestore
    if command -v mongorestore &> /dev/null; then
        mongorestore --uri="$MONGODB_URI" --drop "$RESTORE_PATH"
        echo "✅ Database restored successfully"
    else
        echo "❌ mongorestore not found. Please install MongoDB tools."
        rm -rf "$TEMP_DIR"
        return 1
    fi
    
    # Cleanup
    rm -rf "$TEMP_DIR"
}

# Function to run migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    
    # Check if migrations directory exists
    if [[ ! -d "./migrations" ]]; then
        echo "ℹ️ No migrations directory found. Skipping migrations."
        return 0
    fi
    
    # Run migration scripts in order
    for migration in ./migrations/*.js; do
        if [[ -f "$migration" ]]; then
            echo "📝 Running migration: $(basename "$migration")"
            node "$migration" "$MONGODB_URI"
        fi
    done
    
    echo "✅ Migrations completed"
}

# Function to create indexes
create_indexes() {
    echo "📋 Creating database indexes..."
    
    node -e "
    const { MongoClient } = require('mongodb');
    
    async function createIndexes() {
        const client = new MongoClient('$MONGODB_URI');
        try {
            await client.connect();
            const db = client.db();
            
            // Users collection indexes
            await db.collection('users').createIndex({ email: 1 }, { unique: true });
            await db.collection('users').createIndex({ createdAt: -1 });
            
            // Content collection indexes
            await db.collection('content').createIndex({ title: 'text', description: 'text' });
            await db.collection('content').createIndex({ type: 1, createdAt: -1 });
            await db.collection('content').createIndex({ status: 1 });
            
            // Sessions collection indexes
            await db.collection('sessions').createIndex({ userId: 1, createdAt: -1 });
            await db.collection('sessions').createIndex({ token: 1 }, { unique: true });
            
            console.log('✅ Database indexes created successfully');
        } catch (error) {
            console.error('❌ Error creating indexes:', error);
            throw error;
        } finally {
            await client.close();
        }
    }
    
    createIndexes().catch(console.error);
    "
}

# Function to validate database
validate_database() {
    echo "🔍 Validating database integrity..."
    
    node -e "
    const { MongoClient } = require('mongodb');
    
    async function validateDatabase() {
        const client = new MongoClient('$MONGODB_URI');
        try {
            await client.connect();
            const db = client.db();
            
            // Check if collections exist
            const collections = await db.listCollections().toArray();
            const requiredCollections = ['users', 'content', 'sessions'];
            
            for (const collectionName of requiredCollections) {
                const exists = collections.some(col => col.name === collectionName);
                if (!exists) {
                    console.log(\`⚠️ Collection '\${collectionName}' not found\`);
                } else {
                    const count = await db.collection(collectionName).countDocuments();
                    console.log(\`✅ Collection '\${collectionName}' exists (\${count} documents)\`);
                }
            }
            
            console.log('✅ Database validation completed');
        } catch (error) {
            console.error('❌ Error validating database:', error);
            throw error;
        } finally {
            await client.close();
        }
    }
    
    validateDatabase().catch(console.error);
    "
}

# Main execution
case "${2:-backup}" in
    "backup")
        create_backup
        ;;
    "restore")
        restore_backup "$3"
        ;;
    "migrate")
        create_backup
        run_migrations
        create_indexes
        validate_database
        ;;
    "migrate-only")
        run_migrations
        ;;
    "indexes")
        create_indexes
        ;;
    "validate")
        validate_database
        ;;
    *)
        echo "Usage: $0 <environment> <command> [options]"
        echo "Commands:"
        echo "  backup              - Create database backup (default)"
        echo "  restore <file>      - Restore from backup file"
        echo "  migrate             - Backup, run migrations, create indexes, validate"
        echo "  migrate-only        - Run migrations only"
        echo "  indexes             - Create database indexes"
        echo "  validate            - Validate database integrity"
        exit 1
        ;;
esac

echo "✅ Database operations completed successfully!"