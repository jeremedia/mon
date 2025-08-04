/**
 * Mon Dashboard - Real-time monitoring interface
 * Manages WebSocket connections, updates UI, handles notifications
 */

class MonDashboard {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000;
        
        this.lastMessageTime = Date.now();
        this.systemStatus = 'healthy';
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.startHeartbeat();
        this.updateTimestamps();
        
        // Connect to WebSocket server
        this.connectWebSocket();
        
        // Fallback to mock data if WebSocket fails
        setTimeout(() => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                console.log('Mon: WebSocket failed, using mock data');
                this.startMockData();
            }
        }, 5000);
    }

    bindEvents() {
        // Handle avatar clicks
        document.getElementById('claude-portrait').addEventListener('click', () => {
            this.claudeInteraction();
        });

        // Handle window focus for notifications
        window.addEventListener('focus', () => {
            this.clearNotifications();
        });

        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onPageHidden();
            } else {
                this.onPageVisible();
            }
        });
    }

    connectWebSocket() {
        try {
            // Try different WebSocket endpoints
            const wsUrl = this.getWebSocketUrl();
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('Mon: Connected to monitoring server');
                this.reconnectAttempts = 0;
                this.updateConnectionStatus(true);
            };
            
            this.ws.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };
            
            this.ws.onclose = () => {
                console.log('Mon: Disconnected from monitoring server');
                this.updateConnectionStatus(false);
                this.scheduleReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('Mon: WebSocket error:', error);
            };
            
        } catch (error) {
            console.error('Mon: Failed to connect to WebSocket:', error);
            this.scheduleReconnect();
        }
    }

    getWebSocketUrl() {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Connect to Mon server on Mac dev machine
        return `${protocol}//100.104.170.10:3001`;
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                this.reconnectAttempts++;
                this.connectWebSocket();
            }, this.reconnectDelay * this.reconnectAttempts);
        }
    }

    handleMessage(data) {
        this.lastMessageTime = Date.now();
        
        switch (data.type) {
            case 'system_status':
                this.updateSystemStatus(data.payload);
                break;
            case 'alert':
                this.handleAlert(data.payload);
                break;
            case 'service_update':
                this.updateService(data.payload);
                break;
            case 'claude_message':
                this.displayClaudeMessage(data.payload.message);
                break;
            default:
                console.log('Mon: Unknown message type:', data.type);
        }
    }

    updateSystemStatus(status) {
        const { overall, metrics, services } = status;
        
        // Update overall status
        this.systemStatus = overall;
        this.updateStatusIndicator(overall);
        
        // Update metrics
        if (metrics) {
            this.updateMetrics(metrics);
        }
        
        // Update services
        if (services) {
            this.updateServicesList(services);
        }
        
        // Update Claude's appearance based on status
        if (window.claudeAvatar) {
            window.claudeAvatar.setStatus(overall);
        }
    }

    updateStatusIndicator(status) {
        const statusText = document.getElementById('status-text');
        const statusDot = document.getElementById('status-dot');
        
        const statusConfig = {
            healthy: { text: 'All Systems Operational', color: '#4CAF50' },
            warning: { text: 'System Warning Detected', color: '#FF9800' },
            critical: { text: 'Critical Issue Detected', color: '#f44336' },
            unknown: { text: 'Connection Lost', color: '#9E9E9E' }
        };
        
        const config = statusConfig[status] || statusConfig.unknown;
        statusText.textContent = config.text;
        statusDot.style.backgroundColor = config.color;
    }

    updateMetrics(metrics) {
        // Update metric cards with real data
        Object.entries(metrics).forEach(([key, value]) => {
            const element = document.querySelector(`[data-metric="${key}"] .metric-value`);
            if (element) {
                element.textContent = value.display;
                
                // Update card status based on value
                const card = element.closest('.metric-card');
                card.className = 'metric-card';
                if (value.status === 'warning') card.classList.add('warning');
                if (value.status === 'error') card.classList.add('error');
            }
        });
    }

    updateServicesList(services) {
        const servicesList = document.querySelector('.services-list');
        servicesList.innerHTML = '';
        
        services.forEach(service => {
            const item = document.createElement('div');
            item.className = 'service-item';
            
            const statusClass = `status-${service.status}`;
            item.innerHTML = `
                <span class="service-name">${service.name}</span>
                <span class="service-status ${statusClass}">${service.status.toUpperCase()}</span>
            `;
            
            servicesList.appendChild(item);
        });
    }

    handleAlert(alert) {
        const { level, message, service, action } = alert;
        
        // Display Claude message
        this.displayClaudeMessage(message);
        
        // Speak the alert if it's critical
        if (level === 'critical' && window.claudeAvatar) {
            window.claudeAvatar.speak(message, 5000);
        }
        
        // Show system notification
        this.showNotification(message, level);
        
        // Focus window if critical
        if (level === 'critical' && document.hidden) {
            this.focusWindow();
        }
    }

    displayClaudeMessage(message) {
        const messageElement = document.getElementById('claude-message');
        
        // Add typing animation
        messageElement.style.opacity = '0.5';
        
        setTimeout(() => {
            messageElement.textContent = message;
            messageElement.style.opacity = '1';
        }, 500);
        
        // Update last check time
        document.getElementById('last-check').textContent = 'Just now';
    }

    showNotification(message, level = 'info') {
        if ('Notification' in window && Notification.permission === 'granted') {
            const title = level === 'critical' ? '🚨 Mon Alert' : '⚠️ Mon Notice';
            new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                requireInteraction: level === 'critical'
            });
        }
    }

    focusWindow() {
        if (window.focus) {
            window.focus();
        }
    }

    claudeInteraction() {
        // Handle clicks on Claude's portrait
        const interactions = [
            "All systems are running smoothly. How can I assist you?",
            "I'm actively monitoring your infrastructure. Everything looks good.",
            "Standing by for any issues that might arise. All quiet on the server front.",
            "Current status: All green across the board. Your infrastructure is stable.",
            "Monitoring 12 active services, all responding normally."
        ];
        
        const message = interactions[Math.floor(Math.random() * interactions.length)];
        this.displayClaudeMessage(message);
        
        if (window.claudeAvatar) {
            window.claudeAvatar.speak(message);
        }
    }

    startHeartbeat() {
        setInterval(() => {
            // Check if we've received data recently
            const timeSinceLastMessage = Date.now() - this.lastMessageTime;
            if (timeSinceLastMessage > 30000) { // 30 seconds
                this.updateStatusIndicator('unknown');
            }
        }, 10000);
    }

    updateTimestamps() {
        // Update relative timestamps
        setInterval(() => {
            const uptimeElement = document.getElementById('uptime');
            // This would be calculated from actual server data
            // For now, just increment
            const current = uptimeElement.textContent;
            // uptimeElement.textContent = calculateUptime();
        }, 60000);
    }

    // Mock data for development - remove when WebSocket is ready
    startMockData() {
        let counter = 0;
        
        setInterval(() => {
            counter++;
            
            // Simulate random status changes
            if (counter % 30 === 0) {
                const statuses = ['healthy', 'healthy', 'healthy', 'warning'];
                const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
                
                this.updateSystemStatus({
                    overall: randomStatus,
                    metrics: {
                        cpu: { display: `${Math.floor(Math.random() * 50 + 10)}%`, status: 'healthy' },
                        memory: { display: `${Math.floor(Math.random() * 40 + 20)}%`, status: 'healthy' },
                        disk: { display: `${Math.floor(Math.random() * 30 + 60)}% Free`, status: 'healthy' }
                    }
                });
            }
            
            // Simulate occasional messages
            if (counter % 45 === 0) {
                const messages = [
                    "Completed routine health check. All services responding normally.",
                    "SSL certificates verified. All domains secure.",
                    "Memory usage within normal parameters.",
                    "No anomalies detected in the last scan.",
                    "Infrastructure stable. Standing by."
                ];
                
                this.displayClaudeMessage(messages[Math.floor(Math.random() * messages.length)]);
            }
        }, 1000);
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('claude-mode');
        statusElement.textContent = connected ? 'Monitoring' : 'Reconnecting...';
    }

    clearNotifications() {
        // Clear any persistent notifications when window gains focus
    }

    onPageHidden() {
        // Page is hidden, prepare for background monitoring
    }

    onPageVisible() {
        // Page is visible again, refresh data
        this.lastMessageTime = Date.now();
    }
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.monDashboard = new MonDashboard();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.monDashboard && window.monDashboard.ws) {
        window.monDashboard.ws.close();
    }
});