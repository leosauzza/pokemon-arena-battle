// ==========================================
// GRASS ATTACKS
// ==========================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { Attack } from '../attack-base.js';
import { AttackType } from '../../utils/constants.js';
import { checkObstacleBetween, getForwardVector, closestPointOnLine } from '../../utils/helpers.js';
import { attackRegistry } from '../attack-registry.js';

export class VineWhipAttack extends Attack {
    constructor(config = {}) {
        super(config);
    }

    createPreview(player, targetPos) {
        const geometry = new THREE.CylinderGeometry(0.2, 0.2, this.range, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0x228b22,
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
        if (!scene) {
            console.warn('VineWhipAttack: scene is undefined');
            return false;
        }

        const forward = getForwardVector(player.rotation);

        const vineGeometry = new THREE.CylinderGeometry(0.1, 0.1, this.range, 8);
        const vineMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        const vine = new THREE.Mesh(vineGeometry, vineMaterial);
        vine.rotation.x = Math.PI / 2;
        vine.position.z = this.range / 2;
        player.mesh.add(vine);

        const hitEnd = player.position.clone().add(forward.clone().multiplyScalar(this.range));

        setTimeout(() => player.mesh.remove(vine), 300);

        if (players && Array.isArray(players)) {
            for (let p of players) {
                if (p !== player && p.isAlive && p.team !== player.team) {
                    const closestPoint = closestPointOnLine(p.position, player.position, hitEnd);
                    const dist = p.position.distanceTo(closestPoint);

                    if (dist < 1.5) {
                        if (!checkObstacleBetween(player.position, p.position, obstacles)) {
                            p.takeDamage(this.damage);
                        }
                    }
                }
            }
        }

        return true;
    }
}

export class SolarBeamAttack extends Attack {
    constructor(config = {}) {
        super(config);

        this.chargeTime = 1.5;
        this.beamWidth = 1;
    }

    createPreview(player, targetPos) {
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, this.range, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.2
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
        if (!scene) {
            console.warn('SolarBeamAttack: scene is undefined');
            return false;
        }

        player.isLocked = true;
        player.rotationLocked = true;

        const initialRotation = player.rotation;

        const chargeGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const chargeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.7
        });
        const charge = new THREE.Mesh(chargeGeometry, chargeMaterial);
        charge.position.set(0, 1.5, 2);
        player.mesh.add(charge);

        let scale = 1;
        const chargeInterval = setInterval(() => {
            scale += 0.1;
            charge.scale.setScalar(scale);
            charge.material.opacity -= 0.03;
        }, 50);

        setTimeout(() => {
            clearInterval(chargeInterval);
            player.mesh.remove(charge);

            const forward = getForwardVector(initialRotation);

            const beamGeometry = new THREE.CylinderGeometry(this.beamWidth, this.beamWidth, this.range, 16);
            const beamMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.8
            });
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            beam.rotation.x = Math.PI / 2;
            beam.position.copy(player.position).add(forward.clone().multiplyScalar(this.range / 2));
            beam.position.y = 1;
            beam.rotation.y = initialRotation;
            scene.add(beam);

            if (players && Array.isArray(players)) {
                for (let p of players) {
                    if (p !== player && p.isAlive && p.team !== player.team) {
                        const toPlayer = p.position.clone().sub(player.position);
                        const projection = toPlayer.dot(forward);
                        const closestPoint = player.position.clone().add(forward.clone().multiplyScalar(projection));
                        const distToLine = p.position.distanceTo(closestPoint);

                        if (projection > 0 && projection < this.range && distToLine < this.beamWidth + 0.5) {
                            if (!checkObstacleBetween(player.position, p.position, obstacles)) {
                                p.takeDamage(this.damage);
                            }
                        }
                    }
                }
            }

            setTimeout(() => scene.remove(beam), 500);

            player.isLocked = false;
            player.rotationLocked = false;
        }, this.chargeTime * 1000);

        return true;
    }
}

export class RazorLeafAttack extends Attack {
    constructor(config = {}) {
        super(config);

        this.duration = 1.5;
        this.leafInterval = null;
    }

    createPreview(player, targetPos) {
        const spread = 3;
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 0, 0,
            -spread, 0, this.range,
            spread, 0, this.range
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        const material = new THREE.MeshBasicMaterial({
            color: 0x228b22,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });

        this.previewMesh = new THREE.Mesh(geometry, material);
        this.previewMesh.position.y = 0.05;

        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x33aa33, transparent: true, opacity: 0.5 }));
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

    performAttack(player, targetPos, scene, players, obstacles, deltaTime, onProjectileCreate) {
        if (!scene) {
            console.warn('RazorLeafAttack: scene is undefined');
            return false;
        }

        player.isLocked = true;

        const startTime = Date.now();

        this.leafInterval = setInterval(() => {
            if (!player.isAlive) {
                clearInterval(this.leafInterval);
                player.isLocked = false;
                return;
            }

            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed >= this.duration) {
                clearInterval(this.leafInterval);
                player.isLocked = false;
                return;
            }

            const spread = (Math.random() - 0.5) * 0.5;
            const forward = new THREE.Vector3(spread, 0, 1).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation);

            const leafGeometry = new THREE.PlaneGeometry(0.3, 0.3);
            const leafMaterial = new THREE.MeshBasicMaterial({
                color: 0x228b22,
                side: THREE.DoubleSide
            });
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            leaf.position.copy(player.position).add(forward.clone().multiplyScalar(1.5));
            leaf.position.y = 1 + Math.random() * 0.5;
            leaf.rotation.z = Math.random() * Math.PI;
            scene.add(leaf);

            const projData = {
                mesh: leaf,
                velocity: forward.clone().multiplyScalar(20),
                owner: player,
                damage: this.damage,
                type: 'razorleaf',
                isLeaf: true,
                rotationSpeed: (Math.random() - 0.5) * 10
            };

            if (onProjectileCreate) {
                onProjectileCreate(projData);
            }
        }, 100);

        return true;
    }

    cleanup(scene) {
        super.cleanup(scene);
        if (this.leafInterval) {
            clearInterval(this.leafInterval);
            this.leafInterval = null;
        }
    }

    onCancel(player) {
        player.isLocked = false;
    }
}

attackRegistry.register('vinewhip', VineWhipAttack);
attackRegistry.register('solarbeam', SolarBeamAttack);
attackRegistry.register('razorleaf', RazorLeafAttack);
