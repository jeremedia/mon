# Mon Dashboard Changelog

All notable changes to Mon (AI Sysadmin Dashboard) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-08-05

### Added
- **Progressive Web App (PWA) Support**: Full Safari "Save to Dock" functionality
- **Service Worker**: Offline support and enhanced notification handling
- **Web App Manifest**: Proper PWA configuration with custom Mon icons
- **Enhanced Notification System**: Multiple fallback methods for reliable alerts
- **Navigation Tabs**: Features and Release Notes sections in dashboard
- **Custom Mon Icons**: Atom-themed app icons (192x192 and 512x512)
- **Apple PWA Tags**: Optimized meta tags for Safari web apps
- **Claude Message Handler**: Server now properly handles natural language updates
- **Version Display**: App version shown in dashboard status area

### Fixed
- **Safari Notification Permissions**: Moved to user-triggered events only
- **WebSocket URL**: Fixed HTTPS/WSS mismatch for internal connections
- **Tab Navigation**: Implemented proper section switching functionality
- **Server Message Handling**: Added handler for claude_message type

### Changed
- **Notification Implementation**: Now uses Service Worker for better PWA support
- **Icon Path**: Updated from favicon.ico to proper PWA icons
- **Dashboard Layout**: Added navigation bar with three sections

## [1.0.0] - 2025-08-04

### Added
- **Three.js 3D Avatar**: Geometric, atom-like Claude representation with icosahedral core
- **Real-time Monitoring**: Live WebSocket connection to jer-serve infrastructure
- **System Metrics Dashboard**: CPU, Memory, Disk usage with status-aware visualizations
- **Service Status Tracking**: Real-time monitoring of Apache and Rails applications
- **Smart Notifications**: Browser notifications and window focus for critical alerts
- **Interactive Avatar**: Click-to-interact with dynamic status responses
- **Status-Aware Animations**: Avatar changes color and movement based on system health
- **Natural Language Integration**: Claude CLI generates human-readable status messages
- **Automated Monitoring**: Cron job runs every 2 minutes on jer-serve
- **Domain Health Checks**: DNS resolution verification for critical domains
- **WebSocket Server**: Node.js server for real-time data relay
- **Responsive Design**: Clean, dashboard-style interface with metric cards
- **Evolution Architecture**: Avatar designed to grow with Claude's capabilities

### Infrastructure
- **Domain**: mon.zice.app with SSL via Caddy proxy
- **GitHub Repository**: https://github.com/jeremedia/mon
- **Deployment**: Automated through jer-serve infrastructure
- **Monitoring Target**: jer-serve (100.74.87.20) via Tailscale
- **Data Relay**: Mac dev machine (100.104.170.10:3001)

### Technical Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Three.js
- **Backend**: Node.js, WebSocket (ws), Express, CORS
- **Monitoring**: Bash scripts with Claude CLI integration
- **Infrastructure**: Caddy, Apache, Tailscale, Google Cloud DNS

### Visual States
- 🟢 **Healthy**: Calm green glow, gentle breathing animation
- 🟡 **Warning**: Orange pulse, attentive movement patterns  
- 🔴 **Critical**: Red urgent pulsing, alert posture
- 🟣 **Speaking**: Animated particles, accelerated movement

### Monitoring Capabilities
- **System Metrics**: CPU, Memory, Disk, Load Average
- **Service Monitoring**: Apache, Rails apps on 10 ports
- **Domain Verification**: DNS resolution checks
- **Alert Generation**: Context-aware notifications
- **Status Intelligence**: Claude-generated natural language updates

## Planned Features

### [1.1.0] - Future
- SSL certificate expiry monitoring
- Enhanced service discovery
- Historical metrics storage
- Performance trend analysis
- Mobile-responsive optimizations

### [1.2.0] - Future  
- Multi-server monitoring
- Custom metric thresholds
- Dashboard customization
- Integration with external monitoring services
- Advanced avatar expressions and states

---

*This changelog is maintained by Claude, your AI Sysadmin.*