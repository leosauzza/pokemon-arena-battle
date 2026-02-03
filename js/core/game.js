// ==========================================
// MAIN GAME ENGINE
// ==========================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { GameState, CONFIG } from '../utils/constants.js';
import { Terrain } from './terrain.js';
import { InputHandler } from './input.js';
import { Player } from '../entities/player.js';
import { UIManager } from '../ui/ui-manager.js';
import { checkObstacleCollision } from '../utils/helpers.js';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        this.gameState = GameState.MENU;
        this.terrain = null;
        this.input = null;
        this.uiManager = null;
        
        this.players = [];
        this.projectiles = [];
        
        // Player configuration from menu
        this.selectedPokemon = null;
        this.pokemonTeams = {
            charmander: 1,
            bulbasaur: 2,
            squirtle: 3,
            pikachu: 4
        };
        
        this.init();
    }
    
    init() {
        // Check if running via file:// protocol
        if (window.location.protocol === 'file:') {
            console.error('❌ ERROR: Cannot run via file:// protocol');
            console.error('   ES modules require a web server to work properly.');
            console.error('   Please use one of these commands:');
            console.error('   • ./start-server.sh');
            console.error('   • python3 server.py');
            console.error('   • python3 -m http.server 8123');
            alert('Please run via web server!\n\nUse: ./start-server.sh\nOr: python3 server.py\n\nSee README.md for more info.');
        }
        
        // Setup Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 80);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        window.gameCamera = this.camera; // For HP bar facing
        
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
        
        // Setup UI Manager
        this.uiManager = new UIManager(this.scene, this.camera);
        
        // Window resize
        window.addEventListener('resize', () => this.onResize());
        
        // Start loop
        this.animate();
    }
    
    setupInputCallbacks() {
        // Attack key pressed
        this.input.onAttackKey = (key) => {
            if (this.gameState !== GameState.PLAYING) return;
            
            const player = this.getPlayer();
            if (!player || !player.isAlive) return;
            
            const attackIndex = parseInt(key) - 1;
            if (attackIndex >= player.attacks.length) return;
            
            const attack = player.attacks[attackIndex];
            
            if (!attack.canUse()) {
                // Show "on cooldown" feedback
                return;
            }
            
            // Select attack and show preview
            if (player.selectAttack(attackIndex)) {
                // Create preview
                attack.createPreview(player, this.input.getMousePosition(), this.scene);
                
                // Show notification
                this.uiManager.showAttackPreviewNotification(attack.name);
                
                // Update UI
                this.uiManager.updateAttackSelection(attackIndex);
            }
        };
        
        // Deselect attack
        this.input.onDeselect = () => {
            const player = this.getPlayer();
            if (player) {
                player.deselectAttack();
                this.uiManager.updateAttackSelection(-1);
                this.uiManager.hideAttackPreviewNotification();
            }
        };
        
        // Mouse click - execute attack
        this.input.onMouseClick = (targetPos) => {
            if (this.gameState !== GameState.PLAYING) return;
            
            const player = this.getPlayer();
            if (!player || !player.isAlive) return;
            
            if (player.selectedAttack) {
                const success = player.executeSelectedAttack(
                    targetPos,
                    this.scene,
                    this.players,
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
            const player = this.getPlayer();
            if (player && player.selectedAttack) {
                player.updateAttackPreview(position);
            }
        };
    }
    
    start(selectedPokemon, teams) {
        this.selectedPokemon = selectedPokemon;
        this.pokemonTeams = teams;
        
        // Create players
        const pokemonList = ['charmander', 'bulbasaur', 'squirtle', 'pikachu'];
        
        pokemonList.forEach((pokemon, index) => {
            const isPlayer = pokemon === selectedPokemon;
            const team = this.pokemonTeams[pokemon];
            const player = new Player(pokemon, team, !isPlayer, index);
            
            player.addToScene(this.scene);
            
            // Show damage number when this player takes damage
            player.onDamageTaken = (amount, damagedPlayer) => {
                this.uiManager.showDamage(amount, damagedPlayer.position.clone().add(new THREE.Vector3(0, 2, 0)));
                this.checkWinCondition();
            };
            
            this.players.push(player);
        });
        
        // Setup UI
        this.uiManager.setPlayers(this.players);
        
        const player = this.getPlayer();
        if (player) {
            this.uiManager.createAttackBar(player);
        }
        
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
        // Update players
        this.players.forEach(player => {
            player.update(delta, this.players, this.terrain.getObstacles(), this.scene);
        });
        
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
            
            // Check collision with players
            for (let player of this.players) {
                if (player !== proj.owner && player.isAlive && player.team !== proj.owner.team) {
                    const dist = proj.mesh.position.distanceTo(player.position);
                    if (dist < 1) {
                        player.takeDamage(proj.damage, proj.owner);
                        
                        this.scene.remove(proj.mesh);
                        this.projectiles.splice(i, 1);
                        
                        // Check win condition
                        this.checkWinCondition();
                        break;
                    }
                }
            }
        }
    }
    
    updateCamera() {
        const player = this.getPlayer();
        if (!player || !player.isAlive) return;
        
        // Third-person camera
        const offset = new THREE.Vector3(0, CONFIG.CAMERA_HEIGHT, CONFIG.CAMERA_DISTANCE);
        const targetPos = player.position.clone().add(offset);
        this.camera.position.lerp(targetPos, 0.1);
        this.camera.lookAt(player.position);
    }
    
    updatePlayerMovement() {
        const player = this.getPlayer();
        if (!player || !player.isAlive || player.isLocked) return;
        
        const moveVector = this.input.getMovementVector();
        const moveSpeed = CONFIG.MOVE_SPEED;
        
        // Calculate world movement vector (even if not moving, needed for rotation)
        let worldMove = new THREE.Vector3();
        
        if (moveVector.length() > 0) {
            // Transform to camera space
            const cameraForward = new THREE.Vector3();
            this.camera.getWorldDirection(cameraForward);
            cameraForward.y = 0;
            cameraForward.normalize();
            
            const cameraRight = new THREE.Vector3();
            cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0));
            
            worldMove
                .addScaledVector(cameraForward, moveVector.z)
                .addScaledVector(cameraRight, moveVector.x);
            
            // Check if player is currently inside an obstacle
            const pushOut = this.terrain.getCollisionPushVector(player.position);
            if (pushOut.length() > 0) {
                // Player is stuck inside obstacle, push them out first
                player.velocity.copy(pushOut).multiplyScalar(100); // Strong push out
            } else {
                // Normal movement with collision detection
                const newPos = player.position.clone().add(worldMove.clone().multiplyScalar(0.016));
                
                if (!this.terrain.checkObstacleCollision(newPos)) {
                    // No collision, can move freely
                    player.velocity.copy(worldMove).multiplyScalar(moveSpeed);
                } else {
                    // Collision detected - try sliding
                    // Get the collision normal to determine how to slide
                    const slideX = new THREE.Vector3(worldMove.x, 0, 0);
                    const slideZ = new THREE.Vector3(0, 0, worldMove.z);
                    
                    // Try X only
                    const testPosX = player.position.clone().add(slideX.clone().multiplyScalar(0.016));
                    const blockedX = this.terrain.checkObstacleCollision(testPosX);
                    
                    // Try Z only  
                    const testPosZ = player.position.clone().add(slideZ.clone().multiplyScalar(0.016));
                    const blockedZ = this.terrain.checkObstacleCollision(testPosZ);
                    
                    if (!blockedX && Math.abs(worldMove.x) > 0.01) {
                        // Can slide in X direction
                        player.velocity.x = worldMove.x * moveSpeed;
                        player.velocity.z = 0;
                    } else if (!blockedZ && Math.abs(worldMove.z) > 0.01) {
                        // Can slide in Z direction
                        player.velocity.x = 0;
                        player.velocity.z = worldMove.z * moveSpeed;
                    }
                    // If both blocked, player can't move (but can rotate)
                }
            }
        }
        
        // Handle rotation - this should work even when not moving
        if (!player.rotationLocked) {
            if (player.selectedAttack || player.isAttacking) {
                // If has selected attack or is attacking, face mouse
                const toMouse = this.input.getMousePosition().sub(player.position);
                player.rotation = Math.atan2(toMouse.x, toMouse.z);
            } else if (worldMove.length() > 0) {
                // Rotate towards movement direction
                player.rotation = Math.atan2(worldMove.x, worldMove.z);
            }
        }
    }
    
    checkWinCondition() {
        const alivePlayers = this.players.filter(p => p.isAlive);
        const aliveTeams = [...new Set(alivePlayers.map(p => p.team))];
        
        if (aliveTeams.length <= 1) {
            this.endGame(aliveTeams[0]);
        }
    }
    
    endGame(winningTeam) {
        this.gameState = GameState.GAME_OVER;
        
        const player = this.getPlayer();
        const playerWon = player && player.isAlive;
        const winner = this.players.find(p => p.isAlive);
        
        this.uiManager.showGameOver(playerWon, winningTeam, winner);
    }
    
    getPlayer() {
        return this.players.find(p => !p.isAI);
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    cleanup() {
        this.players.forEach(player => player.cleanup(this.scene));
        this.projectiles.forEach(proj => this.scene.remove(proj.mesh));
        this.players = [];
        this.projectiles = [];
    }
}
