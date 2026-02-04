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
