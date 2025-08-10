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
    <div className={cn('flex items-center justify-center', className)}>
      <span className={cn(
        'text-2xl font-bold text-foreground',
        { 'score-celebration': isAnimating }
      )}>
        {score}
      </span>
    </div>
  );
};