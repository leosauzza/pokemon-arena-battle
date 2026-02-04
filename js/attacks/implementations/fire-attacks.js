// ==========================================
// FIRE ATTACKS
// ==========================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { Attack } from '../attack-base.js';
import { AttackType } from '../../utils/constants.js';
import { checkObstacleBetween, getForwardVector } from '../../utils/helpers.js';
import { attackRegistry } from '../attack-registry.js';

export class FlamethrowerAttack extends Attack {
    constructor(config = {}) {
        super(config);

        this.duration = 3;
        this.coneAngle = Math.PI / 6;
        this.channelInterval = null;
        this.isActive = false;
    }

    createPreview(player, targetPos) {
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 0, 0,
            -4, 0, 8,
            4, 0, 8
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
        this.previewMesh.position.y = 0.05;

        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.6 }));
        line.position.y = 0.02;
        this.previewMesh.add(line);

        player.mesh.add(this.previewMesh);
        return this.previewMesh;
    }

    updatePreviewPosition(player, targetPos) {
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

        if (this.channelInterval) {
            clearInterval(this.channelInterval);
            this.channelInterval = null;
        }

        this.isActive = true;
        const self = this;
        const startTime = Date.now();

        player.isAttacking = true;

        const fireGeometry = new THREE.BufferGeometry();
        const range = self.range;
        const halfWidth = 4;
        const fireVertices = new Float32Array([
            0, 0, 0,
            -halfWidth, 0, range,
            halfWidth, 0, range
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

        this.channelInterval = setInterval(() => {
            if (!self.isActive || !player.isAlive) {
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
                                    p.takeDamage(self.damage * 0.1);
                                }
                            }
                        }
                    }
                }
            }

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

    onCancel(player) {
        this.isActive = false;
        player.isAttacking = false;
        if (this.channelInterval) {
            clearInterval(this.channelInterval);
            this.channelInterval = null;
        }
    }
}

export class ScratchAttack extends Attack {
    constructor(config = {}) {
        super(config);
    }

    createPreview(player, targetPos) {
        const geometry = new THREE.BufferGeometry();
        const range = this.range;
        const halfAngle = Math.PI / 4;
        const leftX = -Math.sin(halfAngle) * range;
        const leftZ = Math.cos(halfAngle) * range;
        const rightX = Math.sin(halfAngle) * range;
        const rightZ = Math.cos(halfAngle) * range;

        const vertices = new Float32Array([
            0, 0, 0,
            leftX, 0, leftZ,
            rightX, 0, rightZ
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

        for (let p of players) {
            if (p !== player && p.isAlive && p.team !== player.team) {
                const dist = player.position.distanceTo(p.position);
                const toPlayer = p.position.clone().sub(player.position).normalize();
                const angle = forward.angleTo(toPlayer);

                if (dist < this.range && angle < Math.PI / 4) {
                    if (!checkObstacleBetween(player.position, p.position, obstacles)) {
                        p.takeDamage(this.damage);

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

attackRegistry.register('flamethrower', FlamethrowerAttack);
attackRegistry.register('scratch', ScratchAttack);
