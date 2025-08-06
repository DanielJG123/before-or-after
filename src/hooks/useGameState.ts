import { useState, useCallback } from 'react';
import { HistoricalEvent, getRandomEventPair, checkAnswer } from '@/data/historicalEvents';

interface GameState {
  currentPair: [HistoricalEvent, HistoricalEvent] | null;
  score: number;
  streak: number;
  questionsAnswered: number;
  isRevealed: boolean;
  selectedEvent: HistoricalEvent | null;
  isCorrect: boolean | null;
  usedEventIds: string[];
}

interface GameActions {
  startNewGame: () => void;
  selectEvent: (event: HistoricalEvent) => void;
  nextQuestion: () => void;
  resetGame: () => void;
}

const TOTAL_QUESTIONS = 10;

export const useGameState = (): GameState & GameActions => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialPair = getRandomEventPair();
    return {
      currentPair: initialPair,
      score: 0,
      streak: 0,
      questionsAnswered: 0,
      isRevealed: false,
      selectedEvent: null,
      isCorrect: null,
      usedEventIds: [initialPair[0].id, initialPair[1].id]
    };
  });

  const startNewGame = useCallback(() => {
    const newPair = getRandomEventPair();
    setGameState({
      currentPair: newPair,
      score: 0,
      streak: 0,
      questionsAnswered: 0,
      isRevealed: false,
      selectedEvent: null,
      isCorrect: null,
      usedEventIds: [newPair[0].id, newPair[1].id]
    });
  }, []);

  const selectEvent = useCallback((event: HistoricalEvent) => {
    if (gameState.isRevealed || !gameState.currentPair) return;

    const otherEvent = gameState.currentPair.find(e => e.id !== event.id);
    if (!otherEvent) return;

    const isCorrect = checkAnswer(event, otherEvent);
    
    setGameState(prev => ({
      ...prev,
      selectedEvent: event,
      isCorrect,
      isRevealed: true,
      score: isCorrect ? prev.score + 1 : prev.score,
      streak: isCorrect ? prev.streak + 1 : 0,
      questionsAnswered: prev.questionsAnswered + 1
    }));
  }, [gameState.currentPair, gameState.isRevealed]);

  const nextQuestion = useCallback(() => {
    if (gameState.questionsAnswered >= TOTAL_QUESTIONS) {
      // Game is complete
      return;
    }

    const newPair = getRandomEventPair(gameState.usedEventIds);
    
    setGameState(prev => ({
      ...prev,
      currentPair: newPair,
      isRevealed: false,
      selectedEvent: null,
      isCorrect: null,
      usedEventIds: [...prev.usedEventIds, newPair[0].id, newPair[1].id]
    }));
  }, [gameState.questionsAnswered, gameState.usedEventIds]);

  const resetGame = useCallback(() => {
    startNewGame();
  }, [startNewGame]);

  return {
    ...gameState,
    startNewGame,
    selectEvent,
    nextQuestion,
    resetGame
  };
};

export const GAME_TOTAL_QUESTIONS = TOTAL_QUESTIONS;