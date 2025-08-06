import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  current,
  total,
  className
}) => {
  const progress = (current / total) * 100;

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div 
          className="progress-fill h-full bg-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Progress text */}
      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
        <span>Question {current}</span>
        <span>of {total}</span>
      </div>
    </div>
  );
};