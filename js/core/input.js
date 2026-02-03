// ==========================================
// INPUT HANDLER
// ==========================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class InputHandler {
    constructor(camera, groundPlane) {
        this.camera = camera;
        this.groundPlane = groundPlane;
        
        // Keyboard state
        this.keys = {
            w: false, a: false, s: false, d: false,
            shift: false
        };
        
        // Mouse state
        this.mouse = new THREE.Vector2();
        this.mousePosition = new THREE.Vector3();
        this.raycaster = new THREE.Raycaster();
        
        // Attack keys (1-4)
        this.attackKeys = ['1', '2', '3', '4'];
        
        // Callbacks
        this.onAttackKey = null;
        this.onMouseClick = null;
        this.onMouseMove = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse
        window.addEventListener('mousemove', (e) => this.onMouseMoveHandler(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    onKeyDown(e) {
        const key = e.key.toLowerCase();
        
        // Movement keys
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = true;
        }
        
        // Attack keys (1-4)
        if (this.attackKeys.includes(e.key)) {
            e.preventDefault();
            if (this.onAttackKey) {
                this.onAttackKey(e.key);
            }
        }
        

    }
    
    onKeyUp(e) {
        const key = e.key.toLowerCase();
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = false;
        }
    }
    
    onMouseMoveHandler(e) {
        // Update normalized mouse coordinates
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        
        // Raycast to ground
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.groundPlane);
        
        if (intersects.length > 0) {
            this.mousePosition.copy(intersects[0].point);
            
            if (this.onMouseMove) {
                this.onMouseMove(this.mousePosition);
            }
        }
    }
    
    onMouseDown(e) {
        // Left click only
        if (e.button === 0 && this.onMouseClick) {
            this.onMouseClick(this.mousePosition);
        }
    }
    
    /**
     * Get movement vector from WASD keys
     */
    getMovementVector() {
        const vector = new THREE.Vector3();
        
        if (this.keys.w) vector.z += 1;
        if (this.keys.s) vector.z -= 1;
        if (this.keys.a) vector.x -= 1;
        if (this.keys.d) vector.x += 1;
        
        if (vector.length() > 0) {
            vector.normalize();
        }
        
        return vector;
    }
    
    /**
     * Check if shift is held
     */
    isShiftHeld() {
        return this.keys.shift;
    }
    
    /**
     * Get mouse position in world space
     */
    getMousePosition() {
        return this.mousePosition.clone();
    }
}
