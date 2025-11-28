/**
 * Game phases and turn structure for Universus.
 * Implements the three main phases: Review, Ready, and Combat.
 */

import { Player } from '../models/Player';

export enum GamePhase {
  REVIEW = 'review',
  READY = 'ready',
  COMBAT = 'combat',
  END = 'end'
}

export enum TurnStep {
  // Review Phase
  REVIEW_START = 'review_start',
  REVIEW_DISCARD = 'review_discard',
  REVIEW_DRAW = 'review_draw',
  
  // Ready Phase
  READY_START = 'ready_start',
  READY_CARDS = 'ready_cards',
  READY_MAIN = 'ready_main',
  
  // Combat Phase
  COMBAT_START = 'combat_start',
  COMBAT_DECLARE_ATTACK = 'combat_declare_attack',
  COMBAT_ENHANCE = 'combat_enhance',
  COMBAT_BLOCK = 'combat_block',
  COMBAT_REVEAL = 'combat_reveal',
  COMBAT_DAMAGE = 'combat_damage',
  COMBAT_END = 'combat_end',
  
  // End
  TURN_END = 'turn_end'
}

export interface GameState {
  currentPhase: GamePhase;
  currentStep: TurnStep;
  activePlayerId: number;
  turnNumber: number;
  priorityPlayerId: number | null;
}

/**
 * Manages game phases and turn progression
 */
export class TurnManager {
  private phase: GamePhase = GamePhase.REVIEW;
  private step: TurnStep = TurnStep.REVIEW_START;
  private turnNumber: number = 0;

  constructor(
    private activePlayer: Player,
    private opponent: Player
  ) {}

  getCurrentPhase(): GamePhase {
    return this.phase;
  }

  getCurrentStep(): TurnStep {
    return this.step;
  }

  getTurnNumber(): number {
    return this.turnNumber;
  }

  getActivePlayer(): Player {
    return this.activePlayer;
  }

  getOpponent(): Player {
    return this.opponent;
  }

  /**
   * Start a new turn
   */
  startTurn(): void {
    this.turnNumber++;
    this.phase = GamePhase.REVIEW;
    this.step = TurnStep.REVIEW_START;
  }

  /**
   * Process Review Phase
   */
  async processReviewPhase(): Promise<void> {
    this.phase = GamePhase.REVIEW;
    this.step = TurnStep.REVIEW_START;

    // Step 1: Discard hand
    this.step = TurnStep.REVIEW_DISCARD;
    this.activePlayer.discardHand();

    // Step 2: Draw cards to hand size
    this.step = TurnStep.REVIEW_DRAW;
    this.activePlayer.drawToHandSize();
  }

  /**
   * Process Ready Phase
   */
  async processReadyPhase(): Promise<void> {
    this.phase = GamePhase.READY;
    this.step = TurnStep.READY_START;

    // Step 1: Ready all cards
    this.step = TurnStep.READY_CARDS;
    this.activePlayer.readyAllCards();

    // Step 2: Main phase - play foundations, assets, etc.
    this.step = TurnStep.READY_MAIN;
    // This is where players would play cards
    // Implementation depends on game UI/input system
  }

  /**
   * Start Combat Phase
   */
  startCombatPhase(): void {
    this.phase = GamePhase.COMBAT;
    this.step = TurnStep.COMBAT_START;
  }

  /**
   * End the current turn
   */
  endTurn(): void {
    this.phase = GamePhase.END;
    this.step = TurnStep.TURN_END;
    
    // Switch active player
    [this.activePlayer, this.opponent] = [this.opponent, this.activePlayer];
  }

  /**
   * Advance to next phase
   */
  advancePhase(): void {
    switch (this.phase) {
      case GamePhase.REVIEW:
        this.phase = GamePhase.READY;
        this.step = TurnStep.READY_START;
        break;
      case GamePhase.READY:
        this.phase = GamePhase.COMBAT;
        this.step = TurnStep.COMBAT_START;
        break;
      case GamePhase.COMBAT:
        this.endTurn();
        break;
      case GamePhase.END:
        this.startTurn();
        break;
    }
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    return {
      currentPhase: this.phase,
      currentStep: this.step,
      activePlayerId: this.activePlayer.id,
      turnNumber: this.turnNumber,
      priorityPlayerId: this.activePlayer.id
    };
  }
}

/**
 * Represents an attack in the Combat Phase
 */
export interface AttackState {
  attackerId: number;
  defenderId: number;
  attackCard: any; // AttackCard
  enhancements: any[]; // Enhancement cards
  blockCard: any | null;
  speed: number;
  damage: number;
  resolved: boolean;
}

/**
 * Manages combat resolution
 */
export class CombatManager {
  private currentAttack: AttackState | null = null;

  hasActiveAttack(): boolean {
    return this.currentAttack !== null && !this.currentAttack.resolved;
  }

  getCurrentAttack(): AttackState | null {
    return this.currentAttack;
  }

  /**
   * Declare an attack
   */
  declareAttack(attackerId: number, defenderId: number, attackCard: any): void {
    this.currentAttack = {
      attackerId,
      defenderId,
      attackCard,
      enhancements: [],
      blockCard: null,
      speed: attackCard.speed,
      damage: attackCard.damage,
      resolved: false
    };
  }

  /**
   * Add enhancement to current attack
   */
  addEnhancement(enhancement: any): void {
    if (this.currentAttack) {
      this.currentAttack.enhancements.push(enhancement);
    }
  }

  /**
   * Declare a block
   */
  declareBlock(blockCard: any): void {
    if (this.currentAttack) {
      this.currentAttack.blockCard = blockCard;
    }
  }

  /**
   * Resolve the attack
   */
  resolveAttack(): void {
    if (this.currentAttack) {
      this.currentAttack.resolved = true;
    }
  }

  /**
   * Clear current attack
   */
  clearAttack(): void {
    this.currentAttack = null;
  }
}
