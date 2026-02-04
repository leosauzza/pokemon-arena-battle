// ==========================================
// POKEMON DATA - Central Pokemon definitions
// ==========================================

export const pokemonData = {
    charmander: {
        id: 'charmander',
        name: 'Charmander',
        elementType: 'fire',
        icon: '🔥',
        colors: {
            primary: 0xff6b35,
            secondary: 0xf7931e
        },
        stats: {
            hp: 40,
            moveSpeed: 15,
            attack: 5,
            defense: 3
        },
        attacks: ['flamethrower', 'scratch']
    },
    bulbasaur: {
        id: 'bulbasaur',
        name: 'Bulbasaur',
        elementType: 'grass',
        icon: '🌿',
        colors: {
            primary: 0x4ecdc4,
            secondary: 0x44a08d
        },
        stats: {
            hp: 45,
            moveSpeed: 13,
            attack: 4,
            defense: 5
        },
        attacks: ['vinewhip', 'solarbeam', 'razorleaf']
    },
    squirtle: {
        id: 'squirtle',
        name: 'Squirtle',
        elementType: 'water',
        icon: '💧',
        colors: {
            primary: 0x45b7d1,
            secondary: 0x96c93d
        },
        stats: {
            hp: 50,
            moveSpeed: 12,
            attack: 4,
            defense: 6
        },
        attacks: ['watergun', 'hydropulse']
    },
    pikachu: {
        id: 'pikachu',
        name: 'Pikachu',
        elementType: 'electric',
        icon: '⚡',
        colors: {
            primary: 0xffd93d,
            secondary: 0xff6b35
        },
        stats: {
            hp: 35,
            moveSpeed: 18,
            attack: 6,
            defense: 2
        },
        attacks: ['quickattack', 'thunderbolt']
    }
};

export function getPokemonData(id) {
    return pokemonData[id] || null;
}

export function getAllPokemon() {
    return Object.values(pokemonData);
}
