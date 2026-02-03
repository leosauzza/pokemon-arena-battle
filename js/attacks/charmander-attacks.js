// ==========================================
// CHARMANDER ATTACKS
// ==========================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { Attack } from './attack-base.js';
import { AttackType, CONFIG } from '../utils/constants.js';
import { checkObstacleBetween, getForwardVector } from '../utils/helpers.js';

export class FlamethrowerAttack extends Attack {
    constructor() {
        super({
            id: 'flamethrower',
            name: 'Flamethrower',
            description: 'Cone of fire for 3 seconds',
            cooldown: 4,
            damage: CONFIG.ATTACK_DAMAGE * 0.5, // Per tick
            type: AttackType.CHANNEL,
            range: 8,
            icon: '🔥',
            keyBinding: '1'
        });
        
        this.duration = 3;
        this.coneAngle = Math.PI / 6; // 30 degrees
        this.channelInterval = null;
        this.isActive = false;
    }
    
    createPreview(player, targetPos) {
        // Create triangle preview on the floor (pointing in +Z direction)
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 0, 0,  // apex (at player position)
            -4, 0, 8, // left corner
            4, 0, 8   // right corner
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        const material = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        this.previewMesh = new THREE.Mesh(geometry, material);
        this.previewMesh.position.y = 0.05; // Slightly above ground
        
        // Add wireframe outline for better visibility
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.6 }));
        line.position.y = 0.02;
        this.previewMesh.add(line);
        
        player.mesh.add(this.previewMesh);
        return this.previewMesh;
    }
    
    updatePreviewPosition(player, targetPos) {
        // Cone stays in front, rotates with player
    }
    
    removePreview(scene) {
        if (this.previewMesh && this.previewMesh.parent) {
            this.previewMesh.parent.remove(this.previewMesh);
            this.previewMesh = null;
        }
    }
    
    performAttack(player, targetPos, scene, players, obstacles, deltaTime) {
        if (!scene) {
            console.warn('FlamethrowerAttack: scene is undefined');
            return false;
        }
        
        // Clear any existing interval first
        if (this.channelInterval) {
            clearInterval(this.channelInterval);
            this.channelInterval = null;
        }
        
        this.isActive = true;
        const self = this; // Capture this for closure
        const startTime = Date.now();
        
        // Set attacking flag so player can rotate during channel
        player.isAttacking = true;
        
        // Create actual fire effect as a triangle on the floor
        const fireGeometry = new THREE.BufferGeometry();
        const range = self.range; // Capture range
        const halfWidth = 4; // Half the cone width at max range
        const fireVertices = new Float32Array([
            0, 0, 0,  // apex
            -halfWidth, 0, range, // left
            halfWidth, 0, range   // right
        ]);
        fireGeometry.setAttribute('position', new THREE.BufferAttribute(fireVertices, 3));
        
        const coneMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const cone = new THREE.Mesh(fireGeometry, coneMaterial);
        cone.position.y = 0.1;
        player.mesh.add(cone);
        
        // Debug
        console.log('Flamethrower started, range:', range, 'coneAngle:', self.coneAngle);
        
        this.channelInterval = setInterval(() => {
            if (!self.isActive || !player.isAlive) {
                console.log('Flamethrower ending');
                clearInterval(self.channelInterval);
                self.channelInterval = null;
                if (cone.parent) cone.parent.remove(cone);
                player.isAttacking = false;
                self.isActive = false;
                return;
            }
            
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed >= self.duration) {
                clearInterval(self.channelInterval);
                self.channelInterval = null;
                if (cone.parent) cone.parent.remove(cone);
                player.isAttacking = false;
                self.isActive = false;
                return;
            }
            
            // Check for hits - use current player rotation each tick
            const currentForward = getForwardVector(player.rotation);
            
            if (players && Array.isArray(players)) {
                for (let p of players) {
                    const isValidTarget = p !== player && p.isAlive && p.team !== player.team;
                    if (isValidTarget) {
                        const toTarget = p.position.clone().sub(player.position);
                        const dist = toTarget.length();
                        
                        if (dist < range) {
                            toTarget.normalize();
                            const angle = currentForward.angleTo(toTarget);
                            
                            if (angle < self.coneAngle) {
                                if (!checkObstacleBetween(player.position, p.position, obstacles)) {
                                    console.log('Flamethrower hit! dist:', dist.toFixed(2), 'range:', range);
                                    p.takeDamage(self.damage * 0.1); // Damage per tick
                                }
                            }
                        }
                    }
                }
            }
            
            // Flicker effect
            if (cone.material) {
                cone.material.opacity = 0.3 + Math.random() * 0.4;
            }
        }, 100);
        
        return true;
    }
    
    cleanup(scene) {
        super.cleanup(scene);
        this.isActive = false;
        if (this.channelInterval) {
            clearInterval(this.channelInterval);
            this.channelInterval = null;
        }
    }
    
    removePreview(scene) {
        if (this.previewMesh && this.previewMesh.parent) {
            this.previewMesh.parent.remove(this.previewMesh);
            this.previewMesh = null;
        }
    }
    
    onCancel(player) {
        this.isActive = false;
        player.isAttacking = false;
        if (this.channelInterval) {
            clearInterval(this.channelInterval);
            this.channelInterval = null;
        }
    }
    
    /**
     * Called when attack is cancelled/interrupted
     */
    onCancel(player) {
        player.isAttacking = false;
    }
}

export class ScratchAttack extends Attack {
    constructor() {
        super({
            id: 'scratch',
            name: 'Scratch',
            description: 'Melee attack with knockback',
            cooldown: 3,
            damage: CONFIG.ATTACK_DAMAGE * 2,
            type: AttackType.INSTANT,
            range: 3,
            icon: '🐾',
            keyBinding: '2'
        });
    }
    
    createPreview(player, targetPos) {
        // Triangle wedge preview on the floor
        const geometry = new THREE.BufferGeometry();
        const range = this.range;
        const halfAngle = Math.PI / 4; // 45 degrees each side
        const leftX = -Math.sin(halfAngle) * range;
        const leftZ = Math.cos(halfAngle) * range;
        const rightX = Math.sin(halfAngle) * range;
        const rightZ = Math.cos(halfAngle) * range;
        
        const vertices = new Float32Array([
            0, 0, 0,       // apex (at player position)
            leftX, 0, leftZ,  // left corner
            rightX, 0, rightZ  // right corner
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        this.previewMesh = new THREE.Mesh(geometry, material);
        this.previewMesh.position.y = 0.05;
        
        // Add wireframe outline
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.5 }));
        line.position.y = 0.02;
        this.previewMesh.add(line);
        
        player.mesh.add(this.previewMesh);
        return this.previewMesh;
    }
    
    removePreview(scene) {
        if (this.previewMesh && this.previewMesh.parent) {
            this.previewMesh.parent.remove(this.previewMesh);
            this.previewMesh = null;
        }
    }
    
    performAttack(player, targetPos, scene, players, obstacles, deltaTime) {
        if (!scene) {
            console.warn('ScratchAttack: scene is undefined');
            return false;
        }
        
        const forward = getForwardVector(player.rotation);
        
        // Visual claw swipe
        const swipeGeometry = new THREE.PlaneGeometry(3, 2);
        const swipeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const swipe = new THREE.Mesh(swipeGeometry, swipeMaterial);
        swipe.position.set(0, 1, 1.5);
        swipe.rotation.x = -Math.PI / 3;
        player.mesh.add(swipe);
        
        setTimeout(() => player.mesh.remove(swipe), 200);
        
        // Check hits
        for (let p of players) {
            if (p !== player && p.isAlive && p.team !== player.team) {
                const dist = player.position.distanceTo(p.position);
                const toPlayer = p.position.clone().sub(player.position).normalize();
                const angle = forward.angleTo(toPlayer);
                
                if (dist < this.range && angle < Math.PI / 4) {
                    if (!checkObstacleBetween(player.position, p.position, obstacles)) {
                        p.takeDamage(this.damage);
                        
                        // Knockback
                        const knockbackDir = toPlayer.clone();
                        knockbackDir.y = 0;
                        p.position.add(knockbackDir.multiplyScalar(3));
                    }
                }
            }
        }
        
        return true;
    }
}
