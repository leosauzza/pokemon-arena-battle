// ==========================================
// UI MANAGER
// ==========================================

import { TeamColors, PokemonTypes } from '../utils/constants.js';
import { DamageNumbers } from './damage-numbers.js';
import { formatCooldown } from '../utils/helpers.js';

export class UIManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.players = [];
        this.damageNumbers = new DamageNumbers(scene, camera);
    }
    
    setPlayers(players) {
        this.players = players;
        this.createHealthBars();
    }
    
    /**
     * Create health bars for all players
     */
    createHealthBars() {
        const container = document.getElementById('health-bars');
        container.innerHTML = '';
        
        this.players.forEach(player => {
            const bar = document.createElement('div');
            bar.className = `health-bar ${player.isAI ? '' : 'self'}`;
            bar.id = `hp-bar-${player.id}`;
            
            const color = TeamColors[player.team];
            const textColor = player.team === 4 ? '#000' : '#fff';
            
            bar.innerHTML = `
                <div class="team-indicator" style="background: ${color}; color: ${textColor}">${player.team}</div>
                <div class="health-bar-name">${PokemonTypes[player.type].name}</div>
                <div class="health-bar-outer">
                    <div class="health-bar-inner high" style="width: 100%"></div>
                </div>
                <div class="health-bar-hp">40/40</div>
            `;
            
            container.appendChild(bar);
        });
    }
    
    /**
     * Create attack bar for player
     */
    createAttackBar(player) {
        const container = document.getElementById('attack-bar');
        container.innerHTML = '';
        
        player.attacks.forEach((attack, index) => {
            const slot = document.createElement('div');
            slot.className = 'attack-slot';
            slot.id = `attack-slot-${index}`;
            slot.dataset.index = index;
            slot.dataset.key = attack.keyBinding;
            
            slot.innerHTML = `
                <div class="attack-key">${attack.keyBinding}</div>
                <div class="attack-icon">${attack.icon}</div>
                <div class="attack-name">${attack.name}</div>
                <div class="attack-cooldown-overlay"></div>
                <div class="attack-cooldown-text"></div>
            `;
            
            container.appendChild(slot);
        });
        
        // Add selection indicator
        this.updateAttackSelection(player.selectedAttackIndex);
    }
    
    /**
     * Update attack selection highlight
     */
    updateAttackSelection(selectedIndex) {
        document.querySelectorAll('.attack-slot').forEach((slot, index) => {
            if (index === selectedIndex) {
                slot.classList.add('selected');
            } else {
                slot.classList.remove('selected');
            }
        });
    }
    
    /**
     * Update UI each frame
     */
    update() {
        this.updateHealthBars();
        this.updateAttackBar();
        this.damageNumbers.update(0.016);
    }
    
    /**
     * Update health bars
     */
    updateHealthBars() {
        this.players.forEach(player => {
            const bar = document.getElementById(`hp-bar-${player.id}`);
            if (bar) {
                const fill = bar.querySelector('.health-bar-inner');
                const hpText = bar.querySelector('.health-bar-hp');
                const ratio = player.hp / player.maxHp;
                
                fill.style.width = `${ratio * 100}%`;
                fill.className = 'health-bar-inner';
                if (ratio > 0.6) fill.classList.add('high');
                else if (ratio > 0.3) fill.classList.add('medium');
                else fill.classList.add('low');
                
                hpText.textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
                
                if (!player.isAlive) {
                    bar.style.opacity = '0.3';
                }
            }
        });
    }
    
    /**
     * Update attack cooldowns
     */
    updateAttackBar() {
        const player = this.players.find(p => !p.isAI);
        if (!player) return;
        
        player.attacks.forEach((attack, index) => {
            const slot = document.getElementById(`attack-slot-${index}`);
            if (slot) {
                const overlay = slot.querySelector('.attack-cooldown-overlay');
                const text = slot.querySelector('.attack-cooldown-text');
                
                if (attack.currentCooldown > 0) {
                    const pct = (attack.currentCooldown / attack.cooldown) * 100;
                    overlay.style.height = `${pct}%`;
                    text.textContent = formatCooldown(attack.currentCooldown);
                    slot.classList.add('on-cooldown');
                } else {
                    overlay.style.height = '0%';
                    text.textContent = '';
                    slot.classList.remove('on-cooldown');
                }
            }
        });
    }
    
    /**
     * Show damage number
     */
    showDamage(amount, position, isCritical = false) {
        this.damageNumbers.showDamage(amount, position, isCritical);
    }
    
    /**
     * Show game over screen
     */
    showGameOver(playerWon, winningTeam, winner) {
        const gameOverScreen = document.getElementById('game-over-screen');
        const title = document.getElementById('game-over-title');
        const message = document.getElementById('game-over-message');
        
        gameOverScreen.style.display = 'flex';
        
        if (playerWon) {
            gameOverScreen.className = 'winner';
            title.textContent = 'Game End';
            message.textContent = 'Win';
        } else {
            gameOverScreen.className = 'loser';
            title.textContent = 'Game End';
            message.textContent = 'Lose';
        }
    }
    
    /**
     * Show/hide attack preview notification
     */
    showAttackPreviewNotification(attackName) {
        const notif = document.getElementById('attack-preview-notification');
        notif.textContent = `${attackName} - Click to cast`;
        notif.classList.add('visible');
        
        setTimeout(() => {
            notif.classList.remove('visible');
        }, 2000);
    }
    
    hideAttackPreviewNotification() {
        const notif = document.getElementById('attack-preview-notification');
        notif.classList.remove('visible');
    }
}
