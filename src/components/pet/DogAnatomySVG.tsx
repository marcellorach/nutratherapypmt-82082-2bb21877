import React, { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import type { AnatomyRegionId } from '@/services/anatomy-region-map';

export type Severity = 'mild' | 'moderate' | 'severe';

export interface RegionState {
  severity: Severity | null; // null = healthy
  isNew?: boolean; // emergent risk vs existing condition
  protected?: boolean; // KG-covered + intervention ON
  conditions: Array<{ name: string; severity: Severity; isNew: boolean; probability?: number; protectedBy?: string[] }>;
}

interface Props {
  /** Map region → state. Missing regions are healthy. */
  regionStates: Partial<Record<AnatomyRegionId, RegionState>>;
  /** When true, draws a soft systemic tint over the whole body. */
  systemicSeverity?: Severity | null;
  /** Show an outline + glow when intervention is active (subtle aura). */
  showProtectionAura?: boolean;
  className?: string;
}

const SEVERITY_FILL: Record<Severity, string> = {
  mild: 'hsl(48, 95%, 60%)',
  moderate: 'hsl(25, 95%, 55%)',
  severe: 'hsl(0, 85%, 55%)',
};

const SEVERITY_OPACITY: Record<Severity, number> = {
  mild: 0.35,
  moderate: 0.55,
  severe: 0.75,
};

/**
 * Lateral dog SVG with named anatomical regions. Simplified silhouette of a
 * standing dog facing right, with paths grouped by body system. Regions can
 * be tinted by severity, outlined for emergent risks, or haloed when protected.
 *
 * Coordinate system: viewBox 0 0 600 400. Dog occupies roughly x=60..560, y=80..340.
 * Body axis: head right, tail left. Forelimbs at x≈400-460, hindlimbs at x≈140-220.
 */
export const DogAnatomySVG: React.FC<Props> = ({
  regionStates,
  systemicSeverity = null,
  showProtectionAura = false,
  className,
}) => {
  const { t } = useTranslation();

  const get = (id: AnatomyRegionId): RegionState | undefined => regionStates[id];

  const fillFor = (id: AnatomyRegionId): { fill: string; opacity: number } => {
    const s = get(id);
    if (!s || !s.severity) return { fill: 'transparent', opacity: 0 };
    return { fill: SEVERITY_FILL[s.severity], opacity: SEVERITY_OPACITY[s.severity] };
  };

  // Animated paw paths (when affected, show inflammation rings).
  const renderHotspot = (cx: number, cy: number, id: AnatomyRegionId, radius = 14) => {
    const s = get(id);
    if (!s || !s.severity) return null;
    const color = SEVERITY_FILL[s.severity];
    const opacity = SEVERITY_OPACITY[s.severity];
    return (
      <g key={`${id}-hotspot`} pointerEvents="none">
        {/* Outer pulse ring */}
        <circle cx={cx} cy={cy} r={radius * 1.6} fill={color} opacity={opacity * 0.25}>
          <animate attributeName="r" values={`${radius * 1.4};${radius * 1.9};${radius * 1.4}`} dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values={`${opacity * 0.35};${opacity * 0.05};${opacity * 0.35}`} dur="2.6s" repeatCount="indefinite" />
        </circle>
        {/* Mid ring */}
        <circle cx={cx} cy={cy} r={radius} fill={color} opacity={opacity * 0.45} />
        {/* Inner core */}
        <circle cx={cx} cy={cy} r={radius * 0.55} fill={color} opacity={Math.min(opacity + 0.2, 0.95)} />
        {/* Protection sparkle */}
        {s.protected && showProtectionAura && (
          <g>
            <circle cx={cx} cy={cy} r={radius * 2.2} fill="none" stroke="hsl(160, 70%, 45%)" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.6}>
              <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="14s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
      </g>
    );
  };

  // New-risk dashed outline (emergent predisposition)
  const renderNewRiskOutline = (cx: number, cy: number, id: AnatomyRegionId, radius = 16) => {
    const s = get(id);
    if (!s || !s.isNew || !s.severity) return null;
    const color = SEVERITY_FILL[s.severity];
    return (
      <g key={`${id}-newrisk`} pointerEvents="none">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke={color} strokeWidth={1.8} strokeDasharray="4 3" opacity={0.75}>
          <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>
    );
  };

  // Generate Tooltip wrapper for each interactive region
  const interactiveRegion = (
    id: AnatomyRegionId,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    label: string,
  ) => {
    const s = get(id);
    if (!s) return null;
    return (
      <Tooltip key={`tt-${id}`}>
        <TooltipTrigger asChild>
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill="transparent"
            style={{ cursor: 'help' }}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px]">
          <div className="space-y-1">
            <p className="text-xs font-semibold capitalize">{label}</p>
            {s.conditions.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: SEVERITY_FILL[c.severity] }}
                />
                <span className="flex-1">{c.name}</span>
                {c.isNew ? (
                  <Badge variant="outline" className="text-[9px] h-3.5 px-1 border-amber-300 text-amber-700">
                    {c.probability ? `${Math.round(c.probability * 100)}%` : t('petProfile.biologicalTimeline.newRisk', 'novo risco')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] h-3.5 px-1">
                    {t(`petProfile.severity.${c.severity}`, c.severity)}
                  </Badge>
                )}
                {c.protectedBy && c.protectedBy.length > 0 && (
                  <Badge variant="outline" className="text-[9px] h-3.5 px-1 border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30">
                    ★
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  // Systemic tint: soft body-wide overlay
  const systemicTint = systemicSeverity
    ? { fill: SEVERITY_FILL[systemicSeverity], opacity: SEVERITY_OPACITY[systemicSeverity] * 0.35 }
    : null;

  return (
    <TooltipProvider delayDuration={150}>
      <svg
        viewBox="0 0 600 400"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="bodyGradient" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.4" />
          </radialGradient>
          <filter id="organGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* === BODY SILHOUETTE === Lateral profile, head right, tail left === */}
        {/* Trunk */}
        <path
          d="
            M 90 220
            Q 80 195 95 175
            L 145 165
            Q 175 158 215 158
            L 380 158
            Q 430 156 470 168
            Q 500 175 520 195
            Q 535 210 538 230
            Q 538 250 525 260
            L 470 268
            L 455 268
            Q 440 260 420 260
            L 195 262
            Q 175 263 160 268
            L 110 270
            Q 95 268 90 250
            Z
          "
          fill="url(#bodyGradient)"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.2"
          opacity="0.85"
        />

        {/* Head */}
        <path
          d="
            M 470 168
            Q 490 140 525 138
            Q 555 138 575 158
            Q 585 175 580 195
            Q 575 210 555 215
            L 540 218
            Q 530 220 525 215
            L 510 200
            Q 495 192 478 188
            Z
          "
          fill="url(#bodyGradient)"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.2"
          opacity="0.85"
        />

        {/* Snout */}
        <path
          d="M 555 215 L 590 215 Q 595 220 590 228 L 555 226 Z"
          fill="url(#bodyGradient)"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.0"
          opacity="0.85"
        />

        {/* Tail */}
        <path
          d="M 90 220 Q 60 200 45 215 Q 35 230 50 245 Q 65 240 80 232 Z"
          fill="url(#bodyGradient)"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.0"
          opacity="0.85"
        />

        {/* Ear */}
        <path
          d="M 510 145 Q 505 110 530 105 Q 545 115 540 145 Z"
          fill="url(#bodyGradient)"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.0"
          opacity="0.85"
        />

        {/* === LIMBS === */}
        {/* Hind leg (left, near tail side) */}
        <g id="hind-leg-group">
          <path
            d="M 145 260 Q 140 290 150 320 L 165 360 L 195 360 L 195 320 Q 200 290 195 262 Z"
            fill="url(#bodyGradient)"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.0"
            opacity="0.85"
          />
        </g>
        {/* Hind leg (right) */}
        <g>
          <path
            d="M 220 262 Q 215 295 225 325 L 240 360 L 268 360 L 268 320 Q 270 290 270 264 Z"
            fill="url(#bodyGradient)"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.0"
            opacity="0.78"
          />
        </g>

        {/* Front leg (left) */}
        <g>
          <path
            d="M 410 260 Q 405 295 412 325 L 425 360 L 455 360 L 455 322 Q 458 290 455 262 Z"
            fill="url(#bodyGradient)"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.0"
            opacity="0.85"
          />
        </g>
        {/* Front leg (right) */}
        <g>
          <path
            d="M 470 262 Q 465 295 475 325 L 490 360 L 518 360 L 518 322 Q 520 290 518 264 Z"
            fill="url(#bodyGradient)"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.0"
            opacity="0.78"
          />
        </g>

        {/* === SYSTEMIC TINT (background pass) === */}
        {systemicTint && (
          <rect x="40" y="100" width="560" height="280" fill={systemicTint.fill} opacity={systemicTint.opacity} pointerEvents="none" />
        )}

        {/* === ORGAN OVERLAYS (only painted when affected) === */}
        {/* Brain */}
        {(() => {
          const f = fillFor('brain');
          return f.opacity > 0 ? (
            <ellipse cx={530} cy={163} rx={20} ry={14} fill={f.fill} opacity={f.opacity} filter="url(#organGlow)" />
          ) : null;
        })()}
        {/* Eyes */}
        {(() => {
          const f = fillFor('eyes');
          return f.opacity > 0 ? (
            <circle cx={555} cy={188} r={5} fill={f.fill} opacity={f.opacity + 0.15} />
          ) : null;
        })()}
        {/* Ears */}
        {(() => {
          const f = fillFor('ears');
          return f.opacity > 0 ? (
            <path d="M 510 145 Q 505 110 530 105 Q 545 115 540 145 Z" fill={f.fill} opacity={f.opacity} />
          ) : null;
        })()}
        {/* Mouth */}
        {(() => {
          const f = fillFor('mouth');
          return f.opacity > 0 ? (
            <ellipse cx={580} cy={222} rx={12} ry={5} fill={f.fill} opacity={f.opacity} />
          ) : null;
        })()}
        {/* Throat */}
        {(() => {
          const f = fillFor('throat');
          return f.opacity > 0 ? (
            <ellipse cx={485} cy={215} rx={12} ry={9} fill={f.fill} opacity={f.opacity} />
          ) : null;
        })()}
        {/* Heart */}
        {(() => {
          const f = fillFor('heart');
          return f.opacity > 0 ? (
            <g filter="url(#organGlow)">
              <ellipse cx={420} cy={210} rx={18} ry={14} fill={f.fill} opacity={f.opacity} />
              <animate attributeName="opacity" values={`${f.opacity};${f.opacity * 1.3};${f.opacity}`} dur="1.4s" repeatCount="indefinite" />
            </g>
          ) : null;
        })()}
        {/* Lungs */}
        {(() => {
          const f = fillFor('lungs');
          return f.opacity > 0 ? (
            <g>
              <ellipse cx={395} cy={195} rx={28} ry={16} fill={f.fill} opacity={f.opacity * 0.7} />
              <ellipse cx={420} cy={195} rx={28} ry={16} fill={f.fill} opacity={f.opacity * 0.7} />
            </g>
          ) : null;
        })()}
        {/* Liver */}
        {(() => {
          const f = fillFor('liver');
          return f.opacity > 0 ? (
            <ellipse cx={345} cy={215} rx={26} ry={16} fill={f.fill} opacity={f.opacity} filter="url(#organGlow)" />
          ) : null;
        })()}
        {/* Stomach */}
        {(() => {
          const f = fillFor('stomach');
          return f.opacity > 0 ? (
            <ellipse cx={310} cy={220} rx={20} ry={12} fill={f.fill} opacity={f.opacity} />
          ) : null;
        })()}
        {/* Pancreas */}
        {(() => {
          const f = fillFor('pancreas');
          return f.opacity > 0 ? (
            <ellipse cx={290} cy={232} rx={14} ry={6} fill={f.fill} opacity={f.opacity + 0.1} />
          ) : null;
        })()}
        {/* Kidneys */}
        {(() => {
          const f = fillFor('kidneys');
          return f.opacity > 0 ? (
            <g>
              <ellipse cx={250} cy={205} rx={10} ry={14} fill={f.fill} opacity={f.opacity} />
              <ellipse cx={272} cy={205} rx={10} ry={14} fill={f.fill} opacity={f.opacity * 0.85} />
            </g>
          ) : null;
        })()}
        {/* Adrenal (small, just above kidneys) */}
        {(() => {
          const f = fillFor('adrenal');
          return f.opacity > 0 ? (
            <ellipse cx={261} cy={188} rx={6} ry={4} fill={f.fill} opacity={f.opacity + 0.15} />
          ) : null;
        })()}
        {/* Intestines */}
        {(() => {
          const f = fillFor('intestines');
          return f.opacity > 0 ? (
            <path d="M 220 225 Q 240 240 260 225 Q 280 240 300 225 Q 320 240 340 225" fill="none" stroke={f.fill} strokeWidth="10" strokeLinecap="round" opacity={f.opacity} />
          ) : null;
        })()}
        {/* Bladder */}
        {(() => {
          const f = fillFor('bladder');
          return f.opacity > 0 ? (
            <ellipse cx={185} cy={245} rx={12} ry={9} fill={f.fill} opacity={f.opacity} />
          ) : null;
        })()}

        {/* === SPINE === Drawn as a thick line along the back === */}
        {(() => {
          const sc = fillFor('spine-cervical');
          const st = fillFor('spine-thoracic');
          const sl = fillFor('spine-lumbar');
          if (sc.opacity === 0 && st.opacity === 0 && sl.opacity === 0) return null;
          return (
            <g>
              {sc.opacity > 0 && (
                <line x1={460} y1={170} x2={500} y2={172} stroke={sc.fill} strokeWidth={6} opacity={sc.opacity} strokeLinecap="round" />
              )}
              {st.opacity > 0 && (
                <line x1={300} y1={166} x2={460} y2={170} stroke={st.fill} strokeWidth={6} opacity={st.opacity} strokeLinecap="round" />
              )}
              {sl.opacity > 0 && (
                <line x1={140} y1={170} x2={300} y2={166} stroke={sl.fill} strokeWidth={6} opacity={sl.opacity} strokeLinecap="round" />
              )}
            </g>
          );
        })()}

        {/* === JOINT HOTSPOTS === */}
        {/* Shoulder */}
        {renderHotspot(450, 195, 'shoulder', 12)}
        {renderNewRiskOutline(450, 195, 'shoulder', 16)}
        {/* Elbow (front legs) */}
        {renderHotspot(434, 295, 'elbow', 11)}
        {renderHotspot(495, 295, 'elbow', 11)}
        {renderNewRiskOutline(434, 295, 'elbow', 14)}
        {/* Hips */}
        {renderHotspot(165, 225, 'hips', 14)}
        {renderHotspot(245, 225, 'hips', 12)}
        {renderNewRiskOutline(165, 225, 'hips', 18)}
        {/* Knees */}
        {renderHotspot(177, 320, 'knee', 10)}
        {renderHotspot(252, 320, 'knee', 10)}
        {renderNewRiskOutline(177, 320, 'knee', 14)}
        {/* Hocks (ankle) */}
        {renderHotspot(180, 350, 'hock', 8)}
        {/* Wrist front */}
        {renderHotspot(440, 350, 'wrist-front', 8)}

        {/* === PAWS === Drawn as small ellipses at leg ends, tinted when affected === */}
        {(() => {
          const f = fillFor('paw-hind');
          return f.opacity > 0 ? (
            <g>
              <ellipse cx={180} cy={368} rx={18} ry={6} fill={f.fill} opacity={f.opacity + 0.1} />
              <ellipse cx={254} cy={368} rx={18} ry={6} fill={f.fill} opacity={f.opacity + 0.1} />
            </g>
          ) : null;
        })()}
        {(() => {
          const f = fillFor('paw-front');
          return f.opacity > 0 ? (
            <g>
              <ellipse cx={440} cy={368} rx={18} ry={6} fill={f.fill} opacity={f.opacity + 0.1} />
              <ellipse cx={504} cy={368} rx={18} ry={6} fill={f.fill} opacity={f.opacity + 0.1} />
            </g>
          ) : null;
        })()}

        {/* === SKIN/COAT === Outline tint on body silhouette === */}
        {(() => {
          const f = fillFor('skin');
          if (f.opacity === 0) return null;
          return (
            <path
              d="
                M 90 220 Q 80 195 95 175 L 145 165 Q 175 158 215 158
                L 380 158 Q 430 156 470 168 Q 500 175 520 195
                Q 535 210 538 230 Q 538 250 525 260 L 470 268
                L 455 268 Q 440 260 420 260 L 195 262
                Q 175 263 160 268 L 110 270 Q 95 268 90 250 Z
              "
              fill="none"
              stroke={f.fill}
              strokeWidth={3.5}
              strokeDasharray="6 4"
              opacity={f.opacity + 0.2}
            >
              <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="4s" repeatCount="indefinite" />
            </path>
          );
        })()}

        {/* === INTERACTIVE HIT ZONES (invisible, on top, for tooltips) === */}
        {interactiveRegion('brain', 530, 163, 22, 16, t('petProfile.anatomy.regions.brain', 'Cérebro'))}
        {interactiveRegion('eyes', 555, 188, 8, 6, t('petProfile.anatomy.regions.eyes', 'Olhos'))}
        {interactiveRegion('ears', 525, 125, 16, 22, t('petProfile.anatomy.regions.ears', 'Orelhas'))}
        {interactiveRegion('mouth', 580, 222, 14, 7, t('petProfile.anatomy.regions.mouth', 'Boca'))}
        {interactiveRegion('throat', 485, 215, 14, 11, t('petProfile.anatomy.regions.throat', 'Garganta'))}
        {interactiveRegion('heart', 420, 210, 20, 16, t('petProfile.anatomy.regions.heart', 'Coração'))}
        {interactiveRegion('lungs', 408, 195, 35, 18, t('petProfile.anatomy.regions.lungs', 'Pulmões'))}
        {interactiveRegion('liver', 345, 215, 28, 18, t('petProfile.anatomy.regions.liver', 'Fígado'))}
        {interactiveRegion('stomach', 310, 220, 22, 14, t('petProfile.anatomy.regions.stomach', 'Estômago'))}
        {interactiveRegion('pancreas', 290, 232, 16, 8, t('petProfile.anatomy.regions.pancreas', 'Pâncreas'))}
        {interactiveRegion('kidneys', 261, 205, 20, 16, t('petProfile.anatomy.regions.kidneys', 'Rins'))}
        {interactiveRegion('adrenal', 261, 188, 9, 6, t('petProfile.anatomy.regions.adrenal', 'Adrenais'))}
        {interactiveRegion('intestines', 280, 230, 65, 12, t('petProfile.anatomy.regions.intestines', 'Intestinos'))}
        {interactiveRegion('bladder', 185, 245, 14, 11, t('petProfile.anatomy.regions.bladder', 'Bexiga'))}
        {interactiveRegion('spine-thoracic', 380, 168, 80, 8, t('petProfile.anatomy.regions.spine-thoracic', 'Coluna torácica'))}
        {interactiveRegion('spine-lumbar', 220, 168, 80, 8, t('petProfile.anatomy.regions.spine-lumbar', 'Coluna lombar'))}
        {interactiveRegion('shoulder', 450, 195, 14, 14, t('petProfile.anatomy.regions.shoulder', 'Ombro'))}
        {interactiveRegion('elbow', 465, 295, 40, 16, t('petProfile.anatomy.regions.elbow', 'Cotovelos'))}
        {interactiveRegion('hips', 200, 225, 50, 16, t('petProfile.anatomy.regions.hips', 'Quadril'))}
        {interactiveRegion('knee', 215, 320, 45, 14, t('petProfile.anatomy.regions.knee', 'Joelhos'))}
        {interactiveRegion('hock', 180, 350, 12, 10, t('petProfile.anatomy.regions.hock', 'Jarrete'))}
        {interactiveRegion('paw-front', 470, 368, 50, 10, t('petProfile.anatomy.regions.paw-front', 'Patas dianteiras'))}
        {interactiveRegion('paw-hind', 215, 368, 50, 10, t('petProfile.anatomy.regions.paw-hind', 'Patas traseiras'))}
        {interactiveRegion('skin', 300, 210, 220, 60, t('petProfile.anatomy.regions.skin', 'Pele'))}
      </svg>
    </TooltipProvider>
  );
};

export default DogAnatomySVG;
