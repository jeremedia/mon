#!/bin/bash

# Mon Monitoring Script for jer-serve
# Collects system metrics and sends to Mon WebSocket server

MON_SERVER="http://100.104.170.10:3001/api/monitoring"
HOSTNAME=$(hostname)
TIMESTAMP=$(date +%s)

# Function to send data to Mon server
send_to_mon() {
    local type="$1"
    local payload="$2"
    
    curl -s -X POST "$MON_SERVER" \
        -H "Content-Type: application/json" \
        -d "{\"type\":\"$type\",\"payload\":$payload,\"source\":\"$HOSTNAME\",\"timestamp\":$TIMESTAMP}" \
        > /dev/null 2>&1
}

# Function to generate English status using Claude CLI
generate_status_message() {
    local context="$1"
    local status="$2"
    
    # Only generate messages if Claude CLI is available
    if command -v claude >/dev/null 2>&1; then
        local prompt="Based on this system monitoring data: $context. Current status: $status. Generate a concise, professional status message that I (Claude AI sysadmin) would say about the infrastructure. Keep it under 100 characters and sound confident but not robotic."
        
        local message=$(echo "$prompt" | claude -p 2>/dev/null | head -1)
        
        # Validate message isn't empty and isn't an error
        if [ -n "$message" ] && [[ ! "$message" =~ ^Error.*$ ]] && [[ ! "$message" =~ ^Invalid.*$ ]]; then
            echo "$message"
        else
            echo "Infrastructure scan complete. All systems operational."
        fi
    else
        echo "Monitoring sweep complete. Standing by."
    fi
}

# Collect system metrics
collect_system_metrics() {
    # CPU usage
    CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d'u' -f1)
    if [ -z "$CPU" ]; then
        CPU=$(vmstat 1 2 | tail -1 | awk '{print 100-$15}')
    fi
    
    # Memory usage
    MEM=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
    
    # Disk usage
    DISK=$(df -h / | awk 'NR==2{printf "%s", $5}' | sed 's/%//')
    
    # Load average
    LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    
    # Determine status based on thresholds
    CPU_STATUS="healthy"
    [ "${CPU%.*}" -gt 80 ] && CPU_STATUS="warning"
    [ "${CPU%.*}" -gt 95 ] && CPU_STATUS="critical"
    
    MEM_STATUS="healthy" 
    [ "${MEM%.*}" -gt 80 ] && MEM_STATUS="warning"
    [ "${MEM%.*}" -gt 95 ] && MEM_STATUS="critical"
    
    DISK_STATUS="healthy"
    [ "$DISK" -gt 80 ] && DISK_STATUS="warning"
    [ "$DISK" -gt 95 ] && DISK_STATUS="critical"
    
    METRICS="{
        \"cpu\": {\"display\":\"${CPU}%\", \"value\":$CPU, \"status\":\"$CPU_STATUS\"},
        \"memory\": {\"display\":\"${MEM}%\", \"value\":$MEM, \"status\":\"$MEM_STATUS\"},
        \"disk\": {\"display\":\"${DISK}% Used\", \"value\":$DISK, \"status\":\"$DISK_STATUS\"},
        \"load\": {\"display\":\"$LOAD\", \"value\":$LOAD, \"status\":\"healthy\"}
    }"
    
    send_to_mon "system_metrics" "$METRICS"
}

# Check service status
check_services() {
    SERVICES="["
    
    # Check Apache
    if systemctl is-active --quiet apache2; then
        APACHE_STATUS="healthy"
    else
        APACHE_STATUS="error"
    fi
    SERVICES="$SERVICES{\"name\":\"Apache (jer-serve)\",\"status\":\"$APACHE_STATUS\",\"port\":80},"
    
    # Check Rails apps on known ports
    RAILS_PORTS=(3000 3021 3036 3050 3055 3056 3100 3211 3453 3898)
    RAILS_NAMES=("video-processing" "crd.domt.app" "dev.hai.domt.app" "hai.domt.app" "hsdl-ai.domt.app" "hsdl-data.domt.app" "oknotok.com" "curation-engine.com" "central.domt.app" "mpr.domt.app")
    
    for i in "${!RAILS_PORTS[@]}"; do
        PORT=${RAILS_PORTS[$i]}
        NAME=${RAILS_NAMES[$i]}
        
        if netstat -tuln | grep -q ":$PORT "; then
            STATUS="healthy"
        else
            STATUS="error"
        fi
        
        SERVICES="$SERVICES{\"name\":\"$NAME\",\"status\":\"$STATUS\",\"port\":$PORT},"
    done
    
    # Remove trailing comma and close array
    SERVICES="${SERVICES%,}]"
    
    send_to_mon "service_status" "$SERVICES"
}

# Check domain resolution
check_domains() {
    DOMAINS=("hai.domt.app" "hsdl-ai.domt.app" "enliterator.ai" "offline.oknotok.com" "mon.zice.app" "mpr.domt.app")
    
    for domain in "${DOMAINS[@]}"; do
        if dig +short "$domain" @8.8.8.8 | grep -q .; then
            STATUS="healthy"
        else
            STATUS="error"
            send_to_mon "alert" "{\"level\":\"warning\",\"message\":\"DNS resolution failed for $domain\",\"service\":\"DNS\"}"
        fi
    done
}

# Check SSL certificates
check_ssl_certs() {
    # This would check SSL certificate expiry dates
    # Implementation depends on openssl availability
    :
}

# Main execution
main() {
    echo "$(date): Mon monitoring check starting"
    
    collect_system_metrics
    check_services  
    check_domains
    
    # Generate overall system summary for Claude message
    local cpu_val=$(echo "$CPU" | cut -d'.' -f1)
    local mem_val=$(echo "$MEM" | cut -d'.' -f1)
    local disk_val="$DISK"
    
    # Determine overall status
    local overall_status="healthy"
    [ "$cpu_val" -gt 80 ] && overall_status="warning"
    [ "$mem_val" -gt 80 ] && overall_status="warning"
    [ "$disk_val" -gt 80 ] && overall_status="warning"
    [ "$cpu_val" -gt 95 ] && overall_status="critical"
    [ "$mem_val" -gt 95 ] && overall_status="critical"
    [ "$disk_val" -gt 95 ] && overall_status="critical"
    
    # Create context summary for Claude
    local context="CPU: ${CPU}%, Memory: ${MEM}%, Disk: ${disk_val}% used, Load: $LOAD, Apache: $APACHE_STATUS"
    
    # Generate status message using Claude CLI
    local claude_message=$(generate_status_message "$context" "$overall_status")
    
    # Send Claude message to Mon dashboard
    if [ -n "$claude_message" ]; then
        send_to_mon "claude_message" "{\"message\":\"$claude_message\",\"context\":\"$context\",\"status\":\"$overall_status\"}"
    fi
    
    echo "$(date): Mon monitoring check complete"
}

# Run main function
main

# Log to syslog
logger "Mon monitoring check completed from $HOSTNAME"