// ==========================================
// PRACTICE GAME MODE
// ==========================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { CONFIG, GameState } from '../utils/constants.js';
import { Terrain } from './terrain.js';
import { InputHandler } from './input.js';
import { Player } from '../entities/player.js';
import { Dummy } from '../entities/dummy.js';
import { UIManager } from '../ui/ui-manager.js';

export class PracticeGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        this.gameState = GameState.MENU;
        this.terrain = null;
        this.input = null;
        this.uiManager = null;
        
        this.player = null;
        this.dummy = null;
        this.projectiles = [];
        
        this.init();
    }
    
    init() {
        // Setup Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 80);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        window.gameCamera = this.camera;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;
        dirLight.shadow.camera.left = -50;
        dirLight.shadow.camera.right = 50;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = -50;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);
        
        // Create terrain
        this.terrain = new Terrain(this.scene);
        this.terrain.create();
        
        // Setup input
        this.input = new InputHandler(this.camera, this.terrain.getGroundPlane());
        this.setupInputCallbacks();
        
        // Setup UI Manager (customized for practice mode)
        this.uiManager = new PracticeUIManager(this.scene, this.camera);
        
        // Window resize
        window.addEventListener('resize', () => this.onResize());
        
        // Start loop
        this.animate();
    }
    
    setupInputCallbacks() {
        // Attack key pressed
        this.input.onAttackKey = (key) => {
            if (this.gameState !== GameState.PLAYING) return;
            
            if (!this.player || !this.player.isAlive) return;
            
            const attackIndex = parseInt(key) - 1;
            if (attackIndex >= this.player.attacks.length) return;
            
            const attack = this.player.attacks[attackIndex];
            
            if (!attack.canUse()) return;
            
            // Select attack and show preview
            if (this.player.selectAttack(attackIndex)) {
                attack.createPreview(this.player, this.input.getMousePosition(), this.scene);
                this.uiManager.showAttackPreviewNotification(attack.name);
                this.uiManager.updateAttackSelection(attackIndex);
            }
        };
        
        // Deselect attack
        this.input.onDeselect = () => {
            if (this.player) {
                this.player.deselectAttack();
                this.uiManager.updateAttackSelection(-1);
                this.uiManager.hideAttackPreviewNotification();
            }
        };
        
        // Mouse click - execute attack
        this.input.onMouseClick = (targetPos) => {
            if (this.gameState !== GameState.PLAYING) return;
            
            if (!this.player || !this.player.isAlive) return;
            
            if (this.player.selectedAttack) {
                // Create target array that includes the dummy
                const targets = [this.dummy];
                
                const success = this.player.executeSelectedAttack(
                    targetPos,
                    this.scene,
                    targets,
                    this.terrain.getObstacles(),
                    this.clock.getDelta(),
                    (proj) => this.projectiles.push(proj)
                );
                
                if (success) {
                    this.uiManager.updateAttackSelection(-1);
                    this.uiManager.hideAttackPreviewNotification();
                }
            }
        };
        
        // Mouse move - update preview
        this.input.onMouseMove = (position) => {
            if (this.player && this.player.selectedAttack) {
                this.player.updateAttackPreview(position);
            }
        };
    }
    
    start(selectedPokemon) {
        // Create player
        this.player = new Player(selectedPokemon, 1, false, 0);
        this.player.addToScene(this.scene);
        this.player.position.set(0, 0, -10);
        this.player.mesh.position.copy(this.player.position);
        
        // Create dummy
        this.dummy = new Dummy(this.scene, new THREE.Vector3(0, 0, 10));
        
        // Setup damage callbacks
        this.player.onDamageTaken = (amount, damagedPlayer) => {
            this.uiManager.showDamage(amount, damagedPlayer.position.clone().add(new THREE.Vector3(0, 2, 0)));
        };

        this.dummy.onDamageTaken = (amount, dummy) => {
            this.uiManager.showDamage(amount, dummy.position.clone().add(new THREE.Vector3(0, 2, 0)));
        };

        this.dummy.onDamageTaken = (amount, dummy) => {
            this.uiManager.showDamage(amount, dummy.position.clone().add(new THREE.Vector3(0, 2, 0)));
        };
        
        // Setup UI
        this.uiManager.setPlayer(this.player, this.dummy);
        this.uiManager.createAttackBar(this.player);
        
        this.gameState = GameState.PLAYING;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        if (this.gameState === GameState.PLAYING) {
            this.update(delta);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    update(delta) {
        // Update player
        if (this.player && this.player.isAlive) {
            this.player.update(delta, [this.player], this.terrain.getObstacles(), this.scene);
        }
        
        // Update dummy
        if (this.dummy) {
            this.dummy.update(delta);
        }
        
        // Update projectiles
        this.updateProjectiles(delta);
        
        // Update camera
        this.updateCamera();
        
        // Update UI
        this.uiManager.update();
        
        // Update player movement
        this.updatePlayerMovement();
    }
    
    updateProjectiles(delta) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            // Move projectile
            proj.mesh.position.add(proj.velocity.clone().multiplyScalar(delta));
            
            // Rotate leaf
            if (proj.isLeaf) {
                proj.mesh.rotation.z += proj.rotationSpeed * delta;
            }
            
            // Check collision with obstacles
            let hitObstacle = false;
            for (let obstacle of this.terrain.getObstacles()) {
                const radius = obstacle.userData.radius || 1;
                const dist = proj.mesh.position.distanceTo(obstacle.position);
                if (dist < radius + 0.5) {
                    hitObstacle = true;
                    break;
                }
            }
            
            // Check bounds
            const limit = CONFIG.ARENA_SIZE / 2;
            if (Math.abs(proj.mesh.position.x) > limit || Math.abs(proj.mesh.position.z) > limit) {
                hitObstacle = true;
            }
            
            if (hitObstacle) {
                this.scene.remove(proj.mesh);
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Check collision with dummy
            if (this.dummy) {
                const dist = proj.mesh.position.distanceTo(this.dummy.position);
                if (dist < 1.5) {
                    this.dummy.takeDamage(proj.damage, proj.owner);
                    this.scene.remove(proj.mesh);
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }
        }
    }
    
    updateCamera() {
        if (!this.player || !this.player.isAlive) return;
        
        const offset = new THREE.Vector3(0, CONFIG.CAMERA_HEIGHT, CONFIG.CAMERA_DISTANCE);
        const targetPos = this.player.position.clone().add(offset);
        this.camera.position.lerp(targetPos, 0.1);
        this.camera.lookAt(this.player.position);
    }
    
    updatePlayerMovement() {
        if (!this.player || !this.player.isAlive || this.player.isLocked) return;

        const moveVector = this.input.getMovementVector();
        const moveSpeed = this.player.moveSpeed || CONFIG.MOVE_SPEED;

        let worldMove = new THREE.Vector3();

        if (moveVector.length() > 0) {
            const cameraForward = new THREE.Vector3();
            this.camera.getWorldDirection(cameraForward);
            cameraForward.y = 0;
            cameraForward.normalize();

            const cameraRight = new THREE.Vector3();
            cameraRight.crossVectors(cameraForward, new THREE.Vector3(0,1,0));

            worldMove
                .addScaledVector(cameraForward, moveVector.z)
                .addScaledVector(cameraRight, moveVector.x);

            const pushOut = this.terrain.getCollisionPushVector(this.player.position);
            if (pushOut.length() > 0) {
                this.player.velocity.copy(pushOut).multiplyScalar(100);
            } else {
                const newPos = this.player.position.clone().add(worldMove.clone().multiplyScalar(0.016));

                if (!this.terrain.checkObstacleCollision(newPos)) {
                    this.player.velocity.copy(worldMove).multiplyScalar(moveSpeed);
                } else {
                    const slideX = new THREE.Vector3(worldMove.x, 0, 0);
                    const slideZ = new THREE.Vector3(0, 0, worldMove.z);

                    const testPosX = this.player.position.clone().add(slideX.clone().multiplyScalar(0.016));
                    const blockedX = this.terrain.checkObstacleCollision(testPosX);

                    const testPosZ = this.player.position.clone().add(slideZ.clone().multiplyScalar(0.016));
                    const blockedZ = this.terrain.checkObstacleCollision(testPosZ);

                    if (!blockedX && Math.abs(worldMove.x) > 0.01) {
                        this.player.velocity.x = worldMove.x * moveSpeed;
                        this.player.velocity.z = 0;
                    } else if (!blockedZ && Math.abs(worldMove.z) > 0.01) {
                        this.player.velocity.x = 0;
                        this.player.velocity.z = worldMove.z * moveSpeed;
                    }
                }
            }
        }

        if (!this.player.rotationLocked) {
            if (this.player.selectedAttack || this.player.isAttacking) {
                const toMouse = this.input.getMousePosition().sub(this.player.position);
                this.player.rotation = Math.atan2(toMouse.x, toMouse.z);
            } else if (worldMove.length() > 0) {
                this.player.rotation = Math.atan2(worldMove.x, worldMove.z);
            }
        }
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    cleanup() {
        if (this.player) {
            this.player.cleanup(this.scene);
        }
        if (this.dummy) {
            this.dummy.cleanup();
        }
        this.projectiles.forEach(proj => this.scene.remove(proj.mesh));
        this.projectiles = [];
    }
}

// ==========================================
// PRACTICE UI MANAGER (Simplified for practice mode)
// ==========================================

import { TeamColors } from '../utils/constants.js';
import { DamageNumbers } from '../ui/damage-numbers.js';
import { formatCooldown } from '../utils/helpers.js';
import { pokemonRegistry } from '../pokemon/pokemon-registry.js';

class PracticeUIManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.player = null;
        this.dummy = null;
        this.damageNumbers = new DamageNumbers(scene, camera);
    }

    setPlayer(player, dummy) {
        this.player = player;
        this.dummy = dummy;
        this.createHealthBars();
    }

    createHealthBars() {
        const container = document.getElementById('health-bars');
        container.innerHTML = '';

        if (this.player) {
            const bar = document.createElement('div');
            bar.className = 'health-bar self';
            bar.id = 'hp-bar-player';

            const pokemonData = pokemonRegistry.get(this.player.pokemonId);

            bar.innerHTML = `
                <div class="team-indicator" style="background: ${TeamColors[1]}; color: #fff">1</div>
                <div class="health-bar-name">${pokemonData ? pokemonData.name : this.player.pokemonId}</div>
                <div class="health-bar-outer">
                    <div class="health-bar-inner high" style="width: 100%"></div>
                </div>
                <div class="health-bar-hp">40/40</div>
            `;

            container.appendChild(bar);
        }

        if (this.dummy) {
            const bar = document.createElement('div');
            bar.className = 'health-bar';
            bar.id = 'hp-bar-dummy';

            bar.innerHTML = `
                <div class="team-indicator" style="background: #888; color: #fff">T</div>
                <div class="health-bar-name">Training Dummy</div>
                <div class="health-bar-outer">
                    <div class="health-bar-inner high" style="width: 100%"></div>
                </div>
                <div class="health-bar-hp">40/40</div>
            `;

            container.appendChild(bar);
        }
    }
    
    createAttackBar(player) {
        const container = document.getElementById('attack-bar');
        container.innerHTML = '';
        
        player.attacks.forEach((attack, index) => {
            const slot = document.createElement('div');
            slot.className = 'attack-slot';
            slot.id = `attack-slot-${index}`;
            slot.dataset.index = index;
            slot.dataset.key = attack.keyBinding;
            
            slot.innerHTML = `
                <div class="attack-key">${attack.keyBinding}</div>
                <div class="attack-icon">${attack.icon}</div>
                <div class="attack-name">${attack.name}</div>
                <div class="attack-cooldown-overlay"></div>
                <div class="attack-cooldown-text"></div>
            `;
            
            container.appendChild(slot);
        });
        
        this.updateAttackSelection(player.selectedAttackIndex);
    }
    
    updateAttackSelection(selectedIndex) {
        document.querySelectorAll('.attack-slot').forEach((slot, index) => {
            if (index === selectedIndex) {
                slot.classList.add('selected');
            } else {
                slot.classList.remove('selected');
            }
        });
    }
    
    update() {
        this.updateHealthBars();
        this.updateAttackBar();
        this.damageNumbers.update(0.016);
    }
    
    updateHealthBars() {
        // Update player HP bar
        if (this.player) {
            const bar = document.getElementById('hp-bar-player');
            if (bar) {
                const fill = bar.querySelector('.health-bar-inner');
                const hpText = bar.querySelector('.health-bar-hp');
                const ratio = this.player.hp / this.player.maxHp;
                
                fill.style.width = `${ratio * 100}%`;
                fill.className = 'health-bar-inner';
                if (ratio > 0.6) fill.classList.add('high');
                else if (ratio > 0.3) fill.classList.add('medium');
                else fill.classList.add('low');
                
                hpText.textContent = `${Math.ceil(this.player.hp)}/${this.player.maxHp}`;
                
                if (!this.player.isAlive) {
                    bar.style.opacity = '0.3';
                }
            }
        }
        
        // Update dummy HP bar
        if (this.dummy) {
            const bar = document.getElementById('hp-bar-dummy');
            if (bar) {
                const fill = bar.querySelector('.health-bar-inner');
                const hpText = bar.querySelector('.health-bar-hp');
                const ratio = this.dummy.hp / this.dummy.maxHp;
                
                fill.style.width = `${ratio * 100}%`;
                fill.className = 'health-bar-inner';
                if (ratio > 0.6) fill.classList.add('high');
                else if (ratio > 0.3) fill.classList.add('medium');
                else fill.classList.add('low');
                
                hpText.textContent = `${Math.ceil(this.dummy.hp)}/${this.dummy.maxHp}`;
            }
        }
    }
    
    updateAttackBar() {
        if (!this.player) return;
        
        this.player.attacks.forEach((attack, index) => {
            const slot = document.getElementById(`attack-slot-${index}`);
            if (slot) {
                const overlay = slot.querySelector('.attack-cooldown-overlay');
                const text = slot.querySelector('.attack-cooldown-text');
                
                if (attack.currentCooldown > 0) {
                    const pct = (attack.currentCooldown / attack.cooldown) * 100;
                    overlay.style.height = `${pct}%`;
                    text.textContent = formatCooldown(attack.currentCooldown);
                    slot.classList.add('on-cooldown');
                } else {
                    overlay.style.height = '0%';
                    text.textContent = '';
                    slot.classList.remove('on-cooldown');
                }
            }
        });
    }
    
    showDamage(amount, position, isCritical = false) {
        this.damageNumbers.showDamage(amount, position, isCritical);
    }
    
    showAttackPreviewNotification(attackName) {
        const notif = document.getElementById('attack-preview-notification');
        notif.textContent = `${attackName} - Click to cast`;
        notif.classList.add('visible');
        
        setTimeout(() => {
            notif.classList.remove('visible');
        }, 2000);
    }
    
    hideAttackPreviewNotification() {
        const notif = document.getElementById('attack-preview-notification');
        notif.classList.remove('visible');
    }
}
