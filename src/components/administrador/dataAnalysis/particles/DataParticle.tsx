
import React from 'react';

interface DataParticleProps {
  id: string;
  type: 'data' | 'analysis' | 'recommendation' | 'feedback';
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  opacity: number;
}

const DataParticle: React.FC<DataParticleProps> = ({
  id,
  type,
  x,
  y,
  size,
  color,
  opacity
}) => {
  const getParticleShape = () => {
    switch (type) {
      case 'data':
        return (
          <circle
            cx={x}
            cy={y}
            r={size}
            fill={color}
            opacity={opacity}
            className="animate-pulse"
          />
        );
      case 'analysis':
        return (
          <polygon
            points={`${x},${y-size} ${x+size},${y+size} ${x-size},${y+size}`}
            fill={color}
            opacity={opacity}
            className="animate-spin"
            style={{ animationDuration: '2s' }}
          />
        );
      case 'recommendation':
        return (
          <rect
            x={x - size/2}
            y={y - size/2}
            width={size}
            height={size}
            fill={color}
            opacity={opacity}
            className="animate-bounce"
            style={{ animationDuration: '1s' }}
          />
        );
      case 'feedback':
        return (
          <path
            d={`M ${x-size} ${y} Q ${x} ${y-size} ${x+size} ${y} Q ${x} ${y+size} ${x-size} ${y}`}
            fill={color}
            opacity={opacity}
            className="animate-ping"
          />
        );
      default:
        return null;
    }
  };

  return (
    <g id={id}>
      {getParticleShape()}
      <circle
        cx={x}
        cy={y}
        r={size * 1.5}
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity={opacity * 0.3}
        className="animate-ping"
      />
    </g>
  );
};

export default DataParticle;
