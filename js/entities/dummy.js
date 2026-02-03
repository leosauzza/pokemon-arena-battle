// ==========================================
// DUMMY TARGET FOR PRACTICE ARENA
// ==========================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class Dummy {
    constructor(scene, position = new THREE.Vector3(0, 0, 0)) {
        this.scene = scene;
        this.position = position.clone();
        this.maxHp = 40;
        this.hp = this.maxHp;
        this.isAlive = true;
        this.team = 99; // Special team for dummy (not hostile to anyone)
        this.id = 'dummy';
        this.type = 'dummy';
        this.isAI = false;
        
        // Healing mechanism
        this.healInterval = 5000; // 5 seconds
        this.lastHealTime = 0;
        this.healAmount = 40; // Heal back to full
        
        // Callback for damage visualization
        this.onDamageTaken = null;
        
        // Create 3D model
        this.mesh = this.createModel();
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        // Create HP bar
        this.createHPBar();
    }
    
    createModel() {
        const group = new THREE.Group();
        
        // Main body - cylindrical training dummy
        const bodyGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2.5, 16);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.25;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Target circles on body (red and white rings)
        const ringGeometry = new THREE.CylinderGeometry(0.85, 0.85, 0.3, 16);
        const ringMaterial1 = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const ring1 = new THREE.Mesh(ringGeometry, ringMaterial1);
        ring1.position.y = 1.8;
        group.add(ring1);
        
        const ringMaterial2 = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const ring2 = new THREE.Mesh(ringGeometry, ringMaterial2);
        ring2.position.y = 1.4;
        group.add(ring2);
        
        const ringMaterial3 = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const ring3 = new THREE.Mesh(ringGeometry, ringMaterial3);
        ring3.position.y = 1.0;
        group.add(ring3);
        
        // Base/stand
        const baseGeometry = new THREE.CylinderGeometry(1.2, 1.5, 0.3, 16);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.15;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // Top cap
        const capGeometry = new THREE.SphereGeometry(0.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const capMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 2.5;
        group.add(cap);
        
        // Store reference for hit flash effect
        this.bodyMeshes = [body, ring1, ring2, ring3, cap];
        
        return group;
    }
    
    createHPBar() {
        // Create HP bar canvas
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        
        // Background
        context.fillStyle = '#333';
        context.fillRect(0, 0, 128, 32);
        
        // Health fill
        context.fillStyle = '#51cf66';
        context.fillRect(2, 2, 124, 28);
        
        // Text
        context.fillStyle = '#fff';
        context.font = 'bold 16px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('40/40', 64, 16);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        this.hpBar = new THREE.Sprite(material);
        this.hpBar.position.set(0, 3.5, 0);
        this.hpBar.scale.set(3, 0.75, 1);
        this.mesh.add(this.hpBar);
        
        this.hpBarCanvas = canvas;
        this.hpBarContext = context;
        this.hpBarTexture = texture;
    }
    
    updateHPBar() {
        const canvas = this.hpBarCanvas;
        const context = this.hpBarContext;
        const texture = this.hpBarTexture;
        
        const ratio = this.hp / this.maxHp;
        
        // Clear
        context.fillStyle = '#333';
        context.fillRect(0, 0, 128, 32);
        
        // Health fill color based on HP ratio
        let fillColor = '#51cf66';
        if (ratio < 0.3) fillColor = '#ff6b6b';
        else if (ratio < 0.6) fillColor = '#ffd93d';
        
        // Health fill
        context.fillStyle = fillColor;
        context.fillRect(2, 2, Math.max(0, 124 * ratio), 28);
        
        // Border
        context.strokeStyle = '#fff';
        context.lineWidth = 2;
        context.strokeRect(0, 0, 128, 32);
        
        // Text
        context.fillStyle = '#fff';
        context.font = 'bold 16px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(`${Math.ceil(this.hp)}/${this.maxHp}`, 64, 16);
        
        texture.needsUpdate = true;
    }
    
    takeDamage(amount, dealer = null) {
        this.hp -= amount;
        
        // Ensure HP doesn't go below 1 (dummy never dies)
        if (this.hp < 1) {
            this.hp = 1;
        }
        
        // Update HP bar
        this.updateHPBar();
        
        // Call damage taken callback
        if (this.onDamageTaken) {
            this.onDamageTaken(amount, this);
        }
        
        // Flash effect
        this.bodyMeshes.forEach(mesh => {
            if (mesh.material && mesh.material.emissive) {
                mesh.material.emissive.setHex(0xff0000);
                setTimeout(() => {
                    if (mesh.material) {
                        mesh.material.emissive.setHex(0x000000);
                    }
                }, 100);
            }
        });
        
        // Wobble animation when hit
        this.wobble();
    }
    
    wobble() {
        // Simple wobble animation
        const startRotation = this.mesh.rotation.z;
        const wobbleAmount = 0.2;
        const duration = 200;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                this.mesh.rotation.z = Math.sin(progress * Math.PI * 4) * wobbleAmount * (1 - progress);
                requestAnimationFrame(animate);
            } else {
                this.mesh.rotation.z = 0;
            }
        };
        
        animate();
    }
    
    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.updateHPBar();
        
        // Green flash for heal
        this.bodyMeshes.forEach(mesh => {
            if (mesh.material && mesh.material.emissive) {
                mesh.material.emissive.setHex(0x00ff00);
                setTimeout(() => {
                    if (mesh.material) {
                        mesh.material.emissive.setHex(0x000000);
                    }
                }, 200);
            }
        });
    }
    
    update(delta) {
        // Auto-heal every 5 seconds
        const now = Date.now();
        if (now - this.lastHealTime >= this.healInterval) {
            this.heal(this.healAmount);
            this.lastHealTime = now;
        }
        
        // HP bar face camera
        const camera = window.gameCamera;
        if (camera && this.hpBar) {
            this.hpBar.lookAt(camera.position);
        }
    }
    
    cleanup() {
        this.scene.remove(this.mesh);
    }
}
