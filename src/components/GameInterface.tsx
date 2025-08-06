import { useEffect, useState } from 'react';
import { ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameCard } from './GameCard';
import { ScoreDisplay } from './ScoreDisplay';
import { ProgressIndicator } from './ProgressIndicator';
import { useGameState, GAME_TOTAL_QUESTIONS } from '@/hooks/useGameState';
import { toast } from '@/hooks/use-toast';

export const GameInterface: React.FC = () => {
  console.log('GameInterface rendering...');
  
  const gameState = useGameState();
  console.log('Game state:', gameState);
  
  const {
    leftEvent,
    rightEvent,
    score,
    streak,
    questionsAnswered,
    isRevealed,
    selectedAnswer,
    isCorrect,
    selectAnswer,
    nextQuestion,
    resetGame
  } = gameState;

  const [scoreAnimating, setScoreAnimating] = useState(false);
  const isGameComplete = questionsAnswered >= GAME_TOTAL_QUESTIONS;

  console.log('Left event:', leftEvent);
  console.log('Right event:', rightEvent);
  console.log('Is game complete:', isGameComplete);

  // Show debug info if no events
  if (!leftEvent || !rightEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-foreground">Loading Game...</div>
          <div className="text-muted-foreground">
            Debug: leftEvent is {leftEvent ? 'available' : 'null'}, rightEvent is {rightEvent ? 'available' : 'null'}
          </div>
          <div className="text-sm text-muted-foreground">
            Check console for more details
          </div>
        </div>
      </div>
    );
  }

  if (isGameComplete) {
    const accuracy = Math.round((score / GAME_TOTAL_QUESTIONS) * 100);
    const grade = accuracy >= 80 ? '🏆 Expert' : accuracy >= 60 ? '🎯 Great' : accuracy >= 40 ? '📚 Good' : '🌱 Learning';

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <Trophy className="h-16 w-16 text-accent mx-auto" />
            <h1 className="text-3xl font-bold text-foreground">Game Complete!</h1>
            <p className="text-muted-foreground">Nice work exploring history!</p>
          </div>

          <div className="bg-card rounded-xl p-6 border shadow-sm space-y-4">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">{score}/{GAME_TOTAL_QUESTIONS}</div>
              <div className="text-lg text-muted-foreground">{accuracy}% accuracy</div>
              <div className="text-sm text-accent-foreground font-medium">{grade}</div>
            </div>
            
            {streak > 2 && (
              <div className="bg-accent/20 rounded-lg p-3 border border-accent/30">
                <div className="text-sm font-medium text-accent-foreground">
                  Best streak: {streak} correct in a row! 🔥
                </div>
              </div>
            )}
          </div>

          <Button onClick={resetGame} size="lg" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Play Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">Before or After?</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={resetGame}
              className="gap-2"
            >
              <RotateCcw className="h-3 w-3" />
              New Game
            </Button>
          </div>

          <div className="space-y-4">
            <ProgressIndicator 
              current={questionsAnswered + 1} 
              total={GAME_TOTAL_QUESTIONS} 
            />
            <ScoreDisplay
              score={score}
              streak={streak}
              total={questionsAnswered}
              isAnimating={scoreAnimating}
              className="justify-center"
            />
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Did this happen before or after?
          </h2>
          <p className="text-muted-foreground">
            Compare the right event to the left event
          </p>
        </div>

        {/* Game Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Left Event (Reference) */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-sm font-medium text-muted-foreground">Reference Event</span>
            </div>
            <GameCard
              event={leftEvent}
              onClick={() => {}}
              isSelected={false}
              isRevealed={true}
              isCorrect={undefined}
              className="opacity-90"
            />
          </div>
          
          {/* Right Event (To Compare) */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-sm font-medium text-muted-foreground">
                {isRevealed ? 'Compared Event' : 'Did this happen...'}
              </span>
            </div>
            <GameCard
              event={rightEvent}
              onClick={() => {}}
              isSelected={false}
              isRevealed={isRevealed}
              isCorrect={isCorrect}
              className={isRevealed ? '' : 'relative'}
            />
            
            {/* Before/After Buttons */}
            {!isRevealed && (
              <div className="flex gap-4 justify-center mt-6">
                <Button
                  onClick={() => selectAnswer('before')}
                  size="lg"
                  variant="outline"
                  className="flex-1 max-w-[140px] h-12"
                >
                  Before
                </Button>
                <Button
                  onClick={() => selectAnswer('after')}
                  size="lg"
                  variant="outline" 
                  className="flex-1 max-w-[140px] h-12"
                >
                  After
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Next Question Button */}
        {isRevealed && !isGameComplete && (
          <div className="text-center mt-8">
            <Button
              onClick={nextQuestion}
              size="lg"
              className="gap-2"
            >
              Next Question
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Educational Footer */}
        {isRevealed && (
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-muted/30 rounded-xl p-6 border">
              <h3 className="font-semibold text-foreground mb-3">📚 Did you know?</h3>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <div>
                  <strong className="text-foreground">{leftEvent.title} ({leftEvent.year}):</strong> {leftEvent.context}
                </div>
                <div>
                  <strong className="text-foreground">{rightEvent.title} ({rightEvent.year}):</strong> {rightEvent.context}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};