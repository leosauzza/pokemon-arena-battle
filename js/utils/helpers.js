// ==========================================
// HELPER FUNCTIONS
// ==========================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

/**
 * Check if there's an obstacle between two points
 */
export function checkObstacleBetween(startPos, targetPos, obstacles) {
    if (!obstacles || !Array.isArray(obstacles)) return false;
    
    const direction = targetPos.clone().sub(startPos);
    const dist = direction.length();
    direction.normalize();
    
    const raycaster = new THREE.Raycaster(
        startPos.clone().add(new THREE.Vector3(0, 0.5, 0)),
        direction,
        0,
        dist
    );
    
    const obstacleMeshes = [];
    obstacles.forEach(obs => {
        if (obs.isGroup) {
            obs.traverse(child => {
                if (child.isMesh) obstacleMeshes.push(child);
            });
        } else if (obs.isMesh) {
            obstacleMeshes.push(obs);
        }
    });
    
    const intersects = raycaster.intersectObjects(obstacleMeshes);
    return intersects.length > 0;
}

/**
 * Check collision with obstacles at a position
 */
export function checkObstacleCollision(pos, obstacles) {
    if (!obstacles || !Array.isArray(obstacles)) return false;
    for (let obstacle of obstacles) {
        if (obstacle.userData.isBoundary) continue;
        const radius = obstacle.userData.radius || 1;
        const dist = pos.distanceTo(obstacle.position);
        if (dist < radius + 0.5) return true;
    }
    return false;
}

/**
 * Get closest point on a line segment
 */
export function closestPointOnLine(point, lineStart, lineEnd) {
    const lineDir = lineEnd.clone().sub(lineStart);
    const lineLengthSq = lineDir.lengthSq();
    
    if (lineLengthSq === 0) return lineStart;
    
    const t = Math.max(0, Math.min(1, point.clone().sub(lineStart).dot(lineDir) / lineLengthSq));
    return lineStart.clone().add(lineDir.multiplyScalar(t));
}

/**
 * Get forward vector from rotation
 */
export function getForwardVector(rotation) {
    return new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
}

/**
 * Get distance from point to line segment
 */
export function distanceToLine(point, lineStart, lineEnd) {
    const closest = closestPointOnLine(point, lineStart, lineEnd);
    return point.distanceTo(closest);
}

/**
 * Check if point is in cone
 */
export function isPointInCone(point, coneOrigin, coneDirection, coneLength, coneAngle) {
    const toPoint = point.clone().sub(coneOrigin);
    const dist = toPoint.length();
    toPoint.normalize();
    
    const angle = coneDirection.angleTo(toPoint);
    
    return dist < coneLength && angle < coneAngle;
}

/**
 * Easing functions
 */
export const Easing = {
    linear: t => t,
    easeOutQuad: t => t * (2 - t),
    easeInQuad: t => t * t,
    easeOutCubic: t => (--t) * t * t + 1
};

/**
 * Format time in seconds to display string
 */
export function formatCooldown(seconds) {
    if (seconds <= 0) return '';
    if (seconds < 1) return seconds.toFixed(1);
    return Math.ceil(seconds).toString();
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
