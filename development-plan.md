# Development Plan: Decouple Pokemon and Attacks

## Overview
Refactor the codebase to separate Pokemon definitions from attack implementations, enabling data-driven Pokemon creation via JSON configuration. This will allow adding new Pokemon by simply updating a JSON file without modifying code.

## Current Architecture Analysis

### Problems with Current Implementation
1. **Tight Coupling**: `AttackManager.getAttacksForPokemon()` uses hardcoded switch statements
2. **Scattered Pokemon Data**: Pokemon properties (colors, types, icons) are in `constants.js`, models in `character-models.js`, attacks in separate files per Pokemon
3. **Hardcoded UI**: Selection screen in `index.html` has static Pokemon cards
4. **No Stats System**: No way to define Pokemon stats (HP, speed, etc.) per Pokemon
5. **Attack Registration**: Attacks are instantiated directly, not registered in a central registry

### Current File Dependencies
```
constants.js → PokemonTypes (hardcoded)
attack-manager.js → Imports all attack classes, switch statement
character-models.js → Switch statement for model creation
player.js → Gets attacks from AttackManager
main.js/game.js → Hardcoded pokemon list
index.html → Hardcoded Pokemon cards
```

## Target Architecture

### New Directory Structure
```
js/
├── data/
│   ├── pokemon-data.js       # Pokemon definitions (JSON-like)
│   └── attacks-data.js       # Attack metadata registry
├── attacks/
│   ├── attack-base.js        # Base Attack class (unchanged)
│   ├── attack-registry.js    # Central attack registration system
│   ├── attack-factory.js     # Creates attack instances by ID
│   └── implementations/      # All attack implementations
│       ├── fire-attacks.js
│       ├── water-attacks.js
│       ├── grass-attacks.js
│       ├── electric-attacks.js
│       └── physical-attacks.js
├── pokemon/
│   ├── pokemon-registry.js   # Pokemon registry & factory
│   ├── pokemon-class.js      # Pokemon entity class (replaces direct player creation)
│   └── model-factory.js      # Creates 3D models from Pokemon type
└── main.js                   # Updated to use new system
```

### Data Schema

#### Pokemon Definition (pokemon-data.js)
```javascript
{
  id: 'charmander',
  name: 'Charmander',
  type: 'fire',
  elementType: 'fire', // for game logic (fire > grass > water)
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
  attacks: ['flamethrower', 'scratch'],
  model: 'charmander' // references model-factory
}
```

#### Attack Definition (attacks-data.js)
```javascript
{
  id: 'flamethrower',
  name: 'Flamethrower',
  description: 'Cone of fire for 3 seconds',
  type: 'channel', // AttackType.CHANNEL
  cooldown: 4,
  damage: 2.5, // multiplies base attack stat
  range: 8,
  icon: '🔥',
  implementation: 'FlamethrowerAttack', // class name
  keyBinding: '1'
}
```

## Phase 1: Create Attack Registry System

### 1.1 Create `js/attacks/attack-registry.js`
**Purpose**: Central registry for all attack classes
**Exports**: `AttackRegistry` class

**Implementation Details**:
```javascript
class AttackRegistry {
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
```

**Test**: After each attack file is updated, verify registry has the attack

### 1.2 Create `js/attacks/attack-factory.js`
**Purpose**: Creates attack instances with Pokemon-specific stats
**Exports**: `AttackFactory`

**Implementation Details**:
```javascript
import { attackRegistry } from './attack-registry.js';
import { attacksData } from '../data/attacks-data.js';

export class AttackFactory {
  static createAttack(attackId, pokemonStats) {
    const attackMeta = attacksData[attackId];
    if (!attackMeta) {
      console.warn(`Attack metadata ${attackId} not found`);
      return null;
    }
    
    // Calculate actual damage based on Pokemon attack stat
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
  
  static getAttacksForPokemon(pokemonId, pokemonStats) {
    const pokemonData = pokemonRegistry.get(pokemonId);
    if (!pokemonData) return [];
    
    return pokemonData.attacks
      .map(attackId => this.createAttack(attackId, pokemonStats))
      .filter(Boolean);
  }
}
```

### 1.3 Create `js/data/attacks-data.js`
**Purpose**: Metadata for all attacks

**Implementation Details**:
- Move attack metadata from individual classes
- Define all 9 current attacks with their properties
- Include reference to implementation class name

**Attacks to Define**:
1. `flamethrower` - Channel
2. `scratch` - Instant
3. `vinewhip` - Instant
4. `solarbeam` - Charge
5. `razorleaf` - Channel
6. `watergun` - Channel
7. `hydropulse` - Projectile
8. `quickattack` - Dash
9. `thunderbolt` - Projectile

### 1.4 Refactor Attack Files to Register Themselves
**Files to Modify**:
- `js/attacks/charmander-attacks.js` → `js/attacks/implementations/fire-attacks.js`
- `js/attacks/bulbasaur-attacks.js` → `js/attacks/implementations/grass-attacks.js`
- `js/attacks/squirtle-attacks.js` → `js/attacks/implementations/water-attacks.js`
- `js/attacks/pikachu-attacks.js` → `js/attacks/implementations/electric-attacks.js`

**Changes per File**:
1. Change export to NOT be default
2. At bottom of file, add:
```javascript
import { attackRegistry } from '../attack-registry.js';
attackRegistry.register('flamethrower', FlamethrowerAttack);
attackRegistry.register('scratch', ScratchAttack);
```

**Verification**: Ensure all attacks register on module load

## Phase 2: Create Pokemon Data System

### 2.1 Create `js/data/pokemon-data.js`
**Purpose**: Central Pokemon definitions
**Exports**: `pokemonData` object, `getPokemonData(id)`

**Implementation Details**:
```javascript
export const pokemonData = {
  charmander: {
    id: 'charmander',
    name: 'Charmander',
    elementType: 'fire',
    icon: '🔥',
    colors: { primary: 0xff6b35, secondary: 0xf7931e },
    stats: { hp: 40, moveSpeed: 15, attack: 5, defense: 3 },
    attacks: ['flamethrower', 'scratch']
  },
  bulbasaur: {
    id: 'bulbasaur',
    name: 'Bulbasaur',
    elementType: 'grass',
    icon: '🌿',
    colors: { primary: 0x4ecdc4, secondary: 0x44a08d },
    stats: { hp: 45, moveSpeed: 13, attack: 4, defense: 5 },
    attacks: ['vinewhip', 'solarbeam', 'razorleaf']
  },
  squirtle: {
    id: 'squirtle',
    name: 'Squirtle',
    elementType: 'water',
    icon: '💧',
    colors: { primary: 0x45b7d1, secondary: 0x96c93d },
    stats: { hp: 50, moveSpeed: 12, attack: 4, defense: 6 },
    attacks: ['watergun', 'hydropulse']
  },
  pikachu: {
    id: 'pikachu',
    name: 'Pikachu',
    elementType: 'electric',
    icon: '⚡',
    colors: { primary: 0xffd93d, secondary: 0xff6b35 },
    stats: { hp: 35, moveSpeed: 18, attack: 6, defense: 2 },
    attacks: ['quickattack', 'thunderbolt']
  }
};

export function getPokemonData(id) {
  return pokemonData[id] || null;
}

export function getAllPokemon() {
  return Object.values(pokemonData);
}
```

### 2.2 Create `js/pokemon/pokemon-registry.js`
**Purpose**: Registry for Pokemon data with factory methods
**Exports**: `pokemonRegistry` singleton

**Implementation Details**:
```javascript
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
  
  // For future: dynamically add Pokemon
  register(pokemonConfig) {
    this.data[pokemonConfig.id] = pokemonConfig;
  }
  
  // Get attacks for a Pokemon
  getAttackIds(pokemonId) {
    const pokemon = this.get(pokemonId);
    return pokemon ? pokemon.attacks : [];
  }
  
  // Get stats for a Pokemon
  getStats(pokemonId) {
    const pokemon = this.get(pokemonId);
    return pokemon ? pokemon.stats : null;
  }
}

export const pokemonRegistry = new PokemonRegistry();
```

### 2.3 Create `js/pokemon/model-factory.js`
**Purpose**: Create 3D models based on Pokemon ID
**Exports**: `createPokemonModel(id)`

**Implementation Details**:
- Extract model creation functions from `character-models.js`
- Create a factory that routes to correct model creator based on Pokemon ID
- Future: Allow custom model loaders

```javascript
import * as THREE from 'three';
import { pokemonRegistry } from './pokemon-registry.js';

export function createPokemonModel(pokemonId) {
  const pokemon = pokemonRegistry.get(pokemonId);
  if (!pokemon) {
    console.warn(`Pokemon ${pokemonId} not found, using default`);
    return createDefaultModel();
  }
  
  const group = new THREE.Group();
  const colors = pokemon.colors;
  
  // Route to specific model creator
  switch(pokemonId) {
    case 'charmander':
      createCharmanderModel(group, colors);
      break;
    case 'bulbasaur':
      createBulbasaurModel(group, colors);
      break;
    case 'squirtle':
      createSquirtleModel(group, colors);
      break;
    case 'pikachu':
      createPikachuModel(group, colors);
      break;
    default:
      createDefaultModel(group, colors);
  }
  
  // Add HP bar
  const hpBarGroup = createHPBar();
  hpBarGroup.position.y = 2;
  group.add(hpBarGroup);
  group.userData.hpBar = hpBarGroup;
  
  return group;
}

// Model creation functions (moved from character-models.js)
function createCharmanderModel(group, colors) { /* ... */ }
function createBulbasaurModel(group, colors) { /* ... */ }
function createSquirtleModel(group, colors) { /* ... */ }
function createPikachuModel(group, colors) { /* ... */ }
function createDefaultModel(group, colors) { /* ... */ }
function createHPBar() { /* ... */ }
```

## Phase 3: Update Player Entity

### 3.1 Update `js/entities/player.js`
**Purpose**: Use new Pokemon and Attack systems

**Changes**:
1. Import from new locations:
```javascript
import { pokemonRegistry } from '../pokemon/pokemon-registry.js';
import { createPokemonModel } from '../pokemon/model-factory.js';
import { AttackFactory } from '../attacks/attack-factory.js';
```

2. Update constructor to use Pokemon data:
```javascript
constructor(pokemonId, team, isAI = true, id) {
  this.pokemonId = pokemonId;
  this.pokemonData = pokemonRegistry.get(pokemonId);
  
  // Use stats from Pokemon data
  this.stats = this.pokemonData.stats;
  this.hp = this.stats.hp;
  this.maxHp = this.stats.hp;
  
  // Get attacks from factory
  this.attacks = AttackFactory.getAttacksForPokemon(pokemonId, this.stats);
  
  // Create model
  this.mesh = createPokemonModel(pokemonId);
  
  // Movement speed from stats
  this.moveSpeed = this.stats.moveSpeed;
}
```

3. Update references to `this.type` → `this.pokemonId`
4. Ensure `CONFIG.MOVE_SPEED` can be overridden by `this.moveSpeed`

## Phase 4: Update Game and Core Systems

### 4.1 Update `js/core/game.js`
**Purpose**: Use Pokemon registry instead of hardcoded list

**Changes**:
1. Import `pokemonRegistry`
2. Replace hardcoded `pokemonList`:
```javascript
// OLD:
const pokemonList = ['charmander', 'bulbasaur', 'squirtle', 'pikachu'];

// NEW:
const pokemonList = pokemonRegistry.getIds();
```

3. Ensure teams configuration still works

### 4.2 Update `js/main.js`
**Purpose**: Dynamic selection screen generation

**Changes**:
1. Import `pokemonRegistry`
2. Replace hardcoded card setup with dynamic generation:
```javascript
function setupSelectionScreen() {
  const grid = document.querySelector('.pokemon-grid');
  grid.innerHTML = ''; // Clear existing
  
  pokemonRegistry.getAll().forEach(pokemon => {
    const card = createPokemonCard(pokemon);
    grid.appendChild(card);
  });
  
  attachEventListeners();
}

function createPokemonCard(pokemon) {
  // Generate card HTML from pokemon data
  // Include attacks from pokemon.attacks array
}
```

### 4.3 Update or Remove `js/attacks/attack-manager.js`
**Options**:
- Option A: Deprecate and redirect to AttackFactory
- Option B: Keep as wrapper around AttackFactory for backward compatibility

**Recommended**: Option A - remove file, update all imports

## Phase 5: Update Constants and Utils

### 5.1 Update `js/utils/constants.js`
**Purpose**: Remove PokemonTypes, keep shared constants

**Changes**:
1. Remove `PokemonTypes` object
2. Keep: `CONFIG`, `GameState`, `AttackType`, `AttackTarget`, `TeamColors`
3. Add any new shared constants needed

### 5.2 Update/Remove `js/characters/character-models.js`
**Changes**:
- Move model creation functions to `js/pokemon/model-factory.js`
- Delete or deprecate this file

## Phase 6: UI Updates

### 6.1 Update `js/ui/ui-manager.js`
**Purpose**: Use dynamic Pokemon data

**Changes**:
1. Update attack bar creation to use attack metadata
2. Update health bars to use Pokemon names from registry

### 6.2 Update `index.html`
**Purpose**: Remove hardcoded Pokemon cards

**Changes**:
1. Keep the grid container: `<div class="pokemon-grid"></div>`
2. Remove all `<div class="pokemon-card">` elements
3. Cards will be generated by `main.js`

## Phase 7: Update AI Controller

### 7.1 Update `js/ai/ai-controller.js`
**Purpose**: Use Pokemon stats for AI behavior

**Changes**:
1. Import `pokemonRegistry`
2. Use Pokemon stats (attack range, speed) for decision making
3. AI can be more intelligent based on Pokemon type/element

## Phase 8: Testing and Validation

### 8.1 Create Test Script
Create `js/tests/refactor-test.js`:
```javascript
// Test all Pokemon can be created
// Test all attacks can be instantiated
// Test attack registry has all attacks
// Test Pokemon registry has all Pokemon
```

### 8.2 Validation Checklist
- [ ] All 4 Pokemon load correctly
- [ ] All 9 attacks work as before
- [ ] Selection screen displays all Pokemon dynamically
- [ ] Attack bars show correct attacks per Pokemon
- [ ] Models display correctly
- [ ] HP values use Pokemon stats
- [ ] Movement speed uses Pokemon stats
- [ ] Damage calculation uses Pokemon attack stat
- [ ] No console errors
- [ ] Gameplay is unchanged from user perspective

## Phase 9: Future Enhancements (Not in this refactor)

### 9.1 JSON Loading
Instead of JS files, load from actual JSON:
```javascript
// Future: Load from server
const response = await fetch('/data/pokemon.json');
const pokemonData = await response.json();
```

### 9.2 Plugin System
Allow adding Pokemon via plugins:
```javascript
// Future: Plugin API
PokemonPlugin.register({
  id: 'mewtwo',
  attacks: ['psychic', 'shadowball'],
  // ...
});
```

## Implementation Order Summary

```
1. Create attack-registry.js
2. Create attacks-data.js with metadata
3. Refactor attack files to self-register
4. Create attack-factory.js
5. Create pokemon-data.js
6. Create pokemon-registry.js
7. Create model-factory.js
8. Update player.js
9. Update game.js
10. Update main.js for dynamic UI
11. Update constants.js (remove PokemonTypes)
12. Remove/deprecate old files
13. Update index.html
14. Test everything
```

## Backward Compatibility Notes

### Breaking Changes
- `PokemonTypes` constant removed → use `pokemonRegistry.get(id)`
- `AttackManager` removed → use `AttackFactory`
- `createPokemonModel` import path changed
- Player constructor signature unchanged but internal behavior changed

### Migration Guide for Existing Code
```javascript
// OLD:
import { PokemonTypes } from './utils/constants.js';
const type = PokemonTypes.charmander;

// NEW:
import { pokemonRegistry } from './pokemon/pokemon-registry.js';
const type = pokemonRegistry.get('charmander');

// OLD:
import { AttackManager } from './attacks/attack-manager.js';
const attacks = AttackManager.getAttacksForPokemon('charmander');

// NEW:
import { AttackFactory } from './attacks/attack-factory.js';
const stats = pokemonRegistry.getStats('charmander');
const attacks = AttackFactory.getAttacksForPokemon('charmander', stats);
```

## Estimated Effort
- Phase 1 (Attack System): 2-3 hours
- Phase 2 (Pokemon Data): 1-2 hours
- Phase 3 (Player): 1 hour
- Phase 4 (Game/Core): 1-2 hours
- Phase 5 (Constants/Utils): 30 minutes
- Phase 6 (UI): 1-2 hours
- Phase 7 (AI): 30 minutes
- Phase 8 (Testing): 1-2 hours

**Total Estimated Time**: 8-13 hours for an experienced developer

## Files to Create
1. `js/attacks/attack-registry.js`
2. `js/attacks/attack-factory.js`
3. `js/data/attacks-data.js`
4. `js/data/pokemon-data.js`
5. `js/pokemon/pokemon-registry.js`
6. `js/pokemon/model-factory.js`
7. `js/attacks/implementations/` (4 files)

## Files to Modify
1. `js/attacks/charmander-attacks.js` → move & update
2. `js/attacks/bulbasaur-attacks.js` → move & update
3. `js/attacks/squirtle-attacks.js` → move & update
4. `js/attacks/pikachu-attacks.js` → move & update
5. `js/attacks/attack-base.js` (minor - ensure compatibility)
6. `js/entities/player.js`
7. `js/core/game.js`
8. `js/main.js`
9. `js/utils/constants.js`
10. `js/ui/ui-manager.js`
11. `index.html`

## Files to Delete
1. `js/attacks/attack-manager.js`
2. `js/characters/character-models.js`
