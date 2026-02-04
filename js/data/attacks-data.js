// ==========================================
// ATTACKS DATA - Metadata for all attacks
// ==========================================

import { AttackType } from '../utils/constants.js';

export const attacksData = {
    flamethrower: {
        id: 'flamethrower',
        name: 'Flamethrower',
        description: 'Cone of fire for 3 seconds',
        type: AttackType.CHANNEL,
        cooldown: 4,
        damageMultiplier: 0.5,
        range: 8,
        icon: '🔥',
        implementation: 'FlamethrowerAttack',
        keyBinding: '1'
    },
    scratch: {
        id: 'scratch',
        name: 'Scratch',
        description: 'Melee attack with knockback',
        type: AttackType.INSTANT,
        cooldown: 3,
        damageMultiplier: 2,
        range: 3,
        icon: '🐾',
        implementation: 'ScratchAttack',
        keyBinding: '2'
    },
    vinewhip: {
        id: 'vinewhip',
        name: 'Vine Whip',
        description: 'Line attack in front',
        type: AttackType.INSTANT,
        cooldown: 3,
        damageMultiplier: 1.5,
        range: 8,
        icon: '🌿',
        implementation: 'VineWhipAttack',
        keyBinding: '1'
    },
    solarbeam: {
        id: 'solarbeam',
        name: 'Solar Beam',
        description: 'Charge for 1.5s, then powerful beam',
        type: AttackType.CHARGE,
        cooldown: 8,
        damageMultiplier: 3,
        range: 25,
        icon: '☀️',
        implementation: 'SolarBeamAttack',
        keyBinding: '2'
    },
    razorleaf: {
        id: 'razorleaf',
        name: 'Razor Leaf',
        description: 'Stream of leaves (locks movement only)',
        type: AttackType.CHANNEL,
        cooldown: 6,
        damageMultiplier: 0.3,
        range: 12,
        icon: '🍃',
        implementation: 'RazorLeafAttack',
        keyBinding: '3'
    },
    watergun: {
        id: 'watergun',
        name: 'Water Gun',
        description: 'Beam for 2 seconds',
        type: AttackType.CHANNEL,
        cooldown: 5,
        damageMultiplier: 0.4,
        range: 10,
        icon: '💧',
        implementation: 'WaterGunAttack',
        keyBinding: '1'
    },
    hydropulse: {
        id: 'hydropulse',
        name: 'Hydro Pulse',
        description: 'Projectile in beeline',
        type: AttackType.PROJECTILE,
        cooldown: 4,
        damageMultiplier: 1.5,
        range: 20,
        icon: '🌊',
        implementation: 'HydroPulseAttack',
        keyBinding: '2'
    },
    quickattack: {
        id: 'quickattack',
        name: 'Quick Attack',
        description: 'Dash forward quickly',
        type: AttackType.DASH,
        cooldown: 5,
        damageMultiplier: 1,
        range: 10,
        icon: '⚡',
        implementation: 'QuickAttack',
        keyBinding: '1'
    },
    thunderbolt: {
        id: 'thunderbolt',
        name: 'Thunderbolt',
        description: 'Projectile to target position',
        type: AttackType.PROJECTILE,
        cooldown: 6,
        damageMultiplier: 2,
        range: 15,
        icon: '🌩️',
        implementation: 'ThunderboltAttack',
        keyBinding: '2'
    }
};
