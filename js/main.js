// ==========================================
// MAIN ENTRY POINT
// ==========================================

import { Game } from './core/game.js';

// Game instance
let game = null;
let isPracticeMode = false;

// Selection state
let selectedPokemon = null;
let pokemonTeams = {
    charmander: 1,
    bulbasaur: 2,
    squirtle: 3,
    pikachu: 4
};

// Initialize selection screen
// Note: Since this is a module script, it runs after DOM is ready
try {
    setupSelectionScreen();
    
    // Ensure game UI is hidden and selection is visible
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
    const cards = document.querySelectorAll('.pokemon-card');
    
    if (cards.length === 0) {
        console.error('No pokemon cards found!');
        return;
    }
    
    cards.forEach(card => {
        const pokemon = card.dataset.pokemon;
        const roleIndicator = card.querySelector('.role-indicator');
        const teamBtns = card.querySelectorAll('.team-btn');
        
        if (!pokemon) {
            console.error('Card missing data-pokemon attribute', card);
            return;
        }
        
        // Set default team button active
        const defaultTeam = pokemonTeams[pokemon];
        teamBtns.forEach(btn => {
            if (parseInt(btn.dataset.team) === defaultTeam) {
                btn.classList.add('active');
            }
        });
        
        // Pokemon selection - use the card element directly
        card.addEventListener('click', (e) => {
            // Check if clicked on team button or inside team button
            if (e.target.closest('.team-btn')) {
                return;
            }
            
            console.log('Selected pokemon:', pokemon);
            
            // Deselect all
            cards.forEach(c => {
                c.classList.remove('selected');
                c.classList.add('ai');
                const ri = c.querySelector('.role-indicator');
                if (ri) {
                    ri.textContent = 'AI';
                    ri.className = 'role-indicator ai';
                }
            });
            
            // Select this one
            card.classList.remove('ai');
            card.classList.add('selected');
            if (roleIndicator) {
                roleIndicator.textContent = 'PLAYER';
                roleIndicator.className = 'role-indicator player';
            }
            
            selectedPokemon = pokemon;
            updateStartButton();
        });
        
        // Team selection - attach to each button individually
        teamBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Team button clicked for', pokemon, 'team', btn.dataset.team);
                
                // Remove active from all buttons in this card
                teamBtns.forEach(b => b.classList.remove('active'));
                // Add active to clicked button
                btn.classList.add('active');
                
                // Update team
                pokemonTeams[pokemon] = parseInt(btn.dataset.team);
            });
        });
    });
    
    // Start game button
    document.getElementById('start-game-btn').addEventListener('click', startGame);
    
    // Practice arena button
    document.getElementById('practice-arena-btn').addEventListener('click', startPracticeArena);
    
    // Play again button
    document.getElementById('play-again-btn').addEventListener('click', () => {
        location.reload();
    });
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
    
    // Hide selection screen
    document.getElementById('selection-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    
    // Initialize game
    game = new Game();
    window.gameInstance = game;
    game.start(selectedPokemon, pokemonTeams);
}

function startPracticeArena() {
    if (!selectedPokemon) return;
    
    isPracticeMode = true;
    
    // Hide selection screen
    document.getElementById('selection-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    
    // Initialize practice game
    import('./core/practice-game.js').then(module => {
        game = new module.PracticeGame();
        window.gameInstance = game;
        game.start(selectedPokemon);
    });
}
