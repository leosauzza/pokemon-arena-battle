// ==========================================
// MAIN ENTRY POINT
// ==========================================

import { Game } from './core/game.js';
import { pokemonRegistry } from './pokemon/pokemon-registry.js';

let game = null;
let isPracticeMode = false;

let selectedPokemon = null;
let pokemonTeams = {};

try {
    setupSelectionScreen();

    const gameUi = document.getElementById('game-ui');
    const selectionScreen = document.getElementById('selection-screen');

    if (gameUi) gameUi.style.display = 'none';
    if (selectionScreen) selectionScreen.style.display = 'flex';

    console.log('✅ Selection screen initialized');
    console.log('📁 Make sure to run via web server, not file://');
    console.log('   Use: ./start-server.sh  or  python3 server.py');
} catch (e) {
    console.error('❌ Error initializing selection screen:', e);
}

function setupSelectionScreen() {
    const grid = document.querySelector('.pokemon-grid');
    if (!grid) {
        console.error('Pokemon grid not found!');
        return;
    }
    grid.innerHTML = '';

    const allPokemon = pokemonRegistry.getAll();
    console.log('Loading Pokemon cards:', allPokemon);

    allPokemon.forEach((pokemon, index) => {
        const defaultTeam = index + 1;
        pokemonTeams[pokemon.id] = defaultTeam;

        const card = createPokemonCard(pokemon, defaultTeam);
        grid.appendChild(card);
    });

    console.log('Created', allPokemon.length, 'Pokemon cards');

    document.getElementById('start-game-btn').addEventListener('click', startGame);
    document.getElementById('practice-arena-btn').addEventListener('click', startPracticeArena);
    document.getElementById('play-again-btn').addEventListener('click', () => {
        location.reload();
    });
}

function createPokemonCard(pokemon, defaultTeam) {
    const card = document.createElement('div');
    card.className = 'pokemon-card ai';
    card.dataset.pokemon = pokemon.id;

    const iconClass = `${pokemon.id}-icon`;

    card.innerHTML = `
        <div class="role-indicator ai">AI</div>
        <div class="pokemon-icon ${iconClass}">${pokemon.icon}</div>
        <h3>${pokemon.name}</h3>
        <div class="pokemon-stats">
            <span class="stat">HP: ${pokemon.stats.hp}</span>
            <span class="stat">ATK: ${pokemon.stats.attack}</span>
            <span class="stat">SPD: ${pokemon.stats.moveSpeed}</span>
        </div>
        <div class="attacks-preview">
            ${pokemon.attacks.map(attackId => {
                const attackMeta = getAttackMetadata(attackId);
                return `<div class="attack-chip" title="${attackMeta.name}: ${attackMeta.description}">${attackMeta.icon} ${attackMeta.name}</div>`;
            }).join('')}
        </div>
        <div class="team-selector">
            <button class="team-btn ${defaultTeam === 1 ? 'active' : ''}" data-team="1">1</button>
            <button class="team-btn ${defaultTeam === 2 ? 'active' : ''}" data-team="2">2</button>
            <button class="team-btn ${defaultTeam === 3 ? 'active' : ''}" data-team="3">3</button>
            <button class="team-btn ${defaultTeam === 4 ? 'active' : ''}" data-team="4">4</button>
        </div>
    `;

    const roleIndicator = card.querySelector('.role-indicator');
    const teamBtns = card.querySelectorAll('.team-btn');

    card.addEventListener('click', (e) => {
        if (e.target.closest('.team-btn')) return;

        const allCards = document.querySelectorAll('.pokemon-card');
        allCards.forEach(c => {
            c.classList.remove('selected');
            c.classList.add('ai');
            const ri = c.querySelector('.role-indicator');
            if (ri) {
                ri.textContent = 'AI';
                ri.className = 'role-indicator ai';
            }
        });

        card.classList.remove('ai');
        card.classList.add('selected');
        if (roleIndicator) {
            roleIndicator.textContent = 'PLAYER';
            roleIndicator.className = 'role-indicator player';
        }

        selectedPokemon = pokemon.id;
        updateStartButton();
    });

    teamBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            teamBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            pokemonTeams[pokemon.id] = parseInt(btn.dataset.team);
        });
    });

    return card;
}

function getAttackMetadata(attackId) {
    const attackMap = {
        flamethrower: { name: 'Flamethrower', description: 'Cone of fire', icon: '🔥' },
        scratch: { name: 'Scratch', description: 'Melee attack', icon: '🐾' },
        vinewhip: { name: 'Vine Whip', description: 'Line attack', icon: '🌿' },
        solarbeam: { name: 'Solar Beam', description: 'Charged beam', icon: '☀️' },
        razorleaf: { name: 'Razor Leaf', description: 'Leaf stream', icon: '🍃' },
        watergun: { name: 'Water Gun', description: 'Water beam', icon: '💧' },
        hydropulse: { name: 'Hydro Pulse', description: 'Water projectile', icon: '🌊' },
        quickattack: { name: 'Quick Attack', description: 'Quick dash', icon: '⚡' },
        thunderbolt: { name: 'Thunderbolt', description: 'Electric projectile', icon: '🌩️' }
    };
    return attackMap[attackId] || { name: attackId, description: '', icon: '?' };
}

function updateStartButton() {
    const btn = document.getElementById('start-game-btn');
    const practiceBtn = document.getElementById('practice-arena-btn');
    btn.disabled = !selectedPokemon;
    practiceBtn.disabled = !selectedPokemon;
}

function startGame() {
    if (!selectedPokemon) return;

    isPracticeMode = false;

    document.getElementById('selection-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';

    game = new Game();
    window.gameInstance = game;
    game.start(selectedPokemon, pokemonTeams);
}

function startPracticeArena() {
    if (!selectedPokemon) return;

    isPracticeMode = true;

    document.getElementById('selection-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';

    import('./core/practice-game.js').then(module => {
        game = new module.PracticeGame();
        window.gameInstance = game;
        game.start(selectedPokemon);
    });
}
