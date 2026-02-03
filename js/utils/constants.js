// ==========================================
// GAME CONSTANTS
// ==========================================

export const CONFIG = {
    PLAYER_HP: 40,
    ATTACK_DAMAGE: 5,
    ARENA_SIZE: 60,
    MOVE_SPEED: 15,
    DASH_SPEED: 35,
    CAMERA_HEIGHT: 15,
    CAMERA_DISTANCE: -15
};

export const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'game_over'
};

export const PokemonTypes = {
    charmander: { 
        color: 0xff6b35, 
        secondary: 0xf7931e, 
        type: 'fire',
        name: 'Charmander',
        icon: '🔥'
    },
    bulbasaur: { 
        color: 0x4ecdc4, 
        secondary: 0x44a08d, 
        type: 'grass',
        name: 'Bulbasaur',
        icon: '🌿'
    },
    squirtle: { 
        color: 0x45b7d1, 
        secondary: 0x96c93d, 
        type: 'water',
        name: 'Squirtle',
        icon: '💧'
    },
    pikachu: { 
        color: 0xffd93d, 
        secondary: 0xff6b35, 
        type: 'electric',
        name: 'Pikachu',
        icon: '⚡'
    }
};

export const TeamColors = {
    1: '#ff6b6b',
    2: '#4ecdc4',
    3: '#45b7d1',
    4: '#ffd93d'
};

export const AttackType = {
    INSTANT: 'instant',
    CHANNEL: 'channel',
    PROJECTILE: 'projectile',
    CHARGE: 'charge',
    DASH: 'dash'
};

export const AttackTarget = {
    GROUND: 'ground',
    DIRECTION: 'direction',
    SELF: 'self'
};
