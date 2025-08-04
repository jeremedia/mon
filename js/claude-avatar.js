/**
 * Claude Avatar - Three.js 3D representation of Claude AI
 * A geometric, abstract representation that expresses status through
 * form, color, and subtle animation
 */

class ClaudeAvatar {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.container = this.canvas.parentElement;
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, 400/300, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true, 
            alpha: true 
        });
        
        this.status = 'healthy'; // healthy, warning, critical, thinking
        this.lastStatusChange = Date.now();
        
        this.init();
        this.createAvatar();
        this.animate();
        
        // Hide loading text once initialized
        setTimeout(() => {
            const loadingText = this.container.querySelector('.loading-text');
            if (loadingText) loadingText.style.display = 'none';
        }, 1000);
    }

    init() {
        // Set up renderer
        this.renderer.setSize(400, 300);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Position camera
        this.camera.position.set(0, 0, 5);
        this.camera.lookAt(0, 0, 0);

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        // Add main light
        this.mainLight = new THREE.DirectionalLight(0x4CAF50, 1);
        this.mainLight.position.set(2, 3, 4);
        this.mainLight.castShadow = true;
        this.scene.add(this.mainLight);

        // Add fill light
        const fillLight = new THREE.DirectionalLight(0x2196F3, 0.5);
        fillLight.position.set(-2, 1, 2);
        this.scene.add(fillLight);
    }

    createAvatar() {
        this.avatarGroup = new THREE.Group();

        // Core - representing the "mind"
        const coreGeometry = new THREE.IcosahedronGeometry(0.8, 2);
        const coreMaterial = new THREE.MeshPhongMaterial({
            color: 0x4CAF50,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        this.core = new THREE.Mesh(coreGeometry, coreMaterial);
        this.core.castShadow = true;
        this.avatarGroup.add(this.core);

        // Orbital rings - representing data flow and processing
        this.orbitals = [];
        for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.TorusGeometry(1.2 + i * 0.3, 0.02, 8, 32);
            const ringMaterial = new THREE.MeshPhongMaterial({
                color: 0x2196F3,
                transparent: true,
                opacity: 0.6
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            
            // Randomize ring orientations
            ring.rotation.x = Math.random() * Math.PI;
            ring.rotation.y = Math.random() * Math.PI;
            ring.rotation.z = Math.random() * Math.PI;
            
            this.orbitals.push(ring);
            this.avatarGroup.add(ring);
        }

        // Data particles - representing active monitoring
        this.particles = [];
        const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        for (let i = 0; i < 12; i++) {
            const particleMaterial = new THREE.MeshPhongMaterial({
                color: 0x00BCD4,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position particles randomly around the avatar
            const radius = 2 + Math.random() * 1;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            particle.position.x = radius * Math.sin(phi) * Math.cos(theta);
            particle.position.y = radius * Math.sin(phi) * Math.sin(theta);
            particle.position.z = radius * Math.cos(phi);
            
            particle.userData = {
                originalPosition: particle.position.clone(),
                speed: 0.5 + Math.random() * 0.5,
                orbitPhase: Math.random() * Math.PI * 2
            };
            
            this.particles.push(particle);
            this.avatarGroup.add(particle);
        }

        this.scene.add(this.avatarGroup);
    }

    setStatus(newStatus) {
        if (this.status !== newStatus) {
            this.status = newStatus;
            this.lastStatusChange = Date.now();
            this.updateAppearance();
        }
    }

    updateAppearance() {
        const colors = {
            healthy: { core: 0x4CAF50, light: 0x4CAF50, particles: 0x00BCD4 },
            warning: { core: 0xFF9800, light: 0xFF9800, particles: 0xFFC107 },
            critical: { core: 0xF44336, light: 0xF44336, particles: 0xFF5722 },
            thinking: { core: 0x9C27B0, light: 0x9C27B0, particles: 0xE91E63 }
        };

        const statusColors = colors[this.status] || colors.healthy;

        // Update core color
        this.core.material.color.setHex(statusColors.core);
        
        // Update light color
        this.mainLight.color.setHex(statusColors.light);
        
        // Update particle colors
        this.particles.forEach(particle => {
            particle.material.color.setHex(statusColors.particles);
        });
    }

    speak(message, duration = 3000) {
        this.setStatus('thinking');
        
        // Animate more vigorously while speaking
        this.speakingUntil = Date.now() + duration;
        
        // Return to normal status after speaking
        setTimeout(() => {
            this.setStatus('healthy');
        }, duration);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;
        const isSpeaking = Date.now() < (this.speakingUntil || 0);

        // Rotate core
        this.core.rotation.x += 0.005;
        this.core.rotation.y += 0.007;

        // Animate orbital rings
        this.orbitals.forEach((ring, index) => {
            const speed = isSpeaking ? 0.02 : 0.01;
            ring.rotation.x += speed * (index + 1);
            ring.rotation.y += speed * (index + 1) * 0.7;
        });

        // Animate particles
        this.particles.forEach((particle, index) => {
            const userData = particle.userData;
            const speed = isSpeaking ? userData.speed * 2 : userData.speed;
            
            userData.orbitPhase += speed * 0.01;
            
            const radius = 2 + Math.sin(time + index) * 0.5;
            const theta = userData.orbitPhase + index * 0.5;
            const phi = Math.sin(time * 0.3 + index) * 0.5 + Math.PI / 2;
            
            particle.position.x = radius * Math.sin(phi) * Math.cos(theta);
            particle.position.y = radius * Math.sin(phi) * Math.sin(theta) + Math.sin(time + index) * 0.2;
            particle.position.z = radius * Math.cos(phi);
        });

        // Gentle breathing animation for the whole avatar
        const breathe = 1 + Math.sin(time * 2) * 0.05;
        this.avatarGroup.scale.setScalar(breathe);

        // Status-specific animations
        if (this.status === 'critical') {
            // Urgent pulsing
            const urgentPulse = 1 + Math.sin(time * 10) * 0.1;
            this.core.scale.setScalar(urgentPulse);
        } else if (this.status === 'warning') {
            // Gentle pulsing
            const warningPulse = 1 + Math.sin(time * 4) * 0.05;
            this.core.scale.setScalar(warningPulse);
        } else {
            // Reset to normal scale
            this.core.scale.setScalar(1);
        }

        this.renderer.render(this.scene, this.camera);
    }

    // Handle window resize
    onWindowResize() {
        this.renderer.setSize(400, 300);
    }
}

// Initialize Claude Avatar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.claudeAvatar = new ClaudeAvatar('claude-canvas');
    
    // Test status changes (remove in production)
    setTimeout(() => {
        window.claudeAvatar.speak("Infrastructure scan complete. All systems nominal.");
    }, 2000);
});