
import React, { useState, useEffect, useRef } from 'react';
import DataParticle from './DataParticle';

interface Particle {
  id: string;
  type: 'data' | 'analysis' | 'recommendation' | 'feedback';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  speed: number;
  color: string;
  opacity: number;
  fromAgent: string;
  toAgent: string;
  lifespan: number;
  created: number;
}

interface ParticleSystemProps {
  width: number;
  height: number;
  agentPositions: Record<string, { x: number; y: number }>;
  activeConnections: Array<{ from: string; to: string; type: string }>;
  isActive: boolean;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({
  width,
  height,
  agentPositions,
  activeConnections,
  isActive
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number>();
  const lastSpawnTime = useRef<number>(0);

  const getParticleColor = (type: string) => {
    switch (type) {
      case 'data': return '#3b82f6';
      case 'analysis': return '#10b981';
      case 'recommendation': return '#8b5cf6';
      case 'feedback': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const createParticle = (connection: { from: string; to: string; type: string }): Particle => {
    const fromPos = agentPositions[connection.from];
    const toPos = agentPositions[connection.to];
    
    if (!fromPos || !toPos) return null;

    const startX = (fromPos.x / 100) * width;
    const startY = (fromPos.y / 100) * height;
    const targetX = (toPos.x / 100) * width;
    const targetY = (toPos.y / 100) * height;

    return {
      id: `particle-${connection.from}-${connection.to}-${Date.now()}-${Math.random()}`,
      type: connection.type as any,
      x: startX,
      y: startY,
      targetX,
      targetY,
      size: Math.random() * 3 + 2,
      speed: Math.random() * 0.02 + 0.01,
      color: getParticleColor(connection.type),
      opacity: Math.random() * 0.6 + 0.4,
      fromAgent: connection.from,
      toAgent: connection.to,
      lifespan: 3000 + Math.random() * 2000,
      created: Date.now()
    };
  };

  const updateParticles = () => {
    const currentTime = Date.now();
    
    setParticles(prevParticles => {
      return prevParticles
        .filter(particle => currentTime - particle.created < particle.lifespan)
        .map(particle => {
          const dx = particle.targetX - particle.x;
          const dy = particle.targetY - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 5) {
            // Partícula chegou ao destino
            return { ...particle, opacity: particle.opacity * 0.95 };
          }
          
          const moveX = (dx / distance) * particle.speed * 100;
          const moveY = (dy / distance) * particle.speed * 100;
          
          return {
            ...particle,
            x: particle.x + moveX,
            y: particle.y + moveY
          };
        });
    });
  };

  const spawnParticles = () => {
    const currentTime = Date.now();
    
    if (currentTime - lastSpawnTime.current > 200 && isActive) {
      activeConnections.forEach(connection => {
        if (Math.random() < 0.7) {
          const newParticle = createParticle(connection);
          if (newParticle) {
            setParticles(prev => [...prev, newParticle]);
          }
        }
      });
      lastSpawnTime.current = currentTime;
    }
  };

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    const animate = () => {
      updateParticles();
      spawnParticles();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, activeConnections, agentPositions]);

  return (
    <g className="particle-system">
      {particles.map(particle => (
        <DataParticle
          key={particle.id}
          id={particle.id}
          type={particle.type}
          x={particle.x}
          y={particle.y}
          size={particle.size}
          speed={particle.speed}
          color={particle.color}
          opacity={particle.opacity}
        />
      ))}
    </g>
  );
};

export default ParticleSystem;
