#!/bin/bash

# Setup Mon monitoring cron job on jer-serve
# This script should be run once to establish automated monitoring

MONITOR_SCRIPT="/home/jeremy/jer-serve/mon/monitoring/monitor.sh"
CRON_SCHEDULE="*/2 * * * *"  # Every 2 minutes

echo "Setting up Mon monitoring cron job on jer-serve..."

# Create the cron entry
CRON_ENTRY="$CRON_SCHEDULE $MONITOR_SCRIPT"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$MONITOR_SCRIPT"; then
    echo "Mon monitoring cron job already exists"
else
    # Add the cron job
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
    echo "Mon monitoring cron job added: $CRON_ENTRY"
fi

# Verify cron job was added
echo ""
echo "Current cron jobs:"
crontab -l | grep -E "(mon|monitor)" || echo "No monitoring cron jobs found"

echo ""
echo "Mon monitoring setup complete!"
echo "The monitoring script will run every 2 minutes and send data to Mon dashboard"
echo "Dashboard URL: https://mon.zice.app"