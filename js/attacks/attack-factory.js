// ==========================================
// ATTACK FACTORY
// ==========================================

import { attackRegistry } from './attack-registry.js';
import { attacksData } from '../data/attacks-data.js';

import './implementations/fire-attacks.js';
import './implementations/grass-attacks.js';
import './implementations/water-attacks.js';
import './implementations/electric-attacks.js';

export class AttackFactory {
    static createAttack(attackId, pokemonStats) {
        const attackMeta = attacksData[attackId];
        if (!attackMeta) {
            console.warn(`Attack metadata ${attackId} not found`);
            return null;
        }

        const baseDamage = pokemonStats.attack || 5;
        const damage = baseDamage * attackMeta.damageMultiplier;

        const config = {
            id: attackId,
            name: attackMeta.name,
            description: attackMeta.description,
            cooldown: attackMeta.cooldown,
            damage: damage,
            type: attackMeta.type,
            range: attackMeta.range,
            icon: attackMeta.icon,
            keyBinding: attackMeta.keyBinding,
            ...attackMeta.additionalParams
        };

        return attackRegistry.create(attackId, config);
    }

    static getAttacksForPokemon(pokemonId, pokemonData, pokemonStats) {
        if (!pokemonData) {
            console.warn(`Pokemon ${pokemonId} not found`);
            return [];
        }

        return pokemonData.attacks
            .map(attackId => this.createAttack(attackId, pokemonStats))
            .filter(Boolean);
    }

    static getAttackByKey(attacks, key) {
        return attacks.find(a => a.keyBinding === key);
    }

    static updateAttackCooldowns(attacks, delta) {
        attacks.forEach(attack => attack.update(delta));
    }
}
