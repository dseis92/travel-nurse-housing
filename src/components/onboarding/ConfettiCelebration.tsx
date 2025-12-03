import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  delay: number;
}

export function ConfettiCelebration() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate confetti particles
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
    const newParticles: Particle[] = [];

    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        delay: Math.random() * 0.5,
      });
    }

    setParticles(newParticles);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: 10,
            height: 10,
            backgroundColor: particle.color,
            borderRadius: particle.id % 3 === 0 ? '50%' : '0%',
            animation: `fall 3s ease-in ${particle.delay}s forwards, rotate 2s linear infinite`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}

      <style>
        {`
          @keyframes fall {
            to {
              transform: translateY(120vh) translateX(${Math.random() * 100 - 50}px);
              opacity: 0;
            }
          }

          @keyframes rotate {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}
