import { useState } from 'react';
import { Calendar, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoricalEvent {
  id: string;
  title: string;
  year: number;
  description: string;
  image: string;
  context?: string;
}

interface GameCardProps {
  event: HistoricalEvent;
  onClick: () => void;
  isSelected?: boolean;
  isRevealed?: boolean;
  isCorrect?: boolean;
  className?: string;
}

export const GameCard: React.FC<GameCardProps> = ({
  event,
  onClick,
  isSelected = false,
  isRevealed = false,
  isCorrect,
  className
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const cardStyles = cn(
    'game-card group relative w-full max-w-md mx-auto',
    'bg-card rounded-xl border border-border overflow-hidden cursor-pointer',
    'transform transition-all duration-300 ease-out',
    {
      'game-card-selected': isSelected,
      'ring-2 ring-success/50 bg-success/5': isRevealed && isCorrect,
      'ring-2 ring-error/50 bg-error/5': isRevealed && isCorrect === false,
      'cursor-default': isRevealed
    },
    className
  );

  return (
    <div className={cardStyles} onClick={!isRevealed ? onClick : undefined}>
      {/* Image Container */}
      <div className="relative aspect-[3/2] overflow-hidden bg-muted">
        <img
          src={event.image}
          alt={event.title}
          className={cn(
            'w-full h-full object-cover transition-all duration-500',
            'group-hover:scale-105',
            {
              'opacity-0': !imageLoaded,
              'opacity-100': imageLoaded
            }
          )}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
            <Calendar className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
        )}

        {/* Year overlay - only shown when revealed */}
        {isRevealed && (
          <div className="absolute top-3 right-3 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm">
            {event.year}
          </div>
        )}

        {/* Feedback overlay */}
        {isRevealed && isCorrect !== undefined && (
          <div className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/20 to-transparent',
            'flex items-end p-4'
          )}>
            <div className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
              {
                'bg-success text-success-foreground': isCorrect,
                'bg-error text-error-foreground': !isCorrect
              }
            )}>
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-2 leading-tight">
          {event.title}
        </h3>
        
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {event.description}
        </p>

        {/* Interactive elements */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {isRevealed ? event.year : 'Guess when this happened'}
          </div>
          
          {event.context && (
            <button className="inline-flex items-center gap-1 text-xs text-accent-foreground hover:text-primary transition-colors">
              <Info className="h-3 w-3" />
              More info
            </button>
          )}
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && !isRevealed && (
        <div className="absolute inset-0 bg-accent/10 border-2 border-accent rounded-xl pointer-events-none" />
      )}
    </div>
  );
};