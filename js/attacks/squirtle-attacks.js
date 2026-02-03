// ==========================================
// SQUIRTLE ATTACKS
// ==========================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { Attack } from './attack-base.js';
import { AttackType, CONFIG } from '../utils/constants.js';
import { checkObstacleBetween, checkObstacleCollision, getForwardVector } from '../utils/helpers.js';

export class WaterGunAttack extends Attack {
    constructor() {
        super({
            id: 'watergun',
            name: 'Water Gun',
            description: 'Beam for 2 seconds',
            cooldown: 5,
            damage: CONFIG.ATTACK_DAMAGE * 0.4,
            type: AttackType.CHANNEL,
            range: 10,
            icon: '💧',
            keyBinding: '1'
        });
        
        this.duration = 2;
        this.channelInterval = null;
    }
    
    createPreview(player, targetPos) {
        const geometry = new THREE.CylinderGeometry(0.4, 0.4, this.range, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0x0099ff,
            transparent: true,
            opacity: 0.3
        });
        
        this.previewMesh = new THREE.Mesh(geometry, material);
        this.previewMesh.rotation.x = Math.PI / 2;
        this.previewMesh.position.z = this.range / 2;
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
        const startTime = Date.now();
        
        // Set attacking flag so player can rotate during channel
        player.isAttacking = true;
        
        const waterGroup = new THREE.Group();
        const beamGeometry = new THREE.CylinderGeometry(0.4, 0.4, this.range, 16);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: 0x0099ff,
            transparent: true,
            opacity: 0.6
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.rotation.x = Math.PI / 2;
        beam.position.z = this.range / 2;
        waterGroup.add(beam);
        
        player.mesh.add(waterGroup);
        
        this.channelInterval = setInterval(() => {
            if (!player.isAlive) {
                clearInterval(this.channelInterval);
                player.mesh.remove(waterGroup);
                player.isAttacking = false;
                return;
            }
            
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed >= this.duration) {
                clearInterval(this.channelInterval);
                player.mesh.remove(waterGroup);
                player.isAttacking = false;
                return;
            }
            
            const forward = getForwardVector(player.rotation);
            
            // Check hits
            if (players && Array.isArray(players)) {
                for (let p of players) {
                    if (p !== player && p.isAlive && p.team !== player.team) {
                        const toPlayer = p.position.clone().sub(player.position);
                        const projection = toPlayer.dot(forward);
                        const closestPoint = player.position.clone().add(forward.clone().multiplyScalar(projection));
                        const distToLine = p.position.distanceTo(closestPoint);
                        
                        if (projection > 0 && projection < this.range && distToLine < 0.8) {
                            if (!checkObstacleBetween(player.position, p.position, obstacles)) {
                                p.takeDamage(this.damage * 0.05);
                            }
                        }
                    }
                }
            }
        }, 50);
        
        return true;
    }
    
    cleanup(scene) {
        super.cleanup(scene);
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

export class HydroPulseAttack extends Attack {
    constructor() {
        super({
            id: 'hydropulse',
            name: 'Hydro Pulse',
            description: 'Projectile in beeline',
            cooldown: 4,
            damage: CONFIG.ATTACK_DAMAGE * 1.5,
            type: AttackType.PROJECTILE,
            range: 20,
            icon: '🌊',
            keyBinding: '2'
        });
        
        this.projectileSpeed = 25;
    }
    
    createPreview(player, targetPos) {
        // Small indicator
        const geometry = new THREE.SphereGeometry(0.3, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0x0066cc,
            transparent: true,
            opacity: 0.5
        });
        
        this.previewMesh = new THREE.Mesh(geometry, material);
        this.previewMesh.position.z = 2;
        player.mesh.add(this.previewMesh);
        return this.previewMesh;
    }
    
    removePreview(scene) {
        if (this.previewMesh && this.previewMesh.parent) {
            this.previewMesh.parent.remove(this.previewMesh);
            this.previewMesh = null;
        }
    }
    
    performAttack(player, targetPos, scene, players, obstacles, deltaTime, onProjectileCreate) {
        if (!scene) {
            console.warn('HydroPulseAttack: scene is undefined');
            return false;
        }
        
        const forward = getForwardVector(player.rotation);
        
        const projectileGeometry = new THREE.SphereGeometry(0.6, 16, 16);
        const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0x0066cc });
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        projectile.position.copy(player.position).add(forward.clone().multiplyScalar(1.5));
        projectile.position.y = 1;
        scene.add(projectile);
        
        const projData = {
            mesh: projectile,
            velocity: forward.clone().multiplyScalar(this.projectileSpeed),
            owner: player,
            damage: this.damage,
            type: 'hydropulse'
        };
        
        if (onProjectileCreate) {
            onProjectileCreate(projData);
        }
        
        return true;
    }
}

