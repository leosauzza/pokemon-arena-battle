// ==========================================
// PLAYER CLASS
// ==========================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { createPokemonModel } from '../characters/character-models.js';
import { AttackManager } from '../attacks/attack-manager.js';
import { AIController } from '../ai/ai-controller.js';
import { CONFIG } from '../utils/constants.js';

export class Player {
    constructor(type, team, isAI = true, id) {
        this.id = id;
        this.type = type;
        this.team = team;
        this.isAI = isAI;
        this.hp = CONFIG.PLAYER_HP;
        this.maxHp = CONFIG.PLAYER_HP;
        this.isAlive = true;
        
        // Movement
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.rotation = 0;
        this.isLocked = false;
        this.rotationLocked = false;
        
        // Attacks
        this.attacks = AttackManager.getAttacksForPokemon(type);
        this.selectedAttackIndex = -1;
        this.selectedAttack = null;
        this.isAttacking = false;  // True during attack execution (for channeled attacks)
        
        // Create 3D model
        this.mesh = createPokemonModel(type);
        
        // Set initial position based on ID
        const angle = (id / 4) * Math.PI * 2;
        const distance = 20;
        this.position.set(
            Math.cos(angle) * distance,
            0,
            Math.sin(angle) * distance
        );
        this.mesh.position.copy(this.position);
        
        // AI
        this.aiController = isAI ? new AIController(this) : null;
        
        // Callbacks
        this.onDamageDealt = null;  // Called when this player deals damage
        this.onDamageTaken = null;  // Called when this player receives damage
    }
    
    addToScene(scene) {
        scene.add(this.mesh);
    }
    
    removeFromScene(scene) {
        scene.remove(this.mesh);
    }
    
    update(delta, players, obstacles, scene) {
        if (!this.isAlive) return;
        
        // Update attack cooldowns
        AttackManager.updateAttackCooldowns(this.attacks, delta);
        
        // Update HP bar
        this.updateHPBar();
        
        // AI behavior
        if (this.isAI && this.aiController) {
            this.aiController.update(delta, players, obstacles, scene);
        }
        
        // Apply movement with collision check
        if (!this.isLocked) {
            const newPos = this.position.clone().add(this.velocity.clone().multiplyScalar(delta));
            
            // Check obstacle collision for AI (player collision is handled in game.js)
            if (this.isAI && obstacles) {
                // Check if already stuck inside obstacle
                const pushOut = this.getCollisionPushVector(this.position, obstacles);
                if (pushOut.length() > 0) {
                    // Push out of obstacle
                    this.position.add(pushOut.multiplyScalar(delta * 50));
                } else {
                    // Try normal movement
                    if (!this.checkCollisionAt(newPos, obstacles)) {
                        this.position.copy(newPos);
                    } else {
                        // Try sliding
                        const newPosX = this.position.clone().add(new THREE.Vector3(this.velocity.x, 0, 0).multiplyScalar(delta));
                        const canMoveX = !this.checkCollisionAt(newPosX, obstacles);
                        
                        const newPosZ = this.position.clone().add(new THREE.Vector3(0, 0, this.velocity.z).multiplyScalar(delta));
                        const canMoveZ = !this.checkCollisionAt(newPosZ, obstacles);
                        
                        if (canMoveX) this.position.x = newPosX.x;
                        if (canMoveZ) this.position.z = newPosZ.z;
                    }
                }
            } else {
                // Human player - just apply position (collision handled elsewhere)
                this.position.copy(newPos);
            }
            
            // Boundary check
            const limit = CONFIG.ARENA_SIZE / 2 - 2;
            this.position.x = Math.max(-limit, Math.min(limit, this.position.x));
            this.position.z = Math.max(-limit, Math.min(limit, this.position.z));
        }
        
        // Update mesh
        this.mesh.position.copy(this.position);
        this.mesh.position.y = 0;
        this.mesh.rotation.y = this.rotation;
        
        // Clear velocity
        this.velocity.set(0, 0, 0);
        
        // HP bar face camera
        if (this.mesh.userData.hpBar) {
            const camera = window.gameCamera;
            if (camera) {
                this.mesh.userData.hpBar.lookAt(camera.position);
            }
        }
    }
    
    updateHPBar() {
        const hpBar = this.mesh.userData.hpBar;
        if (!hpBar) return;
        
        const fill = hpBar.children.find(c => c.userData.isHpFill);
        if (fill) {
            const ratio = this.hp / this.maxHp;
            fill.scale.x = Math.max(0, ratio);
            fill.position.x = (ratio - 1) * 0.55;
            
            if (ratio > 0.6) fill.material.color.setHex(0x51cf66);
            else if (ratio > 0.3) fill.material.color.setHex(0xffd93d);
            else fill.material.color.setHex(0xff6b6b);
        }
    }
    
    /**
     * Select attack by index
     */
    selectAttack(index) {
        if (index < 0 || index >= this.attacks.length) return false;
        
        const attack = this.attacks[index];
        if (!attack.canUse()) return false;
        
        // Deselect previous
        this.deselectAttack();
        
        this.selectedAttackIndex = index;
        this.selectedAttack = attack;
        
        return true;
    }
    
    /**
     * Deselect current attack
     */
    deselectAttack() {
        if (this.selectedAttack) {
            this.selectedAttack.removePreview(this.mesh.parent);
            this.selectedAttack = null;
            this.selectedAttackIndex = -1;
        }
    }
    
    /**
     * Update attack preview position
     */
    updateAttackPreview(targetPos) {
        if (this.selectedAttack) {
            this.selectedAttack.updatePreview(this, targetPos, this.mesh.parent);
        }
    }
    
    /**
     * Execute selected attack
     */
    executeSelectedAttack(targetPos, scene, players, obstacles, deltaTime, onProjectileCreate) {
        if (!this.selectedAttack || !this.selectedAttack.canUse()) return false;
        
        // Validate required parameters
        if (!scene) {
            console.warn('Cannot execute attack: scene is undefined');
            return false;
        }
        if (!targetPos) {
            console.warn('Cannot execute attack: targetPos is undefined');
            return false;
        }
        if (!players || !Array.isArray(players)) {
            console.warn('Cannot execute attack: players is not an array');
            return false;
        }
        
        const success = this.selectedAttack.execute(
            this, 
            targetPos, 
            scene, 
            players, 
            obstacles, 
            deltaTime,
            onProjectileCreate
        );
        
        if (success) {
            this.selectedAttack.removePreview(scene);
            this.selectedAttack = null;
            this.selectedAttackIndex = -1;
        }
        
        return success;
    }
    
    /**
     * Get attack by key binding
     */
    getAttackByKey(key) {
        return AttackManager.getAttackByKey(this.attacks, key);
    }
    
    /**
     * Check if there's a collision at given position
     */
    checkCollisionAt(pos, obstacles) {
        if (!obstacles || !Array.isArray(obstacles)) return false;
        for (let obstacle of obstacles) {
            if (obstacle.userData.isBoundary) continue;
            const radius = obstacle.userData.radius || 1;
            const dist = pos.distanceTo(obstacle.position);
            if (dist < radius + 0.6) return true;
        }
        return false;
    }
    
    /**
     * Get collision push vector - returns direction to push out of obstacle
     */
    getCollisionPushVector(pos, obstacles) {
        if (!obstacles || !Array.isArray(obstacles)) return new THREE.Vector3();
        
        let pushVector = new THREE.Vector3();
        let collisionCount = 0;
        
        for (let obstacle of obstacles) {
            if (obstacle.userData.isBoundary) continue;
            const radius = obstacle.userData.radius || 1;
            const toObstacle = obstacle.position.clone().sub(pos);
            const dist = toObstacle.length();
            
            // If player is inside obstacle collision radius
            if (dist < radius + 0.6) {
                // Push away from obstacle center
                const pushStrength = (radius + 0.6) - dist;
                if (dist > 0.01) {
                    toObstacle.normalize().multiplyScalar(-pushStrength);
                    pushVector.add(toObstacle);
                    collisionCount++;
                }
            }
        }
        
        if (collisionCount > 0) {
            pushVector.divideScalar(collisionCount);
        }
        
        return pushVector;
    }
    
    takeDamage(amount, dealer = null) {
        if (!this.isAlive) return;
        
        this.hp -= amount;
        
        // Call damage taken callback
        if (this.onDamageTaken) {
            this.onDamageTaken(amount, this);
        }
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
        
        // Flash effect
        this.mesh.traverse(child => {
            if (child.isMesh) {
                const originalColor = child.material.color ? child.material.color.clone() : null;
                if (child.material.emissive) {
                    child.material.emissive.setHex(0xff0000);
                    setTimeout(() => {
                        child.material.emissive.setHex(0x000000);
                    }, 100);
                }
            }
        });
    }
    
    die() {
        this.isAlive = false;
        this.isAttacking = false;
        this.deselectAttack();
        this.mesh.parent.remove(this.mesh);
    }
    
    cleanup(scene) {
        this.isAttacking = false;
        this.deselectAttack();
        this.attacks.forEach(attack => attack.cleanup(scene));
        this.removeFromScene(scene);
    }
}
