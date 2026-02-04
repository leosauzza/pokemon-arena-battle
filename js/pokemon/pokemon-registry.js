// ==========================================
// POKEMON REGISTRY
// ==========================================

import { pokemonData } from '../data/pokemon-data.js';

class PokemonRegistry {
    constructor() {
        this.data = { ...pokemonData };
    }

    get(id) {
        return this.data[id] || null;
    }

    getAll() {
        return Object.values(this.data);
    }

    getIds() {
        return Object.keys(this.data);
    }

    register(pokemonConfig) {
        this.data[pokemonConfig.id] = pokemonConfig;
    }

    getAttackIds(pokemonId) {
        const pokemon = this.get(pokemonId);
        return pokemon ? pokemon.attacks : [];
    }

    getStats(pokemonId) {
        const pokemon = this.get(pokemonId);
        return pokemon ? pokemon.stats : null;
    }
}

export const pokemonRegistry = new PokemonRegistry();
