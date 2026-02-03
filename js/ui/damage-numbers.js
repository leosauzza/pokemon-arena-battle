// ==========================================
// DAMAGE NUMBERS (League of Legends style)
// ==========================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class DamageNumbers {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.activeNumbers = [];
    }
    
    /**
     * Show damage number at position
     */
    showDamage(amount, position, isCritical = false) {
        // Create DOM element for better text rendering
        const element = document.createElement('div');
        element.className = 'damage-number';
        element.textContent = Math.ceil(amount).toString();
        
        if (isCritical) {
            element.classList.add('critical');
        }
        
        document.getElementById('game-ui').appendChild(element);
        
        const damageData = {
            element: element,
            position: position.clone(),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                3 + Math.random() * 2,
                0
            ),
            life: 1.0,
            startTime: Date.now()
        };
        
        this.activeNumbers.push(damageData);
    }
    
    /**
     * Show healing number
     */
    showHeal(amount, position) {
        const element = document.createElement('div');
        element.className = 'damage-number heal';
        element.textContent = '+' + Math.ceil(amount).toString();
        
        document.getElementById('game-ui').appendChild(element);
        
        const healData = {
            element: element,
            position: position.clone(),
            velocity: new THREE.Vector3(0, 2, 0),
            life: 1.0,
            startTime: Date.now(),
            isHeal: true
        };
        
        this.activeNumbers.push(healData);
    }
    
    /**
     * Update all damage numbers
     */
    update(delta) {
        for (let i = this.activeNumbers.length - 1; i >= 0; i--) {
            const data = this.activeNumbers[i];
            
            // Update physics
            data.velocity.y -= 5 * delta; // Gravity
            data.position.add(data.velocity.clone().multiplyScalar(delta));
            
            // Update life
            data.life -= delta * 1.5;
            
            // Update DOM position
            const screenPos = this.worldToScreen(data.position);
            data.element.style.left = screenPos.x + 'px';
            data.element.style.top = screenPos.y + 'px';
            data.element.style.opacity = Math.max(0, data.life);
            
            // Scale down as it fades
            const scale = 0.5 + data.life * 0.5;
            data.element.style.transform = `translate(-50%, -50%) scale(${scale})`;
            
            // Remove if dead
            if (data.life <= 0) {
                data.element.remove();
                this.activeNumbers.splice(i, 1);
            }
        }
    }
    
    /**
     * Convert world position to screen position
     */
    worldToScreen(position) {
        const tempV = position.clone();
        tempV.project(this.camera);
        
        const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(tempV.y * 0.5) + 0.5) * window.innerHeight;
        
        return { x, y };
    }
    
    /**
     * Clear all damage numbers
     */
    clear() {
        this.activeNumbers.forEach(data => {
            data.element.remove();
        });
        this.activeNumbers = [];
    }
}
