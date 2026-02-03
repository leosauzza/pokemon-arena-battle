// ==========================================
// ATTACK MANAGER
// ==========================================

import { FlamethrowerAttack, ScratchAttack } from './charmander-attacks.js';
import { VineWhipAttack, SolarBeamAttack, RazorLeafAttack } from './bulbasaur-attacks.js';
import { WaterGunAttack, HydroPulseAttack } from './squirtle-attacks.js';
import { QuickAttack, ThunderboltAttack } from './pikachu-attacks.js';

export class AttackManager {
    static getAttacksForPokemon(pokemonType) {
        switch(pokemonType) {
            case 'charmander':
                return [
                    new FlamethrowerAttack(),
                    new ScratchAttack()
                ];
            case 'bulbasaur':
                return [
                    new VineWhipAttack(),
                    new SolarBeamAttack(),
                    new RazorLeafAttack()
                ];
            case 'squirtle':
                return [
                    new WaterGunAttack(),
                    new HydroPulseAttack(),
                ];
            case 'pikachu':
                return [
                    new QuickAttack(),
                    new ThunderboltAttack()
                ];
            default:
                return [];
        }
    }
    
    static getAttackByKey(attacks, key) {
        return attacks.find(a => a.keyBinding === key);
    }
    
    static updateAttackCooldowns(attacks, delta) {
        attacks.forEach(attack => attack.update(delta));
    }
}
