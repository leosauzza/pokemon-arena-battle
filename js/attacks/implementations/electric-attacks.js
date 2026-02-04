// ==========================================
// ELECTRIC ATTACKS
// ==========================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { Attack } from '../attack-base.js';
import { AttackType } from '../../utils/constants.js';
import { checkObstacleBetween, checkObstacleCollision, getForwardVector } from '../../utils/helpers.js';
import { attackRegistry } from '../attack-registry.js';

export class QuickAttack extends Attack {
    constructor(config = {}) {
        super(config);

        this.dashDistance = 10;
        this.dashSpeed = 35;
    }

    createPreview(player, targetPos) {
        const geometry = new THREE.ConeGeometry(0.5, this.dashDistance, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.2
        });

        this.previewMesh = new THREE.Mesh(geometry, material);
        this.previewMesh.rotation.x = -Math.PI / 2;
        this.previewMesh.position.z = this.dashDistance / 2;
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
            console.warn('QuickAttack: scene is undefined');
            return false;
        }

        const forward = getForwardVector(player.rotation);
        const startPos = player.position.clone();

        const trailGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.5
        });

        let distance = 0;

        const dashInterval = setInterval(() => {
            if (!player.isAlive) {
                clearInterval(dashInterval);
                return;
            }

            const moveStep = forward.clone().multiplyScalar(this.dashSpeed * 0.05);
            const newPos = player.position.clone().add(moveStep);

            if (checkObstacleCollision(newPos, obstacles)) {
                clearInterval(dashInterval);
                return;
            }

            player.position.copy(newPos);
            distance = startPos.distanceTo(player.position);

            const trail = new THREE.Mesh(trailGeometry, trailMaterial);
            trail.position.copy(player.position);
            trail.position.y = 0.5;
            scene.add(trail);
            setTimeout(() => scene.remove(trail), 300);

            if (players && Array.isArray(players)) {
                for (let p of players) {
                    if (p !== player && p.isAlive && p.team !== player.team) {
                        if (player.position.distanceTo(p.position) < 1.5) {
                            p.takeDamage(this.damage);
                        }
                    }
                }
            }

            if (distance >= this.dashDistance) {
                clearInterval(dashInterval);
            }
        }, 50);

        return true;
    }
}

export class ThunderboltAttack extends Attack {
    constructor(config = {}) {
        super(config);

        this.explosionRadius = 3;
    }

    createPreview(player, targetPos, scene) {
        const ringGeometry = new THREE.RingGeometry(this.range - 0.2, this.range + 0.2, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });

        this.previewMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        this.previewMesh.rotation.x = -Math.PI / 2;
        this.previewMesh.position.copy(player.position);
        scene.add(this.previewMesh);

        const targetGeometry = new THREE.RingGeometry(1, 1.2, 32);
        const targetMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });

        this.targetPreview = new THREE.Mesh(targetGeometry, targetMaterial);
        this.targetPreview.rotation.x = -Math.PI / 2;
        this.targetPreview.position.copy(targetPos);
        this.targetPreview.position.y = 0.1;
        scene.add(this.targetPreview);

        return this.previewMesh;
    }

    updatePreviewPosition(player, targetPos) {
        if (this.targetPreview) {
            const toTarget = targetPos.clone().sub(player.position);
            const dist = toTarget.length();

            if (dist > this.range) {
                toTarget.normalize().multiplyScalar(this.range);
                const clampedPos = player.position.clone().add(toTarget);
                this.targetPreview.position.set(clampedPos.x, 0.1, clampedPos.z);
            } else {
                this.targetPreview.position.set(targetPos.x, 0.1, targetPos.z);
            }
        }
    }

    removePreview(scene) {
        if (this.previewMesh) {
            scene.remove(this.previewMesh);
            this.previewMesh = null;
        }
        if (this.targetPreview) {
            scene.remove(this.targetPreview);
            this.targetPreview = null;
        }
    }

    performAttack(player, targetPos, scene, players, obstacles, deltaTime) {
        if (!scene) {
            console.warn('ThunderboltAttack: scene is undefined');
            return false;
        }
        if (!targetPos) {
            console.warn('ThunderboltAttack: targetPos is undefined');
            return false;
        }

        const toTarget = targetPos.clone().sub(player.position);
        const dist = toTarget.length();
        let finalTarget = targetPos.clone();

        if (dist > this.range) {
            toTarget.normalize().multiplyScalar(this.range);
            finalTarget = player.position.clone().add(toTarget);
        }

        const ballGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const ball = new THREE.Mesh(ballGeometry, ballMaterial);
        ball.position.copy(player.position);
        ball.position.y = 1.5;
        scene.add(ball);

        const startPos = ball.position.clone();
        const duration = 300;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            ball.position.lerpVectors(startPos, finalTarget, progress);
            ball.position.y = 1.5 + Math.sin(progress * Math.PI) * 2;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                scene.remove(ball);
                this.createExplosion(finalTarget, scene);

                for (let p of players) {
                    if (p !== player && p.isAlive && p.team !== player.team) {
                        if (finalTarget.distanceTo(p.position) < this.explosionRadius) {
                            if (!checkObstacleBetween(player.position, p.position, obstacles)) {
                                p.takeDamage(this.damage);
                            }
                        }
                    }
                }
            }
        };
        animate();

        return true;
    }

    createExplosion(position, scene) {
        const explosionGeometry = new THREE.SphereGeometry(this.explosionRadius, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        scene.add(explosion);

        for (let i = 0; i < 6; i++) {
            const boltGeometry = new THREE.CylinderGeometry(0.05, 0.05, 4, 4);
            const boltMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
            bolt.position.copy(position);
            bolt.rotation.z = Math.random() * Math.PI;
            bolt.rotation.x = Math.random() * Math.PI;
            scene.add(bolt);

            setTimeout(() => scene.remove(bolt), 300);
        }

        let scale = 1;
        const animate = () => {
            scale += 0.3;
            explosion.scale.setScalar(scale);
            explosion.material.opacity -= 0.05;

            if (explosion.material.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                scene.remove(explosion);
            }
        };
        animate();
    }
}

attackRegistry.register('quickattack', QuickAttack);
attackRegistry.register('thunderbolt', ThunderboltAttack);
