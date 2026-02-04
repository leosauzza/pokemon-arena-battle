# AGENTS.md - Pokémon Arena Battle

This file contains information for AI coding agents working on this project.

## Project Overview

A browser-based Pokémon fan game inspired by Battlerite. Features 4-player arena battles (1 human + 3 AI) with WASD + mouse controls.

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+ modules)
- **3D Graphics**: Three.js (r128)
- **Styling**: Pure CSS (no frameworks)
- **Server**: Python 3 HTTP server (for local development)

## Project Structure

```
/pokemon-arena-battle
├── index.html              # Main entry point
├── server.py               # Python HTTP server (port 8123)
├── start-server.sh         # Bash script to start server
├── AGENTS.md               # This file
├── styles/
│   └── main.css           # All game styles
├── js/
│   ├── main.js            # Entry point, selection screen logic
│   ├── core/
│   │   ├── game.js        # Main game engine
│   │   ├── terrain.js     # Arena, obstacles, boundaries
│   │   └── input.js       # Keyboard/mouse input handling
│   ├── entities/
│   │   └── player.js      # Player class (movement, attacks, HP)
│   ├── characters/
│   │   └── character-models.js  # 3D Pokemon models
│   ├── attacks/
│   │   ├── attack-base.js       # Base Attack class
│   │   ├── attack-manager.js    # Factory for attacks
│   │   ├── charmander-attacks.js # Flamethrower, Scratch
│   │   ├── bulbasaur-attacks.js  # VineWhip, SolarBeam
│   │   ├── squirtle-attacks.js   # WaterGun, HydroPulse, RazorLeaf
│   │   └── pikachu-attacks.js    # QuickAttack, Thunderbolt
│   ├── ai/
│   │   └── ai-controller.js     # AI behavior for NPCs
│   ├── ui/
│   │   ├── ui-manager.js        # UI updates, health bars
│   │   └── damage-numbers.js    # Floating damage text
│   └── utils/
│       ├── constants.js         # Game config, enums
│       └── helpers.js           # Utility functions
└── assets/                  # Future assets (images, sounds)
```

## Coding Conventions

### JavaScript

1. **Use ES6+ modules** - All files are ES modules with `.js` extension
2. **Import Three.js as module**:
   ```javascript
   import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
   ```
3. **Export classes/functions explicitly**:
   ```javascript
   export class MyClass { ... }
   export function myFunction() { ... }
   ```
4. **Use JSDoc comments** for public methods
5. **Validate parameters** - Always check if arrays/objects exist before iterating

### File Organization

1. **One class per file** (generally)
2. **Group by feature**: attacks/, characters/, ui/, etc.
3. **Constants in constants.js** - Don't hardcode magic numbers
4. **Helper functions in helpers.js** - Reusable utilities only

### Naming Conventions

- **Classes**: PascalCase (e.g., `Player`, `AttackManager`)
- **Functions/Variables**: camelCase (e.g., `checkCollision`, `moveSpeed`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `CONFIG`, `ATTACK_DAMAGE`)
- **Files**: kebab-case (e.g., `attack-base.js`, `ui-manager.js`)

## Game Architecture

### Attack System

1. **Base Class**: `Attack` in `attack-base.js`
   - Properties: `id`, `name`, `cooldown`, `damage`, `type`, `icon`
   - Methods: `execute()`, `performAttack()`, `canUse()`
   
2. **Attack Types** (in constants.js):
   - `INSTANT` - Immediate effect
   - `CHANNEL` - Ongoing effect (e.g., Flamethrower)
   - `PROJECTILE` - Moving projectile (e.g., Hydro Pulse)
   - `CHARGE` - Delayed cast (e.g., Solar Beam)
   - `DASH` - Movement attack (e.g., Quick Attack)

3. **Creating New Attacks**:
   - Extend `Attack` class
   - Implement `performAttack()` method
   - Call `super()` with config in constructor
   - Add to appropriate pokemon-attacks.js file

### Player System

1. **Player Class** handles:
   - Movement and collision
   - Attack selection and execution
   - HP and damage
   - 3D model (via character-models.js)

2. **AI Players**:
   - Use `AIController` class
   - Behavior defined per Pokemon type
   - Automatically target enemies and use attacks

### Collision System

Two-layer collision detection:

1. **Human Player** (`game.js`):
   - Push-out vector when stuck inside obstacle
   - Sliding when hitting obstacle edge
   
2. **AI Players** (`player.js`):
   - Same push-out mechanism
   - Applied during AI update

### Input System

1. **Selection Screen**: Direct DOM event listeners
2. **Game**: `InputHandler` class
   - WASD movement (camera-relative)
   - Mouse aim (raycast to ground)
   - Number keys 1-4 for attack selection
   - Left click to execute attack
   - ESC to cancel attack selection

## Common Patterns

### Adding Validation

Always validate parameters in attack methods:

```javascript
performAttack(player, targetPos, scene, players, obstacles, deltaTime) {
    if (!scene) {
        console.warn('AttackName: scene is undefined');
        return false;
    }
    if (!players || !Array.isArray(players)) {
        return false;
    }
    // ... rest of method
}
```

### Iterating Over Players

Always check if array exists:

```javascript
if (players && Array.isArray(players)) {
    for (let p of players) {
        // ... damage logic
    }
}
```

### Projectiles

For projectile attacks, use the callback pattern:

```javascript
performAttack(player, targetPos, scene, players, obstacles, deltaTime, onProjectileCreate) {
    // ... create projectile mesh
    const projData = { mesh, velocity, owner, damage };
    
    if (onProjectileCreate) {
        onProjectileCreate(projData);
    }
}
```

## Running the Game

**Important**: Must use a web server (not file://) due to ES modules.

### Option 1: Docker (Recommended)
```bash
# Build and run with docker-compose
docker-compose up -d

# Or build and run manually
docker build -t pokemon-arena-battle .
docker run -p 8123:8123 pokemon-arena-battle
```

Then open: http://localhost:8123

### Option 2: Bash Script (Auto-selects best option)
```bash
./start-server.sh
```
This will use Docker if available, otherwise falls back to Python.

### Option 3: Python
```bash
python3 server.py
# or
python3 -m http.server 8123
```

Then open: http://localhost:8123

## Adding New Features

### New Pokemon

1. Add type to `PokemonTypes` in `constants.js`
2. Create 3D model in `character-models.js`
3. Create attack classes in new file (e.g., `mewtwo-attacks.js`)
4. Add to `AttackManager.getAttacksForPokemon()`
5. Add card to `index.html` selection screen

### New Attack

1. Create class extending `Attack`
2. Implement `performAttack()` with proper validation
3. Handle cleanup in `cleanup()` if using intervals/timeouts
4. Add icon (emoji is fine)
5. Assign to Pokemon in attack-manager.js

### New Terrain Elements

1. Add creation method in `terrain.js`
2. Set `userData = { type: 'obstacle', radius: X }`
3. Collision detection will work automatically

## Debugging Tips

1. **Check browser console** for ES module errors
2. **Validate all parameters** - Most bugs are undefined values
3. **Use `console.warn()`** for recoverable errors
4. **Test collision** by walking into rocks
5. **Check AI behavior** - They should attack and move around

## Performance Considerations

1. Use `setInterval` carefully - always clear on cleanup
2. Don't create new THREE.Vector3 in render loop (reuse)
3. Remove projectile meshes when they hit targets
4. Use `lerp` for smooth camera movement
5. Limit damage number DOM elements

## Known Limitations

1. No persistence - refresh resets everything
2. No multiplayer networking
3. AI uses simple state machine (not pathfinding)
4. Collision is radius-based (not mesh-perfect)
5. Attack previews are simple geometry
