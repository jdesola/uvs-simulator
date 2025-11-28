/**
 * Main Game Engine for Universus Simulator.
 * Orchestrates game flow, player actions, and state management.
 */

import { Player } from '../models/Player';
import { Card, AttackCard, FoundationCard, ActionCard, AssetCard } from '../models/Card';
import { TurnManager, CombatManager, GamePhase, GameState } from './GamePhases';

export enum GameStatus {
  SETUP = 'setup',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished'
}

export interface GameConfig {
  player1Name: string;
  player2Name: string;
  startingPlayer: 1 | 2;
}

/**
 * Main game engine that manages the entire game state
 */
export class GameEngine {
  private player1: Player;
  private player2: Player;
  private turnManager: TurnManager;
  private combatManager: CombatManager;
  private status: GameStatus = GameStatus.SETUP;
  private winner: Player | null = null;

  constructor(config: GameConfig) {
    this.player1 = new Player(1, config.player1Name);
    this.player2 = new Player(2, config.player2Name);

    const startingPlayer = config.startingPlayer === 1 ? this.player1 : this.player2;
    const otherPlayer = config.startingPlayer === 1 ? this.player2 : this.player1;

    this.turnManager = new TurnManager(startingPlayer, otherPlayer);
    this.combatManager = new CombatManager();
  }

  /**
   * Randomly determine which player gets to choose who goes first.
   * Returns the player ID (1 or 2) who won the roll and gets to decide turn order.
   */
  static rollForFirstPlayer(): number {
    return Math.random() < 0.5 ? 1 : 2;
  }

  /**
   * Get a player by ID
   */
  getPlayer(playerId: number): Player {
    return playerId === 1 ? this.player1 : this.player2;
  }

  /**
   * Get current game status
   */
  getStatus(): GameStatus {
    return this.status;
  }

  /**
   * Get current game state
   */
  getGameState(): GameState {
    return this.turnManager.getState();
  }

  /**
   * Get the winner (if game is finished)
   */
  getWinner(): Player | null {
    return this.winner;
  }

  /**
   * Start the game
   */
  startGame(): void {
    if (this.status !== GameStatus.SETUP) {
      throw new Error('Game has already started');
    }

    // Both players draw opening hand
    this.player1.drawCards(this.player1.getHandSize());
    this.player2.drawCards(this.player2.getHandSize());

    this.status = GameStatus.IN_PROGRESS;
    this.turnManager.startTurn();
  }

  /**
   * Process the current turn phase
   */
  async processTurn(): Promise<void> {
    const phase = this.turnManager.getCurrentPhase();

    switch (phase) {
      case GamePhase.REVIEW:
        await this.turnManager.processReviewPhase();
        this.turnManager.advancePhase();
        break;
      case GamePhase.READY:
        await this.turnManager.processReadyPhase();
        // Ready phase requires player input
        break;
      case GamePhase.COMBAT:
        // Combat requires player actions
        break;
      case GamePhase.END:
        this.checkWinConditions();
        if (this.status === GameStatus.IN_PROGRESS) {
          this.turnManager.advancePhase(); // Start next turn
        }
        break;
    }
  }

  /**
   * Play a foundation card
   */
  playFoundation(playerId: number, card: FoundationCard): boolean {
    const player = this.getPlayer(playerId);
    const phase = this.turnManager.getCurrentPhase();

    if (phase !== GamePhase.READY) {
      return false;
    }

    if (!player.hand.contains(card)) {
      return false;
    }

    // Move card from hand to play area
    player.hand.remove(card);
    player.playArea.add(card);

    return true;
  }

  /**
   * Play an asset card
   */
  playAsset(playerId: number, card: AssetCard): boolean {
    const player = this.getPlayer(playerId);
    const phase = this.turnManager.getCurrentPhase();

    if (phase !== GamePhase.READY) {
      return false;
    }

    if (!player.hand.contains(card)) {
      return false;
    }

    // TODO: Check resource requirements
    // For now, simplified version

    player.hand.remove(card);
    player.playArea.add(card);

    return true;
  }

  /**
   * Declare an attack
   */
  declareAttack(attackerId: number, attackCard: AttackCard): boolean {
    const attacker = this.getPlayer(attackerId);
    const defender = this.getPlayer(attackerId === 1 ? 2 : 1);
    const phase = this.turnManager.getCurrentPhase();

    if (phase !== GamePhase.COMBAT) {
      return false;
    }

    if (!attacker.hand.contains(attackCard)) {
      return false;
    }

    // Note: Zone cost checking would go here if needed

    // Move attack to staging area
    attacker.hand.remove(attackCard);
    attacker.stagingArea.add(attackCard);

    // Initialize attack state
    this.combatManager.declareAttack(attackerId, defender.id, attackCard);

    return true;
  }

  /**
   * Declare a block
   */
  declareBlock(defenderId: number, blockCard: Card): boolean {
    const defender = this.getPlayer(defenderId);

    if (!this.combatManager.hasActiveAttack()) {
      return false;
    }

    if (!defender.hand.contains(blockCard)) {
      return false;
    }

    defender.hand.remove(blockCard);
    defender.stagingArea.add(blockCard);

    this.combatManager.declareBlock(blockCard);

    return true;
  }

  /**
   * Perform a control check
   */
  performCheck(playerId: number, difficulty: number): { success: boolean; total: number } {
    const player = this.getPlayer(playerId);
    
    // Reveal cards from deck to card pool
    const revealedCards: Card[] = [];
    let totalControl = 0;

    while (totalControl < difficulty && !player.deck.isEmpty()) {
      const card = player.deck.draw();
      if (card) {
        revealedCards.push(card);
        player.cardPool.add(card);
        totalControl += card.check;
      } else {
        break;
      }
    }

    const success = totalControl >= difficulty;

    return { success, total: totalControl };
  }

  /**
   * Advance to next phase
   */
  advancePhase(): void {
    this.turnManager.advancePhase();
  }

  /**
   * End the current turn
   */
  endTurn(): void {
    this.turnManager.endTurn();
    this.checkWinConditions();
  }

  /**
   * Check win conditions
   */
  private checkWinConditions(): void {
    if (this.player1.isDefeated()) {
      this.status = GameStatus.FINISHED;
      this.winner = this.player2;
    } else if (this.player2.isDefeated()) {
      this.status = GameStatus.FINISHED;
      this.winner = this.player1;
    }
  }

  /**
   * Commit foundations for an attack
   */
  commitFoundations(playerId: number, foundations: FoundationCard[]): boolean {
    const player = this.getPlayer(playerId);
    
    for (const foundation of foundations) {
      if (!player.playArea.contains(foundation)) {
        return false;
      }
      player.playArea.commitCard(foundation);
    }

    return true;
  }

  /**
   * Get current active player
   */
  getActivePlayer(): Player {
    return this.turnManager.getActivePlayer();
  }

  /**
   * Get opponent of active player
   */
  getOpponent(): Player {
    return this.turnManager.getOpponent();
  }
}
