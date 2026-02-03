// ==========================================
// AI CONTROLLER
// ==========================================

import { getForwardVector } from '../utils/helpers.js';

export class AIController {
    constructor(player) {
        this.player = player;
        this.target = null;
        this.state = 'idle';
        this.timer = 0;
        this.updateInterval = 0.5;
        this.attackRange = {
            close: 4,
            medium: 8,
            far: 15
        };
        this.players = [];
        this.obstacles = [];
        this.scene = null;
    }
    
    update(delta, players, obstacles, scene) {
        if (!this.player.isAlive || this.player.isLocked) return;
        
        // Store references for attack execution
        this.players = players || [];
        this.obstacles = obstacles || [];
        this.scene = scene;
        
        this.timer -= delta;
        
        // Find nearest enemy
        this.findTarget(players);
        
        if (!this.target) return;
        
        const distToTarget = this.player.position.distanceTo(this.target.position);
        const dirToTarget = this.target.position.clone().sub(this.player.position).normalize();
        
        // Rotate towards target (unless rotation locked)
        if (!this.player.rotationLocked) {
            this.player.rotation = Math.atan2(dirToTarget.x, dirToTarget.z);
        }
        
        // AI behavior based on Pokemon type
        this.executeBehavior(distToTarget, dirToTarget, delta);
    }
    
    findTarget(players) {
        let nearest = null;
        let nearestDist = Infinity;
        
        for (let player of players) {
            if (player !== this.player && player.isAlive && player.team !== this.player.team) {
                const dist = this.player.position.distanceTo(player.position);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = player;
                }
            }
        }
        
        this.target = nearest;
    }
    
    executeBehavior(dist, dir, delta) {
        switch(this.player.type) {
            case 'charmander':
                this.charmanderBehavior(dist, dir, delta);
                break;
            case 'bulbasaur':
                this.bulbasaurBehavior(dist, dir, delta);
                break;
            case 'squirtle':
                this.squirtleBehavior(dist, dir, delta);
                break;
            case 'pikachu':
                this.pikachuBehavior(dist, dir, delta);
                break;
        }
    }
    
    charmanderBehavior(dist, dir, delta) {
        const attacks = this.player.attacks;
        
        // Validate we have required context
        if (!this.target || !this.scene) return;
        
        // Scratch at close range
        if (dist < this.attackRange.close && attacks[1].canUse() && Math.random() < 0.1) {
            this.player.selectedAttack = attacks[1];
            this.player.executeSelectedAttack(
                this.target.position, 
                this.scene, 
                this.players, 
                this.obstacles, 
                delta,
                (proj) => window.gameInstance?.projectiles?.push(proj)
            );
            return;
        }
        
        // Flamethrower at medium range
        if (dist < this.attackRange.medium && attacks[0].canUse() && Math.random() < 0.05) {
            this.player.selectedAttack = attacks[0];
            this.player.executeSelectedAttack(
                this.target.position, 
                this.scene, 
                this.players, 
                this.obstacles, 
                delta,
                (proj) => window.gameInstance?.projectiles?.push(proj)
            );
            return;
        }
        
        // Movement
        if (dist > this.attackRange.close) {
            this.player.velocity.copy(dir).multiplyScalar(12);
        } else if (dist < 2) {
            this.player.velocity.copy(dir).multiplyScalar(-10);
        }
    }
    
    bulbasaurBehavior(dist, dir, delta) {
        const attacks = this.player.attacks;
        
        // Validate we have required context
        if (!this.target || !this.scene) return;
        
        // Solar Beam at far range
        if (dist < this.attackRange.far && dist > this.attackRange.medium && 
            attacks[1].canUse() && Math.random() < 0.03) {
            this.player.selectedAttack = attacks[1];
            this.player.executeSelectedAttack(
                this.target.position, 
                this.scene, 
                this.players, 
                this.obstacles, 
                delta,
                (proj) => window.gameInstance?.projectiles?.push(proj)
            );
            return;
        }
        
        // Vine Whip at medium range
        if (dist < this.attackRange.medium && attacks[0].canUse() && Math.random() < 0.05) {
            this.player.selectedAttack = attacks[0];
            this.player.executeSelectedAttack(
                this.target.position, 
                this.scene, 
                this.players, 
                this.obstacles, 
                delta,
                (proj) => window.gameInstance?.projectiles?.push(proj)
            );
            return;
        }

                // Razor Leaf at medium-far range
        if (dist < this.attackRange.far && attacks[2].canUse() && Math.random() < 0.03) {
            this.player.selectedAttack = attacks[2];
            this.player.executeSelectedAttack(
                this.target.position, 
                this.scene, 
                this.players, 
                this.obstacles, 
                delta,
                (proj) => window.gameInstance?.projectiles?.push(proj)
            );
            return;
        }
        
        // Movement - keep distance
        if (dist > this.attackRange.medium) {
            this.player.velocity.copy(dir).multiplyScalar(10);
        } else if (dist < this.attackRange.close) {
            this.player.velocity.copy(dir).multiplyScalar(-8);
        }
    }
    
    squirtleBehavior(dist, dir, delta) {
        const attacks = this.player.attacks;
        
        // Validate we have required context
        if (!this.target || !this.scene) return;
        
        // Hydro Pulse at medium range
        if (dist < this.attackRange.medium && attacks[1].canUse() && Math.random() < 0.04) {
            this.player.selectedAttack = attacks[1];
            this.player.executeSelectedAttack(
                this.target.position, 
                this.scene, 
                this.players, 
                this.obstacles, 
                delta,
                (proj) => window.gameInstance?.projectiles?.push(proj)
            );
            return;
        }
        
        // Water Gun
        if (dist < this.attackRange.medium && attacks[0].canUse() && Math.random() < 0.05) {
            this.player.selectedAttack = attacks[0];
            this.player.executeSelectedAttack(
                this.target.position, 
                this.scene, 
                this.players, 
                this.obstacles, 
                delta,
                (proj) => window.gameInstance?.projectiles?.push(proj)
            );
            return;
        }
        
        // Movement
        if (dist > this.attackRange.medium) {
            this.player.velocity.copy(dir).multiplyScalar(11);
        }
    }
    
    pikachuBehavior(dist, dir, delta) {
        const attacks = this.player.attacks;
        
        // Validate we have required context
        if (!this.target || !this.scene) return;
        
        // Thunderbolt at any range
        if (dist < this.attackRange.far && attacks[1].canUse() && Math.random() < 0.04) {
            this.player.selectedAttack = attacks[1];
            this.player.executeSelectedAttack(
                this.target.position, 
                this.scene, 
                this.players, 
                this.obstacles, 
                delta,
                (proj) => window.gameInstance?.projectiles?.push(proj)
            );
            return;
        }
        
        // Quick Attack to engage or escape
        if (attacks[0].canUse() && Math.random() < 0.03) {
            if (dist > this.attackRange.medium || (dist < 3 && this.player.hp < 15)) {
                this.player.selectedAttack = attacks[0];
                this.player.executeSelectedAttack(
                    this.target.position, 
                    this.scene, 
                    this.players, 
                    this.obstacles, 
                    delta,
                    (proj) => window.gameInstance?.projectiles?.push(proj)
                );
                return;
            }
        }
        
        // Movement - fast
        if (dist > this.attackRange.close) {
            this.player.velocity.copy(dir).multiplyScalar(14);
        } else if (dist < 3) {
            this.player.velocity.copy(dir).multiplyScalar(-12);
        }
    }
}
