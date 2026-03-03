#!/bin/bash
# Cleanup script for Constelación Viva
# Remove all containers, volumes, and networks
# Run: bash cleanup.sh

echo "⚠️  This will remove all containers, volumes, and networks"
read -p "Are you sure? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Cleaning up..."
    
    # Stop and remove containers
    docker-compose down
    
    # Remove volumes (data loss!)
    docker-compose down -v
    
    # Remove unused images, containers, networks
    docker system prune -a -f
    
    echo "✅ Cleanup complete"
    echo "All data has been removed. Run ./start.sh to start fresh."
else
    echo "❌ Cleanup cancelled"
fi
