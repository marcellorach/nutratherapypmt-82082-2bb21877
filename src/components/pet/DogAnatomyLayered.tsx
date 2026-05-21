import React from 'react';
import { cn } from '@/lib/utils';
import silhouette from '@/assets/anatomy/dog_silhouette.png';
import heartLungs from '@/assets/anatomy/dog_heart_lungs.png';
import digestive from '@/assets/anatomy/dog_digestive.png';
import urinary from '@/assets/anatomy/dog_urinary.png';
import skeleton from '@/assets/anatomy/dog_skeleton.png';
import nervous from '@/assets/anatomy/dog_nervous.png';

export type AnatomyLayerId =
  | 'silhouette'
  | 'cardio'
  | 'digestive'
  | 'urinary'
  | 'skeleton'
  | 'nervous';

const LAYER_SRC: Record<AnatomyLayerId, string> = {
  silhouette,
  cardio: heartLungs,
  digestive,
  urinary,
  skeleton,
  nervous,
};

const LAYER_LABEL: Record<AnatomyLayerId, string> = {
  silhouette: 'Silhueta',
  cardio: 'Cardiopulmonar',
  digestive: 'Digestivo',
  urinary: 'Urinário',
  skeleton: 'Esqueleto',
  nervous: 'Nervoso',
};

interface Props {
  /** Layers to render, in z-order (back → front). Silhouette is implied as base. */
  activeLayers?: AnatomyLayerId[];
  /** Opacity per layer (0–1). Defaults to 0.85 for non-silhouette. */
  layerOpacity?: Partial<Record<AnatomyLayerId, number>>;
  className?: string;
  showLegend?: boolean;
}

/**
 * Layered anatomical viewer for the canine Digital Twin.
 * Cross-fades multiple organ-system PNG layers over a silhouette base
 * using CSS opacity transitions. No 3D deps.
 */
const DogAnatomyLayered: React.FC<Props> = ({
  activeLayers = ['cardio'],
  layerOpacity = {},
  className,
  showLegend = false,
}) => {
  const all: AnatomyLayerId[] = ['silhouette', 'cardio', 'digestive', 'urinary', 'skeleton', 'nervous'];
  const isActive = (id: AnatomyLayerId) => id === 'silhouette' || activeLayers.includes(id);

  return (
    <div className={cn('relative w-full aspect-[4/3]', className)}>
      {all.map((id) => {
        const active = isActive(id);
        const baseOp = id === 'silhouette' ? 1 : 0.85;
        const op = active ? (layerOpacity[id] ?? baseOp) : 0;
        return (
          <img
            key={id}
            src={LAYER_SRC[id]}
            alt={LAYER_LABEL[id]}
            loading="lazy"
            width={1024}
            height={768}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-500"
            style={{ opacity: op }}
          />
        );
      })}
      {showLegend && activeLayers.length > 0 && (
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5 z-10">
          {activeLayers.map((id) => (
            <span
              key={id}
              className="px-2 py-0.5 rounded-full bg-background/80 border border-border text-[10px] text-foreground backdrop-blur-sm"
            >
              {LAYER_LABEL[id]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default DogAnatomyLayered;