import { useEffect, useState } from 'react';
import { RotateCcw, Trophy, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GameCard } from './GameCard';
import { ScoreDisplay } from './ScoreDisplay';
import { ProgressIndicator } from './ProgressIndicator';
import { useGameState } from '@/hooks/useGameState';
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
    isLoading,
    isGameOver,
    isGameWon,
    selectAnswer,
    nextQuestion,
    resetGame
  } = gameState;

  const [scoreAnimating, setScoreAnimating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  // Game is complete when player loses or wins

  // Auto-transition after correct answer with proper timing
  useEffect(() => {
    if (isRevealed && !isGameOver && !isGameWon && isCorrect) {
      const timer = setTimeout(() => {
        setIsTransitioning(true);
        // Delay the actual state change to allow animation to complete
        setTimeout(() => {
          nextQuestion();
          setIsTransitioning(false);
        }, 600); // Match animation duration
      }, 1200); // Show result for a bit longer
      return () => clearTimeout(timer);
    }
  }, [isRevealed, isGameOver, isGameWon, isCorrect, nextQuestion]);

  console.log('Left event:', leftEvent);
  console.log('Right event:', rightEvent);
  console.log('Is game over:', isGameOver, 'Is game won:', isGameWon);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-foreground">Loading Game...</div>
          <div className="text-muted-foreground">
            Fetching historical events...
          </div>
        </div>
      </div>
    );
  }

  // Show debug info if no events
  if (!leftEvent || !rightEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-foreground">No Events Available</div>
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

  // Game Over Screen (when player loses)
  if (isGameOver && !isCorrect) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        {/* Blurred background events */}
        <div className="absolute inset-0 blur-sm opacity-30">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto h-full">
            <div className="space-y-6">
              <GameCard
                event={leftEvent!}
                onClick={() => {}}
                isSelected={false}
                isRevealed={true}
                isCorrect={undefined}
              />
            </div>
            <div className="space-y-6">
              <GameCard
                event={rightEvent!}
                onClick={() => {}}
                isSelected={false}
                isRevealed={true}
                isCorrect={false}
              />
            </div>
          </div>
        </div>
        
        {/* Game Over Content */}
        <div className="max-w-md w-full text-center space-y-6 relative z-10 bg-background/90 backdrop-blur-sm rounded-2xl p-8 border">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Game Over!</h1>
            <div className="text-6xl font-bold text-primary">{score}</div>
            <p className="text-lg text-muted-foreground">Correct answers in a row</p>
          </div>

          <div className="bg-card rounded-xl p-4 border shadow-sm space-y-2">
            <h3 className="font-semibold text-foreground">Your mistake:</h3>
            <p className="text-sm text-muted-foreground">
              You said <strong>{rightEvent?.title}</strong> happened <strong>{selectedAnswer}</strong> <strong>{leftEvent?.title}</strong>, but it actually happened {rightEvent!.year > leftEvent!.year ? 'after' : 'before'} ({rightEvent?.year} vs {leftEvent?.year}).
            </p>
          </div>

          <Button 
            onClick={() => resetGame()} 
            size="lg" 
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Game Won Screen (dataset exhausted)
  if (isGameWon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-4">
            <Trophy className="h-20 w-20 text-yellow-500 mx-auto" />
            <h1 className="text-4xl font-bold text-foreground">Congratulations!</h1>
            <p className="text-lg text-muted-foreground">You've mastered all historical events!</p>
          </div>

          <div className="bg-card rounded-xl p-6 border shadow-sm space-y-4">
            <div className="text-6xl font-bold text-primary">{score}</div>
            <div className="text-lg text-muted-foreground">Perfect score!</div>
            <div className="text-sm text-accent-foreground font-medium">🏆 History Master</div>
          </div>

          <Button 
            onClick={() => resetGame()} 
            size="lg" 
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Play Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">Before or After?</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => resetGame()}
              className="gap-2"
            >
              <RotateCcw className="h-3 w-3" />
              New Game
            </Button>
          </div>

          <div className="flex justify-center">
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
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-5xl w-full">

          {/* Game Cards */}
          <div className="grid md:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
            {/* Left Event (Reference) */}
            <div className="space-y-6">
              <GameCard
                event={leftEvent}
                onClick={() => {}}
                isSelected={false}
                isRevealed={true}
                isCorrect={undefined}
                className={`transition-all duration-600 ease-in-out ${
                  isTransitioning ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'
                }`}
              />
              {/* Prominent Reference Date */}
              <div className="text-center space-y-2">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Reference Date
                </div>
                <div className="text-4xl font-bold text-primary bg-primary/5 rounded-xl py-4 px-6 border-2 border-primary/20">
                  {leftEvent.year}
                </div>
                <div className="text-sm text-muted-foreground">
                  Compare other events to this date
                </div>
              </div>
            </div>
            
            {/* Right Event (To Compare) */}
            <div className="space-y-6">
              <GameCard
                event={rightEvent}
                onClick={() => {}}
                isSelected={false}
                isRevealed={isRevealed}
                isCorrect={isCorrect}
                className={`transition-all duration-600 ease-in-out ${
                  isTransitioning 
                    ? 'opacity-0 transform -translate-x-4' 
                    : 'opacity-100 transform translate-x-0'
                }`}
              />
              
              {/* Before/After Buttons or Revealed Date */}
              <div className="space-y-4">
                {!isRevealed ? (
                  <>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-foreground mb-4">
                        Did this happen before or after {leftEvent.year}?
                      </div>
                    </div>
                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={() => selectAnswer('before')}
                        size="lg"
                        className="flex-1 max-w-[140px] h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        Before
                      </Button>
                      <Button
                        onClick={() => selectAnswer('after')}
                        size="lg"
                        className="flex-1 max-w-[140px] h-14 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        After
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Actual Date
                    </div>
                    <div className={`text-3xl font-bold rounded-xl py-3 px-4 border-2 ${
                      isCorrect 
                        ? 'text-green-600 bg-green-50 border-green-200' 
                        : 'text-red-600 bg-red-50 border-red-200'
                    }`}>
                      {rightEvent.year}
                    </div>
                    <div className={`text-sm font-medium ${
                      isCorrect ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                    </div>
                  </div>
                )}
                
                {/* More Info Button */}
                {isRevealed && !isCorrect && (
                  <div className="flex justify-center mt-4">
                    <Collapsible open={showMoreInfo} onOpenChange={setShowMoreInfo}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Info className="h-4 w-4" />
                          {showMoreInfo ? 'Hide Info' : 'More Info'}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3">
                        <div className="bg-muted/30 rounded-xl p-4 border text-sm space-y-2">
                          <div>
                            <strong className="text-foreground">{leftEvent.title} ({leftEvent.year}):</strong>
                            <p className="text-muted-foreground mt-1">{leftEvent.context}</p>
                          </div>
                          <div>
                            <strong className="text-foreground">{rightEvent.title} ({rightEvent.year}):</strong>
                            <p className="text-muted-foreground mt-1">{rightEvent.context}</p>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};