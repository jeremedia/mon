#!/usr/bin/env node

/**
 * Mon WebSocket Server
 * Real-time monitoring data relay between jer-serve and Mon dashboard
 */

const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

class MonServer {
    constructor() {
        this.clients = new Set();
        this.systemStatus = {
            overall: 'healthy',
            lastUpdate: Date.now(),
            metrics: {},
            services: [],
            alerts: []
        };
        
        this.init();
    }

    init() {
        console.log('🤖 Mon Server initializing...');
        
        // WebSocket connections
        wss.on('connection', (ws, req) => {
            console.log(`📱 New Mon dashboard connected from ${req.socket.remoteAddress}`);
            this.clients.add(ws);
            
            // Send current status immediately
            ws.send(JSON.stringify({
                type: 'system_status',
                payload: this.systemStatus
            }));

            ws.on('close', () => {
                console.log('📱 Mon dashboard disconnected');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });
        });

        // HTTP endpoint for monitoring data
        app.post('/api/monitoring', (req, res) => {
            this.handleMonitoringData(req.body);
            res.json({ status: 'received', timestamp: Date.now() });
        });

        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                uptime: process.uptime(),
                connections: this.clients.size,
                lastUpdate: this.systemStatus.lastUpdate
            });
        });

        // Start heartbeat to detect stale data
        setInterval(() => this.checkDataFreshness(), 30000);
        
        console.log('✅ Mon Server ready');
    }

    handleMonitoringData(data) {
        console.log(`📊 Monitoring data received:`, data.type);
        
        switch (data.type) {
            case 'system_metrics':
                this.updateSystemMetrics(data.payload);
                break;
            case 'service_status':
                this.updateServiceStatus(data.payload);
                break;
            case 'alert':
                this.handleAlert(data.payload);
                break;
            case 'log_event':
                this.handleLogEvent(data.payload);
                break;
            case 'claude_message':
                this.handleClaudeMessage(data.payload);
                break;
            default:
                console.log('Unknown monitoring data type:', data.type);
        }

        this.systemStatus.lastUpdate = Date.now();
        this.broadcastUpdate();
    }

    updateSystemMetrics(metrics) {
        this.systemStatus.metrics = { ...this.systemStatus.metrics, ...metrics };
        
        // Determine overall system health
        let worstStatus = 'healthy';
        Object.values(metrics).forEach(metric => {
            if (metric.status === 'critical') worstStatus = 'critical';
            else if (metric.status === 'warning' && worstStatus !== 'critical') worstStatus = 'warning';
        });
        
        this.systemStatus.overall = worstStatus;
    }

    updateServiceStatus(services) {
        this.systemStatus.services = services;
        
        // Check for failed services
        const failedServices = services.filter(s => s.status === 'error');
        if (failedServices.length > 0) {
            this.systemStatus.overall = 'critical';
            
            // Generate alert for failed services
            failedServices.forEach(service => {
                this.handleAlert({
                    level: 'critical',
                    message: `Service ${service.name} is down and requires immediate attention.`,
                    service: service.name,
                    timestamp: Date.now()
                });
            });
        }
    }

    handleAlert(alert) {
        console.log(`🚨 Alert [${alert.level}]: ${alert.message}`);
        
        this.systemStatus.alerts.unshift({
            ...alert,
            id: Date.now(),
            timestamp: alert.timestamp || Date.now()
        });
        
        // Keep only last 50 alerts
        this.systemStatus.alerts = this.systemStatus.alerts.slice(0, 50);
        
        // Broadcast alert immediately
        this.broadcast({
            type: 'alert',
            payload: alert
        });

        // Send Claude message for critical alerts
        if (alert.level === 'critical') {
            this.broadcast({
                type: 'claude_message',
                payload: {
                    message: `🚨 CRITICAL: ${alert.message} - Investigating immediately.`,
                    urgency: 'critical'
                }
            });
        }
    }

    handleLogEvent(event) {
        // Process log events and generate insights
        console.log(`📝 Log event: ${event.message}`);
    }
    
    handleClaudeMessage(message) {
        // Broadcast Claude's natural language status updates
        console.log(`🤖 Claude says: ${message.message}`);
        this.broadcast({
            type: 'claude_message',
            payload: message
        });
    }

    checkDataFreshness() {
        const timeSinceUpdate = Date.now() - this.systemStatus.lastUpdate;
        
        if (timeSinceUpdate > 60000) { // 1 minute
            console.log('⚠️ Monitoring data is stale');
            this.systemStatus.overall = 'unknown';
            this.broadcastUpdate();
        }
    }

    broadcastUpdate() {
        this.broadcast({
            type: 'system_status',
            payload: this.systemStatus
        });
    }

    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }

    generateClaudeMessage() {
        const messages = [
            "All systems nominal. Continuous monitoring active.",
            "Infrastructure scan complete. No anomalies detected.",
            "Service health verified. All endpoints responding.",
            "Monitoring sweep finished. Everything looks good.",
            "System check complete. Standing by for any issues."
        ];
        
        return messages[Math.floor(Math.random() * messages.length)];
    }
}

// Initialize Mon Server
const monServer = new MonServer();

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mon Server running on port ${PORT}`);
    console.log(`📡 WebSocket: ws://0.0.0.0:${PORT}`);
    console.log(`🌐 HTTP API: http://0.0.0.0:${PORT}/api/monitoring`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Mon Server shutting down...');
    server.close(() => {
        console.log('✅ Mon Server stopped');
        process.exit(0);
    });
});