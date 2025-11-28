import { useState } from 'react';
import type { Player } from '@game/models/Player';
import type { Card } from '@game/models/Card';
import CardModal from './CardModal';
import { CheckPanel } from './CheckPanel';
import type { CheckState } from './CheckPanel';
import './PlayerArea.css';

interface PlayerAreaProps {
  player: Player;
  isActive: boolean;
  isOpponent: boolean;
  onUpdate?: () => void;
  onCheckStateChange?: (checkState: CheckState | null) => void;
}

function PlayerArea({ player, isOpponent, onUpdate, onCheckStateChange }: PlayerAreaProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [checkState, setCheckState] = useState<CheckState | null>(null);
  const [millCount, setMillCount] = useState<string>('1');
  const character = player.character;
  const health = player.getHealth();
  const maxHealth = player.getMaxHealth();

  // Notify parent of check state changes
  const updateCheckState = (newState: CheckState | null) => {
    setCheckState(newState);
    onCheckStateChange?.(newState);
  };

  // Generate health tracker numbers
  const healthNumbers = Array.from({ length: maxHealth + 1 }, (_, i) => i);

  return (
    <div className={`player-area ${isOpponent ? 'opponent' : 'self'}`}>
      {/* Health Tracker */}
      <div className="health-tracker">
        <div className="health-icon">❤️</div>
        {healthNumbers.map((num) => (
          <div 
            key={num} 
            className={`health-number ${num <= health ? 'active' : 'inactive'}`}
          >
            {num}
          </div>
        ))}
      </div>

      <div className="playmat">
        {/* Left Side - Character & Momentum */}
        <div className="left-section">
          <div className="character-slot">
            <div className="character-label">CHARACTER</div>
            {character && (
              <div className="character-card">
                <div className="character-name">{character.name}</div>
                <div className="character-stats">
                  <div>Hand: {character.handSize}</div>
                  <div>HP: {maxHealth}</div>
                </div>
              </div>
            )}
          </div>

          <div className="momentum-area">
            <div className="momentum-label">MOMENTUM</div>
            <div className="momentum-cards">
              {Array.from({ length: player.momentum }).map((_, i) => (
                <div key={i} className="momentum-card" style={{ top: `${i * 3}px` }}>
                  {i + 1}
                </div>
              ))}
              {player.momentum === 0 && (
                <div className="momentum-empty">0</div>
              )}
            </div>
          </div>
        </div>

        {/* Center - Card Pool & Stage */}
        <div className="center-section">
          <div className="card-pool-label">CARD POOL</div>

          {/* Card Pool Area - Any cards can be placed here, stacks if more than 6 */}
          <div className="card-pool-container">
            {(() => {
              const cards = Array.from(player.cardPool.getCards());
              const filledSlots = cards.length;
              
              // Determine which set of slots to show
              let currentSet = Math.floor(filledSlots / 6);
              const totalSlots = (currentSet + 1) * 6;
              
              // Determine condensed state for each card
              const getCondensedClass = (index: number) => {
                const setNumber = Math.floor(index / 6);
                const setFilledCount = cards.filter((_, i) => Math.floor(i / 6) === setNumber).length;
                
                // Don't condense the last card in a set until the next slot is filled
                const isLastInSet = index % 6 === 5;
                const nextSlotFilled = cards[index + 1] !== undefined;
                
                if (isLastInSet && !nextSlotFilled) {
                  return ''; // Keep last card full size until next slot filled
                }
                
                return setFilledCount >= 6 ? 'condensed' : '';
              };
              
              return (
                <div className="card-pool-row">
                  {Array.from({ length: totalSlots }).map((_, cardIndex) => {
                    const card = cards[cardIndex];
                    const condensedClass = getCondensedClass(cardIndex);
                    
                    if (card) {
                      return (
                        <div 
                          key={card.id} 
                          className={`pool-card ${condensedClass} ${draggedCard?.id === card.id ? 'dragging' : ''} ${dragOverSlot === cardIndex ? 'drag-over' : ''}`}
                          draggable={!isOpponent}
                          onDragStart={(e) => {
                            setDraggedCard(card);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => {
                            setDraggedCard(null);
                            setDragOverSlot(null);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            setDragOverSlot(cardIndex);
                          }}
                          onDragLeave={() => {
                            setDragOverSlot(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverSlot(null);
                            if (draggedCard && draggedCard.id !== card.id && !isOpponent) {
                              // Move card from hand to card pool
                              if (player.hand.contains(draggedCard)) {
                                player.hand.remove(draggedCard);
                                player.cardPool.add(draggedCard);
                                
                                // Trigger check panel for the card being played
                                updateCheckState({
                                  cardBeingPlayed: draggedCard,
                                  revealedCheckCard: null,
                                  requiredDifficulty: draggedCard.difficulty,
                                  foundationsCommitted: 0,
                                  isCheckPassed: null
                                });
                                
                                setDraggedCard(null);
                                onUpdate?.();
                              }
                              // Move card within card pool (reordering)
                              else if (player.cardPool.contains(draggedCard)) {
                                console.log(`Reordering ${draggedCard.name} to slot ${cardIndex}`);
                                // Card pool doesn't support specific positioning yet, just stacks
                                onUpdate?.();
                              }
                            }
                          }}
                          onClick={() => setSelectedCard(card)}
                        >
                          <div className="progressive-diff">+{cardIndex}</div>
                          {card.imageUrl ? (
                            <img 
                              src={card.imageUrl} 
                              alt={card.name} 
                              className="card-image"
                              draggable={false}
                            />
                          ) : (
                            <div className="card-name">{card.name}</div>
                          )}
                        </div>
                      );
                    } else if (cardIndex < totalSlots) {
                      return (
                        <div 
                          key={`empty-${cardIndex}`} 
                          className={`card-pool-placeholder ${condensedClass} ${dragOverSlot === cardIndex ? 'drag-over' : ''}`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            setDragOverSlot(cardIndex);
                          }}
                          onDragLeave={() => {
                            setDragOverSlot(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverSlot(null);
                            if (draggedCard && !isOpponent) {
                              // Move card from hand to card pool
                              if (player.hand.contains(draggedCard)) {
                                player.hand.remove(draggedCard);
                                player.cardPool.add(draggedCard);
                                
                                // Trigger check panel for the card being played
                                updateCheckState({
                                  cardBeingPlayed: draggedCard,
                                  revealedCheckCard: null,
                                  requiredDifficulty: draggedCard.difficulty,
                                  foundationsCommitted: 0,
                                  isCheckPassed: null
                                });
                                
                                setDraggedCard(null);
                                onUpdate?.();
                              }
                            }
                          }}
                        >
                          <div className="progressive-diff">+{cardIndex}</div>
                        </div>
                      );
                    } else {
                      return null;
                    }
                  })}
                </div>
              );
            })()}
          </div>

          {/* Stage Area */}
          <div className="stage-area">
            <div className="staging-cards">
              {Array.from(player.stagingArea.getCards()).map((card) => (
                <div key={card.id} className="staged-card">
                  {card.name}
                </div>
              ))}
            </div>
          </div>
          <div className="stage-label">STAGE</div>

        </div>

        {/* Right Side - Discard, Deck & Removed */}
        <div className="right-section">
          <div className="discard-pile">
            <div className="pile-label">DISCARD</div>
            <div className="pile-stack">
              {player.discard.count() > 0 ? (
                <>
                  <div 
                    className="pile-card"
                    onClick={() => {
                      const topCard = Array.from(player.discard.getCards()).pop();
                      if (topCard) setSelectedCard(topCard);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {(() => {
                      const topCard = Array.from(player.discard.getCards()).pop();
                      return topCard?.imageUrl ? (
                        <img 
                          src={topCard.imageUrl} 
                          alt={topCard.name}
                          className="pile-card-image"
                        />
                      ) : null;
                    })()}
                  </div>
                  <div className="pile-count-badge">{player.discard.count()}</div>
                </>
              ) : (
                <div className="pile-placeholder"></div>
              )}
            </div>
          </div>

          <div className="deck-pile">
            <div className="pile-label">DECK</div>
            <div className="pile-stack">
              {player.deck.count() > 0 ? (
                <>
                  <div className="pile-card deck">
                    <img 
                      src="/images/cards/card-back.png" 
                      alt="Deck"
                      className="pile-card-image"
                    />
                  </div>
                  <div className="pile-count-badge">{player.deck.count()}</div>
                </>
              ) : (
                <div className="pile-placeholder"></div>
              )}
            </div>
            {!isOpponent && player.deck.count() > 0 && (
              <div className="deck-actions">
                <div className="mill-controls">
                  <input 
                    type="number"
                    min="1"
                    max={player.deck.count()}
                    value={millCount}
                    onChange={(e) => setMillCount(e.target.value)}
                    className="mill-input"
                    title="Number of cards to mill"
                  />
                  <button 
                    className="mill-button"
                    onClick={() => {
                      const count = Math.min(parseInt(millCount) || 1, player.deck.count());
                      for (let i = 0; i < count; i++) {
                        const card = player.deck.draw();
                        if (card) player.discard.add(card);
                      }
                      onUpdate?.();
                    }}
                    title="Mill cards from deck to discard pile"
                  >
                    Mill
                  </button>
                </div>
                <button 
                  className="check-button"
                  onClick={() => {
                    // Perform check if check panel is active
                    if (checkState && !checkState.revealedCheckCard) {
                      const card = player.deck.draw();
                      if (card) {
                        player.discard.add(card);
                        updateCheckState({
                          ...checkState,
                          revealedCheckCard: card
                        });
                        onUpdate?.();
                      }
                    }
                  }}
                  disabled={!checkState || checkState.revealedCheckCard !== null}
                  title="Perform check (reveal top deck card)"
                >
                  Check
                </button>
              </div>
            )}
          </div>

          <div className="removed-pile">
            <div className="pile-label">REMOVED</div>
            <div className="pile-stack removed">
              {player.removed.count() > 0 ? (
                <>
                  <div className="pile-card"></div>
                  <div className="pile-count-badge">{player.removed.count()}</div>
                </>
              ) : (
                <div className="pile-placeholder"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hand Area - Below the playmat */}
      <div className="hand-area">
        <div className="hand-label">{player.name}'s Hand ({player.hand.count()} cards)</div>
        <div className="hand-cards">
          {Array.from(player.hand.getCards()).map((card) => (
            <div 
              key={card.id} 
              className={`hand-card ${draggedCard?.id === card.id ? 'dragging' : ''}`}
              draggable={!isOpponent}
              onDragStart={(e) => {
                setDraggedCard(card);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={() => setDraggedCard(null)}
              onClick={() => setSelectedCard(card)}
            >
              {card.imageUrl ? (
                <img 
                  src={card.imageUrl} 
                  alt={card.name} 
                  className="hand-card-image"
                  draggable={false}
                />
              ) : (
                <>
                  <div className="hand-card-name">{card.name}</div>
                  <div className="hand-card-stats">
                    <span>Diff: {card.difficulty}</span>
                    <span>Check: {card.check}</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedCard && (
        <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}

export default PlayerArea;
