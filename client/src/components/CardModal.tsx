import { Card } from '@game/models/Card';
import './CardModal.css';

interface CardModalProps {
  card: Card;
  onClose: () => void;
}

function CardModal({ card, onClose }: CardModalProps) {
  return (
    <div className="card-modal-overlay" onClick={onClose}>
      <div className="card-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-content">
          <div className="modal-image">
            <img src={card.imageUrl} alt={card.name} />
          </div>
          
          <div className="modal-details">
            <h2>{card.name}</h2>
            
            <div className="modal-stats">
              <div className="stat-item">
                <span className="stat-label">Check:</span>
                <span className="stat-value">{card.check}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Difficulty:</span>
                <span className="stat-value">{card.difficulty}</span>
              </div>
              {card.baseBlockZone && (
                <div className="stat-item">
                  <span className="stat-label">Block Zone:</span>
                  <span className="stat-value">{card.baseBlockZone}</span>
                </div>
              )}
              {card.blockModifier !== 0 && (
                <div className="stat-item">
                  <span className="stat-label">Block:</span>
                  <span className="stat-value">{card.blockModifier > 0 ? '+' : ''}{card.blockModifier}</span>
                </div>
              )}
            </div>

            {card.keywords.length > 0 && (
              <div className="modal-keywords">
                {card.keywords.map((keyword, i) => (
                  <span key={i} className="keyword-badge">{keyword}</span>
                ))}
              </div>
            )}

            <div className="modal-text">
              {card.text}
            </div>

            <div className="modal-symbols">
              {card.symbols.map((symbol, i) => (
                <span key={i} className="symbol-badge">{symbol}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardModal;
