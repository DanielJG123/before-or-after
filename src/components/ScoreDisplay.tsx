import { Trophy, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScoreDisplayProps {
  score: number;
  streak: number;
  total: number;
  className?: string;
  isAnimating?: boolean;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  streak,
  total,
  className,
  isAnimating = false
}) => {
  return (
    <div className={cn('flex items-center gap-6', className)}>
      {/* Score */}
      <div className={cn(
        'flex items-center gap-2 px-6 py-3 bg-card rounded-full border shadow-sm',
        { 'score-celebration': isAnimating }
      )}>
        <Target className="h-5 w-5 text-primary" />
        <span className="text-lg font-bold text-primary">
          {score}
        </span>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className={cn(
          'flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full border border-accent/30',
          { 'score-celebration': isAnimating }
        )}>
          <Zap className="h-4 w-4 text-accent-foreground" />
          <span className="text-sm font-medium text-accent-foreground">
            {streak} streak
          </span>
        </div>
      )}
    </div>
  );
};