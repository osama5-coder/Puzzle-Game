
export interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  score: number;
  highScore: number;
  missionControlMsg: string;
  isAiLoading: boolean;
  isMuted: boolean;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface Obstacle {
  x: number;
  top: number;
  passed: boolean;
  id: number;
}

export enum GameActionType {
  START = 'START',
  END = 'END',
  RESET = 'RESET',
  UPDATE_SCORE = 'UPDATE_SCORE',
  AI_MESSAGE = 'AI_MESSAGE',
  SET_AI_LOADING = 'SET_AI_LOADING'
}
