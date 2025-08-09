import { useState, useCallback, useEffect } from 'react';
import { HistoricalEvent, getRandomEventPair, checkAnswer, getHistoricalEvents } from '@/data/historicalEvents';

interface GameState {
  leftEvent: HistoricalEvent | null;
  rightEvent: HistoricalEvent | null;
  score: number;
  streak: number;
  questionsAnswered: number;
  isRevealed: boolean;
  selectedAnswer: 'before' | 'after' | null;
  isCorrect: boolean | null;
  usedEventIds: string[];
  isLoading: boolean;
  isGameOver: boolean;
  isGameWon: boolean;
}

interface GameActions {
  startNewGame: () => void;
  selectAnswer: (answer: 'before' | 'after') => void;
  nextQuestion: () => void;
  resetGame: () => void;
}

// Game continues until wrong answer or dataset exhausted

export const useGameState = (): GameState & GameActions => {
  console.log('useGameState hook initializing...');
  
  const [gameState, setGameState] = useState<GameState>(() => ({
    leftEvent: null,
    rightEvent: null,
    score: 0,
    streak: 0,
    questionsAnswered: 0,
    isRevealed: false,
    selectedAnswer: null,
    isCorrect: null,
    usedEventIds: [],
    isLoading: true,
    isGameOver: false,
    isGameWon: false
  }));

  // Initialize the game with first pair
  useEffect(() => {
    const initializeGame = async () => {
      try {
        console.log('Initializing game state...');
        // Wait for events to be loaded
        await getHistoricalEvents();
        
        // Now getRandomEventPair is synchronous
        const initialPair = getRandomEventPair();
        console.log('Got initial pair:', initialPair);
        
        setGameState(prev => ({
          ...prev,
          leftEvent: initialPair[0],
          rightEvent: initialPair[1],
          usedEventIds: [initialPair[0].id, initialPair[1].id],
          isLoading: false
        }));
      } catch (error) {
        console.error('Error initializing game state:', error);
        setGameState(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    };

    initializeGame();
  }, []);

  const startNewGame = useCallback(() => {
    try {
      setGameState(prev => ({ ...prev, isLoading: true }));
      
      // getRandomEventPair is now synchronous
      const newPair = getRandomEventPair();
      
      setGameState({
        leftEvent: newPair[0],
        rightEvent: newPair[1],
        score: 0,
        streak: 0,
        questionsAnswered: 0,
        isRevealed: false,
        selectedAnswer: null,
        isCorrect: null,
        usedEventIds: [newPair[0].id, newPair[1].id],
        isLoading: false,
        isGameOver: false,
        isGameWon: false
      });
    } catch (error) {
      console.error('Error starting new game:', error);
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const selectAnswer = useCallback((answer: 'before' | 'after') => {
    if (gameState.isRevealed || !gameState.leftEvent || !gameState.rightEvent) return;

    // Check if right event happened before or after left event
    const isCorrect = answer === 'before' 
      ? gameState.rightEvent.year < gameState.leftEvent.year
      : gameState.rightEvent.year > gameState.leftEvent.year;
    
    setGameState(prev => ({
      ...prev,
      selectedAnswer: answer,
      isCorrect,
      isRevealed: true,
      score: isCorrect ? prev.score + 1 : prev.score,
      streak: isCorrect ? prev.streak + 1 : 0,
      questionsAnswered: prev.questionsAnswered + 1,
      isGameOver: !isCorrect // Game ends on wrong answer
    }));
  }, [gameState.leftEvent, gameState.rightEvent, gameState.isRevealed]);

  const nextQuestion = useCallback(() => {
    if (gameState.isGameOver) {
      return;
    }

    try {
      setGameState(prev => ({ ...prev, isLoading: true }));
      
      // getRandomEventPair is now synchronous
      const newPair = getRandomEventPair([...gameState.usedEventIds, gameState.rightEvent!.id]);
      
      if (!newPair) {
        // No more events available - player wins!
        setGameState(prev => ({
          ...prev,
          isGameWon: true,
          isLoading: false
        }));
        return;
      }
      
      const newEvent = newPair[0];
      
      setGameState(prev => ({
        ...prev,
        leftEvent: prev.rightEvent,
        rightEvent: newEvent,
        isRevealed: false,
        selectedAnswer: null,
        isCorrect: null,
        usedEventIds: [...prev.usedEventIds, newEvent.id],
        isLoading: false
      }));
    } catch (error) {
      console.error('Error getting next question:', error);
      // Assume dataset exhausted if error getting new pair
      setGameState(prev => ({
        ...prev,
        isGameWon: true,
        isLoading: false
      }));
    }
  }, [gameState.isGameOver, gameState.usedEventIds, gameState.rightEvent]);

  const resetGame = useCallback(() => {
    startNewGame();
  }, [startNewGame]);

  return {
    ...gameState,
    startNewGame,
    selectAnswer,
    nextQuestion,
    resetGame
  };
};

// No more total questions limit - game continues until wrong answer