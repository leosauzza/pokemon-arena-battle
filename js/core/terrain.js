// ==========================================
// TERRAIN / ARENA MANAGER
// ==========================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { CONFIG } from '../utils/constants.js';

export class Terrain {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.groundPlane = null;
    }
    
    create() {
        this.createGround();
        this.createRocks();
        this.createTrees();
        this.createBoundaries();
    }
    
    createGround() {
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(CONFIG.ARENA_SIZE, CONFIG.ARENA_SIZE);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x7cb342 });
        this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
        this.groundPlane.rotation.x = -Math.PI / 2;
        this.groundPlane.receiveShadow = true;
        this.scene.add(this.groundPlane);
        
        // Grid helper for visual reference
        const gridHelper = new THREE.GridHelper(CONFIG.ARENA_SIZE, 20, 0x555555, 0x888888);
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);
    }
    
    createRocks() {
        const rockGeometry = new THREE.DodecahedronGeometry(1.5);
        const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        
        for (let i = 0; i < 8; i++) {
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            const angle = Math.random() * Math.PI * 2;
            const distance = 10 + Math.random() * 15;
            rock.position.set(
                Math.cos(angle) * distance,
                0.75,
                Math.sin(angle) * distance
            );
            rock.scale.setScalar(0.8 + Math.random() * 0.6);
            rock.castShadow = true;
            rock.receiveShadow = true;
            rock.userData = { type: 'obstacle', radius: 1.5 };
            this.scene.add(rock);
            this.obstacles.push(rock);
        }
    }
    
    createTrees() {
        const treeTrunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 2, 8);
        const treeTrunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const treeLeavesGeometry = new THREE.ConeGeometry(2.5, 5, 8);
        const treeLeavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        
        for (let i = 0; i < 6; i++) {
            const treeGroup = new THREE.Group();
            
            const trunk = new THREE.Mesh(treeTrunkGeometry, treeTrunkMaterial);
            trunk.position.y = 1;
            trunk.castShadow = true;
            treeGroup.add(trunk);
            
            const leaves = new THREE.Mesh(treeLeavesGeometry, treeLeavesMaterial);
            leaves.position.y = 4;
            leaves.castShadow = true;
            treeGroup.add(leaves);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 12 + Math.random() * 12;
            treeGroup.position.set(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            );
            
            treeGroup.userData = { type: 'obstacle', radius: 1.5 };
            this.scene.add(treeGroup);
            this.obstacles.push(treeGroup);
        }
    }
    
    createBoundaries() {
        // Add arena boundaries (invisible walls)
        const boundaryGeometry = new THREE.BoxGeometry(CONFIG.ARENA_SIZE, 5, 2);
        const boundaryMaterial = new THREE.MeshBasicMaterial({ visible: false });
        
        for (let i = 0; i < 4; i++) {
            const boundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
            const angle = (i / 4) * Math.PI * 2;
            boundary.position.set(
                Math.cos(angle) * CONFIG.ARENA_SIZE / 2,
                2.5,
                Math.sin(angle) * CONFIG.ARENA_SIZE / 2
            );
            boundary.rotation.y = angle + Math.PI / 2;
            boundary.userData = { type: 'obstacle', radius: 1, isBoundary: true };
            this.scene.add(boundary);
            this.obstacles.push(boundary);
        }
    }
    
    getObstacles() {
        return this.obstacles;
    }
    
    getGroundPlane() {
        return this.groundPlane;
    }
    
    checkObstacleCollision(pos) {
        for (let obstacle of this.obstacles) {
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
    getCollisionPushVector(pos) {
        let pushVector = new THREE.Vector3();
        let collisionCount = 0;
        
        for (let obstacle of this.obstacles) {
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
}
