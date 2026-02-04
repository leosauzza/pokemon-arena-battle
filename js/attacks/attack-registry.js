// ==========================================
// ATTACK REGISTRY
// ==========================================

export class AttackRegistry {
    constructor() {
        this.attackClasses = new Map();
    }

    register(attackId, AttackClass) {
        this.attackClasses.set(attackId, AttackClass);
    }

    has(attackId) {
        return this.attackClasses.has(attackId);
    }

    create(attackId, config = {}) {
        const AttackClass = this.attackClasses.get(attackId);
        if (!AttackClass) {
            console.warn(`Attack ${attackId} not found`);
            return null;
        }
        return new AttackClass(config);
    }
}

export const attackRegistry = new AttackRegistry();
