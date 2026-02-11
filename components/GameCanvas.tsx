
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  GRAVITY, 
  LIFT, 
  PIPE_WIDTH, 
  PIPE_GAP, 
  INITIAL_SPEED, 
  MAX_SPEED, 
  SHIP_SIZE, 
  COLORS 
} from '../constants';
import { Particle, Obstacle } from '../types';
import { audioService } from '../services/audioService';

interface GameCanvasProps {
  isPlaying: boolean;
  isGameOver: boolean;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  gameTrigger: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  isPlaying, 
  isGameOver, 
  onGameOver, 
  onScoreUpdate,
  gameTrigger
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 600 });
  
  // Game State Refs (to avoid re-renders)
  const shipY = useRef(300);
  const shipVelocity = useRef(0);
  const pipes = useRef<Obstacle[]>([]);
  const particles = useRef<Particle[]>([]);
  const score = useRef(0);
  const speed = useRef(INITIAL_SPEED);
  const frameCount = useRef(0);
  const lastPipeTime = useRef(0);
  const stars = useRef<{x: number, y: number, size: number, speed: number}[]>([]);

  // Initialize Stars
  useEffect(() => {
    const s = [];
    for(let i=0; i<80; i++) {
      s.push({
        x: Math.random() * 800,
        y: Math.random() * 800,
        size: Math.random() * 2,
        speed: Math.random() * 1.5 + 0.5
      });
    }
    stars.current = s;
  }, []);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const w = Math.min(window.innerWidth, 480);
      const h = Math.min(window.innerHeight - 150, 720);
      setDimensions({ width: w, height: h });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset Logic
  useEffect(() => {
    shipY.current = dimensions.height / 2;
    shipVelocity.current = 0;
    pipes.current = [];
    particles.current = [];
    score.current = 0;
    speed.current = INITIAL_SPEED;
    frameCount.current = 0;
    lastPipeTime.current = 0;
  }, [gameTrigger, dimensions.height]);

  const boost = useCallback(() => {
    if (!isPlaying || isGameOver) return;
    shipVelocity.current = LIFT;
    audioService.playJump();
    
    // Juicier Exhaust particles
    for (let i = 0; i < 12; i++) {
      particles.current.push({
        x: 65,
        y: shipY.current + SHIP_SIZE / 2,
        vx: -Math.random() * 8 - 4,
        vy: (Math.random() - 0.5) * 6,
        life: 1,
        color: Math.random() > 0.5 ? COLORS.accent : COLORS.secondary,
        size: Math.random() * 5 + 3
      });
    }
  }, [isPlaying, isGameOver]);

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        boost();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [boost]);

  const createPipe = () => {
    const minH = 60;
    const range = dimensions.height - PIPE_GAP - (minH * 2);
    const top = Math.random() * range + minH;
    pipes.current.push({ x: dimensions.width, top, passed: false, id: Date.now() });
  };

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Background
      const gradient = ctx.createLinearGradient(0, 0, 0, dimensions.height);
      gradient.addColorStop(0, '#020617');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Stars
      ctx.fillStyle = COLORS.star;
      stars.current.forEach(s => {
        ctx.globalAlpha = 0.5 + Math.sin(frameCount.current * 0.05) * 0.2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        if (isPlaying && !isGameOver) {
          s.x -= s.speed;
          if (s.x < 0) s.x = dimensions.width;
        }
      });
      ctx.globalAlpha = 1.0;

      if (isPlaying && !isGameOver) {
        // Physics
        shipVelocity.current += GRAVITY;
        shipY.current += shipVelocity.current;

        // Death by boundaries
        if (shipY.current < 0 || shipY.current + SHIP_SIZE > dimensions.height) {
          onGameOver(score.current);
        }

        // Difficulty scaling
        speed.current = Math.min(MAX_SPEED, INITIAL_SPEED + (score.current * 0.1));

        const spawnRate = Math.max(45, 75 - (score.current * 1.5));
        if (frameCount.current - lastPipeTime.current > spawnRate) {
          createPipe();
          lastPipeTime.current = frameCount.current;
        }

        // Pipe updates
        pipes.current.forEach((p, idx) => {
          p.x -= speed.current;

          const shipHitbox = { x: 55, y: shipY.current + 8, w: SHIP_SIZE - 20, h: SHIP_SIZE - 20 };
          const topRect = { x: p.x, y: 0, w: PIPE_WIDTH, h: p.top };
          const bottomRect = { x: p.x, y: p.top + PIPE_GAP, w: PIPE_WIDTH, h: dimensions.height };

          const checkCollision = (r1: any, r2: any) => {
             return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
          };

          if (checkCollision(shipHitbox, topRect) || checkCollision(shipHitbox, bottomRect)) {
            onGameOver(score.current);
          }

          // Scoring
          if (!p.passed && p.x + PIPE_WIDTH < 50) {
            p.passed = true;
            score.current += 1;
            onScoreUpdate(score.current);
          }
        });

        pipes.current = pipes.current.filter(p => p.x + PIPE_WIDTH > 0);

        // Particle updates
        particles.current.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.04; 
        });
        particles.current = particles.current.filter(p => p.life > 0);
      }

      // Draw Pipes
      pipes.current.forEach(p => {
        ctx.fillStyle = COLORS.pipe;
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLORS.primary;
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.top);
        ctx.fillRect(p.x, p.top + PIPE_GAP, PIPE_WIDTH, dimensions.height - (p.top + PIPE_GAP));
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = COLORS.primary;
        ctx.fillRect(p.x, p.top - 8, PIPE_WIDTH, 8);
        ctx.fillRect(p.x, p.top + PIPE_GAP, PIPE_WIDTH, 8);
        
        ctx.strokeStyle = COLORS.secondary;
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x + 5, 0, PIPE_WIDTH - 10, p.top - 8);
        ctx.strokeRect(p.x + 5, p.top + PIPE_GAP + 8, PIPE_WIDTH - 10, dimensions.height);
      });

      // Draw Particles
      particles.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Draw Ship
      ctx.save();
      ctx.translate(74, shipY.current + SHIP_SIZE / 2);
      ctx.rotate(Math.max(-0.6, Math.min(1.0, shipVelocity.current * 0.07)));

      ctx.fillStyle = COLORS.primary;
      ctx.fillRect(-20, -15, 40, 30);
      
      ctx.fillStyle = COLORS.accent;
      ctx.beginPath();
      ctx.moveTo(-10, -15);
      ctx.lineTo(0, -35);
      ctx.lineTo(10, -15);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-10, 15);
      ctx.lineTo(0, 35);
      ctx.lineTo(10, 15);
      ctx.fill();

      ctx.fillStyle = COLORS.secondary;
      ctx.fillRect(5, -8, 15, 16);
      
      if (isPlaying && !isGameOver) {
        ctx.fillStyle = COLORS.secondary;
        ctx.beginPath();
        ctx.moveTo(-20, -10);
        ctx.lineTo(-30 - Math.random() * 15, 0);
        ctx.lineTo(-20, 10);
        ctx.fill();
      }
      ctx.restore();

      frameCount.current++;
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, isGameOver, dimensions, onGameOver, onScoreUpdate]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      onClick={boost}
      onTouchStart={(e) => { e.preventDefault(); boost(); }}
      className="rounded-lg cursor-pointer"
    />
  );
};

export default GameCanvas;
