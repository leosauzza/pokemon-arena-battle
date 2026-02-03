// ==========================================
// BASE ATTACK CLASS
// ==========================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { AttackType } from '../utils/constants.js';
import { checkObstacleBetween } from '../utils/helpers.js';

export class Attack {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this.cooldown = config.cooldown;
        this.damage = config.damage;
        this.type = config.type || AttackType.INSTANT;
        this.range = config.range || 10;
        this.icon = config.icon || '⚔️';
        this.keyBinding = config.keyBinding;
        
        // State
        this.currentCooldown = 0;
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.channelTimer = null;
        
        // Visuals
        this.previewMesh = null;
        this.activeVisuals = [];
    }
    
    /**
     * Check if attack can be used
     */
    canUse() {
        return this.currentCooldown <= 0 && !this.isCharging;
    }
    
    /**
     * Start cooldown
     */
    startCooldown() {
        this.currentCooldown = this.cooldown;
    }
    
    /**
     * Update cooldown
     */
    update(delta) {
        if (this.currentCooldown > 0) {
            this.currentCooldown -= delta;
            if (this.currentCooldown < 0) this.currentCooldown = 0;
        }
    }
    
    /**
     * Get cooldown percentage (0-1)
     */
    getCooldownPercent() {
        if (this.cooldown <= 0) return 0;
        return this.currentCooldown / this.cooldown;
    }
    
    /**
     * Create preview visualization
     */
    createPreview(player, targetPos) {
        return null;
    }
    
    /**
     * Update preview based on new target
     */
    updatePreview(player, targetPos) {
        if (this.previewMesh) {
            this.updatePreviewPosition(player, targetPos);
        }
    }
    
    /**
     * Update preview position - override in subclass
     */
    updatePreviewPosition(player, targetPos) {
        // Override in subclass
    }
    
    /**
     * Remove preview
     */
    removePreview(scene) {
        if (this.previewMesh) {
            scene.remove(this.previewMesh);
            this.previewMesh = null;
        }
    }
    
    /**
     * Execute the attack
     */
    execute(player, targetPos, scene, players, obstacles, deltaTime, onProjectileCreate) {
        if (!this.canUse()) return false;
        
        this.startCooldown();
        return this.performAttack(player, targetPos, scene, players, obstacles, deltaTime, onProjectileCreate);
    }
    
    /**
     * Perform actual attack - override in subclass
     */
    performAttack(player, targetPos, scene, players, obstacles, deltaTime, onProjectileCreate) {
        // Override in subclass
        return true;
    }
    
    /**
     * Clean up all visuals
     */
    cleanup(scene) {
        this.removePreview(scene);
        this.activeVisuals.forEach(visual => {
            scene.remove(visual);
        });
        this.activeVisuals = [];
    }
    
    /**
     * Get hit players in radius
     */
    getHitPlayersInRadius(center, radius, owner, players, obstacles) {
        const hitPlayers = [];
        
        for (let player of players) {
            if (player !== owner && player.isAlive && player.team !== owner.team) {
                const dist = center.distanceTo(player.position);
                if (dist < radius) {
                    // Check line of sight
                    if (!checkObstacleBetween(owner.position, player.position, obstacles)) {
                        hitPlayers.push(player);
                    }
                }
            }
        }
        
        return hitPlayers;
    }
}
