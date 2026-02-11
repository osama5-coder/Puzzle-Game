
import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameState } from './types';
import { getMissionControlCommentary } from './services/geminiService';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    score: 0,
    highScore: parseInt(localStorage.getItem('nebula_highscore') || '0'),
    missionControlMsg: "WAITING FOR CLEARANCE...",
    isAiLoading: false,
    isMuted: localStorage.getItem('nebula_muted') === 'true'
  });
  
  const [gameTrigger, setGameTrigger] = useState(0);

  useEffect(() => {
    audioService.setMute(gameState.isMuted);
    localStorage.setItem('nebula_muted', gameState.isMuted.toString());
  }, [gameState.isMuted]);

  const handleGameOver = useCallback(async (finalScore: number) => {
    audioService.playCrash();
    audioService.stopMusic();
    setGameState(prev => {
      const newHigh = Math.max(prev.highScore, finalScore);
      localStorage.setItem('nebula_highscore', newHigh.toString());
      return {
        ...prev,
        isPlaying: false,
        isGameOver: true,
        highScore: newHigh,
        isAiLoading: true
      };
    });

    const msg = await getMissionControlCommentary(finalScore, gameState.highScore);
    setGameState(prev => ({ 
      ...prev, 
      missionControlMsg: msg, 
      isAiLoading: false 
    }));
  }, [gameState.highScore]);

  const startGame = () => {
    audioService.startMusic();
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isGameOver: false,
      score: 0,
      missionControlMsg: "TRANSMITTING..."
    }));
  };

  const resetGame = () => {
    setGameTrigger(t_val => t_val + 1);
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isGameOver: false,
      score: 0,
      missionControlMsg: "SYSTEM REBOOT COMPLETE."
    }));
  };

  const updateScore = useCallback((newScore: number) => {
    audioService.playScore();
    setGameState(prev => ({ ...prev, score: newScore }));
  }, []);

  const toggleMute = () => {
    setGameState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#020617] text-white overflow-hidden select-none">
      {/* HUD Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-4 px-4 py-2 border-b border-purple-500/30 font-orbitron">
        <div className="flex flex-col">
          <span className="text-[10px] text-cyan-400 tracking-widest uppercase">UNIT-SCORE</span>
          <span className="text-3xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
            {gameState.score.toString().padStart(3, '0')}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleMute}
            className={`p-2 rounded-full border border-purple-500/30 transition-all ${gameState.isMuted ? 'text-slate-500' : 'text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]'}`}
            title="Toggle Sound"
          >
            {gameState.isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 14.828a1 1 0 01-1.414-1.414 5 5 0 000-7.072 1 1 0 111.414-1.414 7 7 0 010 9.9 1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-purple-400 tracking-widest uppercase">RECORD-LOG</span>
          <span className="text-3xl font-black text-white opacity-70 italic">
            {gameState.highScore.toString().padStart(3, '0')}
          </span>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative border-4 border-slate-900 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-slate-900">
        <GameCanvas 
          isPlaying={gameState.isPlaying}
          isGameOver={gameState.isGameOver}
          onGameOver={handleGameOver}
          onScoreUpdate={updateScore}
          gameTrigger={gameTrigger}
        />

        {/* Start Overlay */}
        {!gameState.isPlaying && !gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg backdrop-blur-md z-10 p-8 text-center border border-purple-500/20">
            <div className="mb-2 p-2 bg-purple-500/10 border border-purple-500/30 rounded inline-block">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            
            <h1 className="text-5xl font-black mb-1 text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-500 font-orbitron tracking-tighter leading-none">
              NEON<br/>NEBULA
            </h1>
            
            <p className="text-cyan-400 mb-8 text-[10px] font-bold uppercase tracking-[0.4em] opacity-80">
              [ STAGE-1 CLEARANCE REQUIRED ]
            </p>

            <div className="grid grid-cols-1 gap-4 w-full max-w-[240px]">
              <button 
                onClick={startGame}
                className="group relative px-6 py-4 bg-purple-600 text-white font-bold rounded overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative font-orbitron text-lg tracking-widest uppercase">START</span>
              </button>
              
              <div className="bg-slate-900/50 p-4 rounded border border-white/5 backdrop-blur-sm">
                <h3 className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 border-b border-white/10 pb-1">Flight Controls</h3>
                <div className="flex justify-around items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded border border-white/20 flex items-center justify-center text-[10px] bg-white/5 font-mono">SPACE</div>
                    <span className="text-[8px] text-slate-400 uppercase">JUMP</span>
                  </div>
                  <div className="text-slate-600 text-xs">|</div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                      </svg>
                    </div>
                    <span className="text-[8px] text-slate-400 uppercase">TAP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-lg backdrop-blur-xl z-20 p-8 text-center border-2 border-red-500/30">
            <div className="mb-4 text-red-500 animate-pulse">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-4xl font-black mb-1 text-red-500 font-orbitron tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] uppercase">
              DE-SYNCED
            </h2>
            
            <div className="w-full h-px bg-red-500/20 my-6"></div>
            
            <div className="bg-slate-900/80 p-5 rounded-lg border border-red-500/20 w-full mb-8 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
              <p className="text-[9px] text-slate-500 mb-2 uppercase tracking-widest text-left font-bold">MISSION_CTRL_LOG:</p>
              <p className="text-md font-bold text-slate-200 min-h-[3rem] italic leading-tight">
                {gameState.isAiLoading ? "ACCESSING COMMS..." : `"${gameState.missionControlMsg}"`}
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={startGame}
                className="w-full py-4 bg-red-600 text-white font-black font-orbitron hover:bg-red-500 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                RE-INITIALIZE
              </button>
              <button 
                onClick={resetGame}
                className="w-full py-2 bg-transparent border border-white/20 text-slate-400 font-bold hover:text-white transition-all uppercase tracking-[0.2em] text-[10px]"
              >
                RETURN TO GRID
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-8 flex flex-col items-center opacity-40">
        <div className="flex items-center gap-3">
          <div className="h-1 w-8 bg-purple-500/30"></div>
          <span className="text-[10px] text-slate-400 uppercase tracking-[0.3em]">Nebula Engine v3.2.1</span>
          <div className="h-1 w-8 bg-purple-500/30"></div>
        </div>
      </div>
    </div>
  );
};

export default App;
