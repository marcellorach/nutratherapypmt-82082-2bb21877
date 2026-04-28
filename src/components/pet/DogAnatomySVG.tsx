import React, { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import type { AnatomyRegionId } from '@/services/anatomy-region-map';

export type Severity = 'mild' | 'moderate' | 'severe';

export interface RegionState {
  severity: Severity | null;
  isNew?: boolean;
  protected?: boolean;
  conditions: Array<{ name: string; severity: Severity; isNew: boolean; probability?: number; protectedBy?: string[] }>;
}

interface Props {
  regionStates: Partial<Record<AnatomyRegionId, RegionState>>;
  systemicSeverity?: Severity | null;
  showProtectionAura?: boolean;
  className?: string;
}

const SEVERITY_FILL: Record<Severity, string> = {
  mild: 'hsl(48, 95%, 55%)',
  moderate: 'hsl(25, 95%, 52%)',
  severe: 'hsl(0, 80%, 52%)',
};

const SEVERITY_STROKE: Record<Severity, string> = {
  mild: 'hsl(40, 90%, 40%)',
  moderate: 'hsl(20, 90%, 42%)',
  severe: 'hsl(0, 80%, 38%)',
};

const SEVERITY_OPACITY: Record<Severity, number> = {
  mild: 0.55,
  moderate: 0.72,
  severe: 0.88,
};

const SEVERITY_PULSE_DUR: Record<Severity, string> = {
  mild: '3.2s',
  moderate: '2.2s',
  severe: '1.4s',
};

/**
 * Lateral dog silhouette with anatomically accurate proportions.
 * viewBox 800x500. Dog facing right, standing.
 *
 * Region overlays only render when the region is affected.
 * Each condition type uses a distinct glyph (joint ring, organ stain,
 * brain wave, eye ring, skin marks, GI serpentine, etc.).
 */
const DogAnatomySVG: React.FC<Props> = ({
  regionStates,
  systemicSeverity = null,
  showProtectionAura = false,
  className,
}) => {
  const { t } = useTranslation();

  const get = (id: AnatomyRegionId): RegionState | undefined => regionStates[id];

  // Body silhouette path — anatomically tuned canine lateral profile
  // Trunk: chest deep, abdomen tucked, withers marked, croup rounded
  const bodyPath = useMemo(() => `
    M 130 280
    Q 110 270 100 245
    Q 95 215 115 198
    L 165 188
    Q 195 180 240 178
    L 320 175
    Q 355 173 395 178
    Q 430 184 460 196
    L 500 210
    Q 525 220 545 218
    Q 565 215 580 200
    Q 595 185 615 180
    Q 645 178 670 188
    Q 695 200 705 222
    Q 712 240 705 258
    Q 695 272 675 275
    L 645 275
    Q 625 273 615 262
    L 600 248
    Q 585 240 570 245
    L 540 258
    Q 510 275 470 280
    L 405 282
    L 405 360
    Q 408 388 415 410
    L 425 440
    L 458 440
    L 458 410
    Q 455 388 452 282
    L 322 282
    Q 322 388 320 410
    L 330 440
    L 363 440
    L 363 410
    Q 368 388 370 282
    L 230 282
    Q 232 388 230 410
    L 240 440
    L 273 440
    L 273 410
    Q 270 388 268 282
    L 195 282
    Q 188 388 188 410
    L 198 440
    L 230 440
    L 230 410
    Q 230 388 226 282
    L 175 280
    Q 150 282 130 280
    Z
  `, []);

  // Simpler trunk-only path for systemic recoloring (without legs/head, to overlay on top)
  const trunkOnlyPath = `
    M 130 280
    Q 110 270 100 245
    Q 95 215 115 198
    L 165 188
    Q 195 180 240 178
    L 320 175
    Q 355 173 395 178
    Q 430 184 460 196
    L 500 210
    Q 525 220 545 218
    L 545 270
    Q 510 278 470 280
    L 130 280
    Z
  `;

  // Determine which glyph to use for a given anatomical region.
  const renderJointGlyph = (cx: number, cy: number, id: AnatomyRegionId, baseR = 14) => {
    const s = get(id);
    if (!s || !s.severity) return null;
    const stroke = SEVERITY_STROKE[s.severity];
    const fill = SEVERITY_FILL[s.severity];
    const op = SEVERITY_OPACITY[s.severity];
    const dur = SEVERITY_PULSE_DUR[s.severity];
    return (
      <g key={`joint-${id}-${cx}`} pointerEvents="none">
        {/* Outer pulsing pain ring */}
        <circle cx={cx} cy={cy} r={baseR * 1.4} fill="none" stroke={stroke} strokeWidth={1.5} opacity={op * 0.6}>
          <animate attributeName="r" values={`${baseR * 1.2};${baseR * 1.7};${baseR * 1.2}`} dur={dur} repeatCount="indefinite" />
          <animate attributeName="opacity" values={`${op * 0.6};${op * 0.15};${op * 0.6}`} dur={dur} repeatCount="indefinite" />
        </circle>
        {/* Inner inflamed core */}
        <circle cx={cx} cy={cy} r={baseR * 0.7} fill={fill} opacity={op * 0.8} />
        {/* Pain spikes (4 short lines radiating) */}
        {s.severity !== 'mild' && [0, 90, 180, 270].map(angle => {
          const rad = (angle * Math.PI) / 180;
          const x1 = cx + Math.cos(rad) * baseR * 1.05;
          const y1 = cy + Math.sin(rad) * baseR * 1.05;
          const x2 = cx + Math.cos(rad) * baseR * 1.55;
          const y2 = cy + Math.sin(rad) * baseR * 1.55;
          return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={2} strokeLinecap="round" opacity={op} />;
        })}
        {/* New-risk dashed outline */}
        {s.isNew && (
          <circle cx={cx} cy={cy} r={baseR * 1.85} fill="none" stroke={stroke} strokeWidth={1.4} strokeDasharray="3 3" opacity={0.7}>
            <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="3s" repeatCount="indefinite" />
          </circle>
        )}
        {/* Protection star */}
        {s.protected && showProtectionAura && (
          <text x={cx + baseR * 1.6} y={cy - baseR * 1.2} fontSize={14} fill="hsl(160, 70%, 38%)" fontWeight="bold">★</text>
        )}
      </g>
    );
  };

  const renderOrganStain = (cx: number, cy: number, rx: number, ry: number, id: AnatomyRegionId, options?: { pulse?: boolean }) => {
    const s = get(id);
    if (!s || !s.severity) return null;
    const fill = SEVERITY_FILL[s.severity];
    const stroke = SEVERITY_STROKE[s.severity];
    const op = SEVERITY_OPACITY[s.severity];
    const dur = SEVERITY_PULSE_DUR[s.severity];
    return (
      <g key={`organ-${id}`} pointerEvents="none">
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} opacity={op * 0.7} stroke={stroke} strokeWidth={1.2}>
          {options?.pulse && (
            <animate attributeName="opacity" values={`${op * 0.7};${op * 1.0};${op * 0.7}`} dur={dur} repeatCount="indefinite" />
          )}
        </ellipse>
        {/* Texture dots for moderate+ */}
        {s.severity !== 'mild' && [-0.4, 0, 0.4].map(dx =>
          [-0.3, 0.3].map(dy => (
            <circle key={`${dx}-${dy}`} cx={cx + dx * rx} cy={cy + dy * ry} r={1.5} fill={stroke} opacity={op * 0.6} />
          ))
        )}
        {s.isNew && (
          <ellipse cx={cx} cy={cy} rx={rx + 4} ry={ry + 3} fill="none" stroke={stroke} strokeWidth={1.4} strokeDasharray="3 3" opacity={0.65}>
            <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="3s" repeatCount="indefinite" />
          </ellipse>
        )}
        {s.protected && showProtectionAura && (
          <text x={cx + rx + 2} y={cy - ry} fontSize={12} fill="hsl(160, 70%, 38%)" fontWeight="bold">★</text>
        )}
      </g>
    );
  };

  const renderBrainWave = (cx: number, cy: number) => {
    const s = get('brain');
    if (!s || !s.severity) return null;
    const stroke = SEVERITY_STROKE[s.severity];
    const op = SEVERITY_OPACITY[s.severity];
    const dur = SEVERITY_PULSE_DUR[s.severity];
    // Sinusoidal brain wave
    return (
      <g key="brain-wave" pointerEvents="none">
        <path
          d={`M ${cx - 22} ${cy} q 5 -8 10 0 t 10 0 t 10 0 t 10 0`}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={op}
        >
          <animate attributeName="opacity" values={`${op};${op * 0.4};${op}`} dur={dur} repeatCount="indefinite" />
        </path>
        <ellipse cx={cx} cy={cy + 8} rx={26} ry={10} fill={SEVERITY_FILL[s.severity]} opacity={op * 0.3} />
        {s.protected && showProtectionAura && (
          <text x={cx + 24} y={cy - 8} fontSize={12} fill="hsl(160, 70%, 38%)" fontWeight="bold">★</text>
        )}
      </g>
    );
  };

  const renderEyeRing = (cx: number, cy: number) => {
    const s = get('eyes');
    if (!s || !s.severity) return null;
    const stroke = SEVERITY_STROKE[s.severity];
    const op = SEVERITY_OPACITY[s.severity];
    return (
      <g key="eye" pointerEvents="none">
        <circle cx={cx} cy={cy} r={5} fill="hsl(45, 50%, 90%)" opacity={op + 0.1} stroke={stroke} strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={2} fill={stroke} opacity={op} />
        {s.severity === 'severe' && <line x1={cx - 7} y1={cy} x2={cx + 7} y2={cy} stroke={stroke} strokeWidth={1.2} opacity={op * 0.7} />}
      </g>
    );
  };

  const renderHeartPulse = (cx: number, cy: number) => {
    const s = get('heart');
    if (!s || !s.severity) return null;
    const fill = SEVERITY_FILL[s.severity];
    const stroke = SEVERITY_STROKE[s.severity];
    const op = SEVERITY_OPACITY[s.severity];
    const dur = SEVERITY_PULSE_DUR[s.severity];
    // Heart shape
    const heartD = `M ${cx} ${cy + 12}
                    C ${cx - 18} ${cy - 2}, ${cx - 22} ${cy - 18}, ${cx - 8} ${cy - 18}
                    C ${cx - 2} ${cy - 18}, ${cx} ${cy - 12}, ${cx} ${cy - 8}
                    C ${cx} ${cy - 12}, ${cx + 2} ${cy - 18}, ${cx + 8} ${cy - 18}
                    C ${cx + 22} ${cy - 18}, ${cx + 18} ${cy - 2}, ${cx} ${cy + 12} Z`;
    return (
      <g key="heart" pointerEvents="none">
        <path d={heartD} fill={fill} opacity={op * 0.85} stroke={stroke} strokeWidth={1.3}>
          <animateTransform attributeName="transform" type="scale" values="1;1.12;1" dur={dur} repeatCount="indefinite" additive="sum" />
        </path>
        {s.protected && showProtectionAura && (
          <text x={cx + 14} y={cy - 14} fontSize={12} fill="hsl(160, 70%, 38%)" fontWeight="bold">★</text>
        )}
      </g>
    );
  };

  const renderGISerpentine = (cx: number, cy: number) => {
    const s = get('intestines');
    if (!s || !s.severity) return null;
    const stroke = SEVERITY_STROKE[s.severity];
    const op = SEVERITY_OPACITY[s.severity];
    return (
      <g key="gi" pointerEvents="none">
        <path
          d={`M ${cx - 50} ${cy} Q ${cx - 30} ${cy - 12} ${cx - 10} ${cy} T ${cx + 30} ${cy} T ${cx + 50} ${cy}`}
          fill="none"
          stroke={stroke}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={op * 0.85}
        />
        {s.severity !== 'mild' && (
          <path
            d={`M ${cx - 50} ${cy + 8} Q ${cx - 30} ${cy + 20} ${cx - 10} ${cy + 8} T ${cx + 30} ${cy + 8} T ${cx + 50} ${cy + 8}`}
            fill="none"
            stroke={SEVERITY_FILL[s.severity]}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={op * 0.5}
          />
        )}
      </g>
    );
  };

  const renderSkinMarks = (path: string) => {
    const s = get('skin');
    if (!s || !s.severity) return null;
    const stroke = SEVERITY_STROKE[s.severity];
    const op = SEVERITY_OPACITY[s.severity];
    // Distribute small "x" marks along the body
    const positions: Array<[number, number]> = [
      [220, 200], [280, 195], [340, 190], [400, 195], [460, 200],
      [240, 240], [310, 235], [380, 240], [440, 245],
      [520, 215], [600, 200], // head/snout
    ];
    const count = s.severity === 'severe' ? positions.length : s.severity === 'moderate' ? 7 : 4;
    return (
      <g key="skin" pointerEvents="none" opacity={op}>
        {positions.slice(0, count).map(([x, y], i) => (
          <g key={i}>
            <line x1={x - 3} y1={y - 3} x2={x + 3} y2={y + 3} stroke={stroke} strokeWidth={1.4} strokeLinecap="round" />
            <line x1={x - 3} y1={y + 3} x2={x + 3} y2={y - 3} stroke={stroke} strokeWidth={1.4} strokeLinecap="round" />
          </g>
        ))}
      </g>
    );
  };

  // Systemic recoloring of the trunk + scattered inflammation particles
  const systemicLayer = useMemo(() => {
    if (!systemicSeverity) return null;
    const fill = SEVERITY_FILL[systemicSeverity];
    const op = SEVERITY_OPACITY[systemicSeverity] * 0.4;
    const dur = SEVERITY_PULSE_DUR[systemicSeverity];
    // Inflammation particles distributed across the body
    const particles: Array<[number, number]> = [
      [180, 240], [220, 220], [260, 250], [300, 225], [340, 245],
      [380, 220], [420, 250], [460, 230], [500, 245], [540, 230],
      [200, 260], [280, 265], [360, 268], [440, 265], [510, 260],
    ];
    return (
      <g pointerEvents="none">
        {/* Recolor the trunk softly */}
        <path d={trunkOnlyPath} fill={fill} opacity={op} />
        {/* Inflammation particles */}
        {particles.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.5} fill={fill} opacity={op * 1.8}>
            <animate
              attributeName="opacity"
              values={`${op * 1.8};${op * 0.6};${op * 1.8}`}
              dur={dur}
              repeatCount="indefinite"
              begin={`${i * 0.15}s`}
            />
          </circle>
        ))}
      </g>
    );
  }, [systemicSeverity, trunkOnlyPath]);

  // Tooltip hit zones — invisible ellipses on top
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
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="transparent" style={{ cursor: 'help' }} />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px]">
          <div className="space-y-1">
            <p className="text-xs font-semibold capitalize">{label}</p>
            {s.conditions.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_FILL[c.severity] }} />
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

  return (
    <TooltipProvider delayDuration={150}>
      <svg
        viewBox="0 0 800 500"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.45" />
            <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.65" />
          </linearGradient>
          <filter id="protectionAura" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="hsl(160, 70%, 50%)" floodOpacity="0.55" result="green" />
            <feComposite in="green" in2="blur" operator="in" result="halo" />
            <feMerge>
              <feMergeNode in="halo" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="organSoftGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* === ANATOMICAL SILHOUETTE === */}
        <g filter={showProtectionAura ? 'url(#protectionAura)' : undefined}>
          {/* Tail */}
          <path
            d="M 100 245 Q 70 220 55 230 Q 45 245 60 260 Q 75 255 95 250 Z"
            fill="url(#bodyGrad)"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.1"
            opacity="0.85"
          />

          {/* Main body (trunk + head + legs combined for clean outline) */}
          <path
            d="
              M 100 245
              Q 95 215 115 198
              L 165 188
              Q 195 180 240 178
              L 320 175
              Q 355 173 395 178
              Q 430 184 460 196
              L 500 210
              Q 525 220 545 218
              Q 565 215 580 200
              Q 595 185 615 180
              Q 645 178 668 188
              Q 690 198 702 215
              Q 712 230 708 248
              Q 700 265 678 270
              L 645 272
              Q 625 268 615 258
              L 600 244
              Q 588 238 575 244
              L 545 258
              Q 510 275 470 280
              L 405 282
              L 405 360
              Q 408 388 415 410
              L 425 440
              L 458 440
              Q 460 442 458 446
              L 425 446
              Q 418 446 415 442
              L 408 440
              L 405 442
              Q 405 446 365 446
              Q 363 442 363 410
              Q 365 388 363 282
              L 230 282
              Q 232 388 230 410
              Q 230 442 228 446
              Q 198 446 195 442
              Q 188 442 185 410
              Q 188 388 195 282
              L 130 280
              Q 105 282 100 245 Z
            "
            fill="url(#bodyGrad)"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.3"
            opacity="0.9"
          />

          {/* Snout */}
          <path
            d="M 690 218 L 738 218 Q 748 222 745 232 Q 740 238 720 236 L 690 232 Z"
            fill="url(#bodyGrad)"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.1"
            opacity="0.9"
          />
          {/* Nose */}
          <ellipse cx={742} cy={224} rx={6} ry={4.5} fill="hsl(var(--foreground))" opacity="0.65" />

          {/* Ear (drop ear style) */}
          <path
            d="M 615 180 Q 605 150 622 130 Q 645 122 658 145 Q 660 165 645 185 Z"
            fill="url(#bodyGrad)"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.1"
            opacity="0.82"
          />

          {/* Withers / shoulder line accent */}
          <path
            d="M 460 196 Q 470 188 485 186"
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="0.8"
            opacity="0.4"
          />

          {/* Knee/hock joint accents on hind legs */}
          <path d="M 195 360 Q 215 358 230 360" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.7" opacity="0.35" />
          <path d="M 268 360 Q 290 358 320 360" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.7" opacity="0.35" />

          {/* Front leg articulation accent */}
          <path d="M 363 360 Q 385 358 405 360" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.7" opacity="0.35" />
          <path d="M 425 360 Q 445 358 458 360" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.7" opacity="0.35" />
        </g>

        {/* === SYSTEMIC LAYER (recolors trunk, no background rect) === */}
        {systemicLayer}

        {/* === SPINE === */}
        {(() => {
          const sc = get('spine-cervical');
          const st = get('spine-thoracic');
          const sl = get('spine-lumbar');
          if (!sc?.severity && !st?.severity && !sl?.severity) return null;
          return (
            <g pointerEvents="none">
              {sc?.severity && (
                <line x1={550} y1={195} x2={605} y2={188} stroke={SEVERITY_FILL[sc.severity]} strokeWidth={5} strokeLinecap="round" opacity={SEVERITY_OPACITY[sc.severity]} />
              )}
              {st?.severity && (
                <line x1={350} y1={183} x2={550} y2={195} stroke={SEVERITY_FILL[st.severity]} strokeWidth={5} strokeLinecap="round" opacity={SEVERITY_OPACITY[st.severity]} />
              )}
              {sl?.severity && (
                <line x1={170} y1={188} x2={350} y2={183} stroke={SEVERITY_FILL[sl.severity]} strokeWidth={5} strokeLinecap="round" opacity={SEVERITY_OPACITY[sl.severity]} />
              )}
            </g>
          );
        })()}

        {/* === SKIN MARKS (across the body) === */}
        {renderSkinMarks(bodyPath)}

        {/* === ORGAN GLYPHS === */}
        {renderBrainWave(640, 195)}
        {renderEyeRing(682, 210)}
        {/* Ear tint */}
        {(() => {
          const s = get('ears');
          if (!s?.severity) return null;
          return (
            <path
              d="M 615 180 Q 605 150 622 130 Q 645 122 658 145 Q 660 165 645 185 Z"
              fill={SEVERITY_FILL[s.severity]}
              opacity={SEVERITY_OPACITY[s.severity] * 0.6}
              pointerEvents="none"
            />
          );
        })()}
        {/* Mouth */}
        {(() => {
          const s = get('mouth');
          if (!s?.severity) return null;
          return <ellipse cx={720} cy={232} rx={14} ry={5} fill={SEVERITY_FILL[s.severity]} opacity={SEVERITY_OPACITY[s.severity]} pointerEvents="none" />;
        })()}
        {/* Throat */}
        {renderOrganStain(575, 235, 14, 10, 'throat')}
        {/* Heart (anatomical position: caudal to shoulder, ventral) */}
        {renderHeartPulse(490, 235)}
        {/* Lungs (dorsal to heart, fill thoracic cavity) */}
        {(() => {
          const s = get('lungs');
          if (!s?.severity) return null;
          return (
            <g pointerEvents="none">
              <ellipse cx={460} cy={215} rx={36} ry={20} fill={SEVERITY_FILL[s.severity]} opacity={SEVERITY_OPACITY[s.severity] * 0.55} stroke={SEVERITY_STROKE[s.severity]} strokeWidth={1} />
              <ellipse cx={510} cy={215} rx={36} ry={20} fill={SEVERITY_FILL[s.severity]} opacity={SEVERITY_OPACITY[s.severity] * 0.55} stroke={SEVERITY_STROKE[s.severity]} strokeWidth={1} />
            </g>
          );
        })()}
        {/* Liver */}
        {renderOrganStain(395, 240, 32, 18, 'liver', { pulse: true })}
        {/* Stomach */}
        {renderOrganStain(345, 245, 24, 14, 'stomach')}
        {/* Pancreas */}
        {renderOrganStain(310, 252, 18, 7, 'pancreas')}
        {/* Kidneys */}
        {(() => {
          const s = get('kidneys');
          if (!s?.severity) return null;
          const f = SEVERITY_FILL[s.severity];
          const st = SEVERITY_STROKE[s.severity];
          const op = SEVERITY_OPACITY[s.severity];
          return (
            <g pointerEvents="none">
              {/* Bean-shaped kidneys */}
              <path d="M 265 215 Q 250 210 248 225 Q 246 245 260 250 Q 275 248 274 230 Q 273 218 265 215 Z" fill={f} opacity={op * 0.85} stroke={st} strokeWidth={1.2} />
              <path d="M 290 215 Q 275 210 273 225 Q 271 245 285 250 Q 300 248 299 230 Q 298 218 290 215 Z" fill={f} opacity={op * 0.7} stroke={st} strokeWidth={1.2} />
              {s.protected && showProtectionAura && (
                <text x={302} y={210} fontSize={12} fill="hsl(160, 70%, 38%)" fontWeight="bold">★</text>
              )}
            </g>
          );
        })()}
        {/* Adrenal */}
        {renderOrganStain(279, 207, 7, 4, 'adrenal')}
        {/* Intestines */}
        {renderGISerpentine(280, 260)}
        {/* Bladder */}
        {renderOrganStain(200, 270, 14, 10, 'bladder')}

        {/* === JOINT GLYPHS === */}
        {/* Shoulder */}
        {renderJointGlyph(465, 220, 'shoulder', 12)}
        {/* Elbows (front legs) */}
        {renderJointGlyph(383, 340, 'elbow', 11)}
        {renderJointGlyph(442, 340, 'elbow', 11)}
        {/* Hips */}
        {renderJointGlyph(213, 245, 'hips', 14)}
        {renderJointGlyph(290, 245, 'hips', 12)}
        {/* Knees (stifles) */}
        {renderJointGlyph(213, 360, 'knee', 10)}
        {renderJointGlyph(295, 360, 'knee', 10)}
        {/* Hocks */}
        {renderJointGlyph(213, 410, 'hock', 8)}
        {/* Wrist */}
        {renderJointGlyph(442, 410, 'wrist-front', 8)}

        {/* === PAW TINTS === */}
        {(() => {
          const s = get('paw-hind');
          if (!s?.severity) return null;
          return (
            <g pointerEvents="none">
              <ellipse cx={213} cy={446} rx={20} ry={5} fill={SEVERITY_FILL[s.severity]} opacity={SEVERITY_OPACITY[s.severity]} />
              <ellipse cx={295} cy={446} rx={20} ry={5} fill={SEVERITY_FILL[s.severity]} opacity={SEVERITY_OPACITY[s.severity]} />
            </g>
          );
        })()}
        {(() => {
          const s = get('paw-front');
          if (!s?.severity) return null;
          return (
            <g pointerEvents="none">
              <ellipse cx={383} cy={446} rx={20} ry={5} fill={SEVERITY_FILL[s.severity]} opacity={SEVERITY_OPACITY[s.severity]} />
              <ellipse cx={442} cy={446} rx={20} ry={5} fill={SEVERITY_FILL[s.severity]} opacity={SEVERITY_OPACITY[s.severity]} />
            </g>
          );
        })()}

        {/* === INTERACTIVE HIT ZONES === */}
        {interactiveRegion('brain', 640, 195, 26, 18, t('petProfile.anatomy.regions.brain', 'Cérebro'))}
        {interactiveRegion('eyes', 682, 210, 8, 7, t('petProfile.anatomy.regions.eyes', 'Olhos'))}
        {interactiveRegion('ears', 638, 155, 22, 30, t('petProfile.anatomy.regions.ears', 'Orelhas'))}
        {interactiveRegion('mouth', 720, 232, 18, 8, t('petProfile.anatomy.regions.mouth', 'Boca'))}
        {interactiveRegion('throat', 575, 235, 16, 12, t('petProfile.anatomy.regions.throat', 'Garganta'))}
        {interactiveRegion('heart', 490, 230, 22, 18, t('petProfile.anatomy.regions.heart', 'Coração'))}
        {interactiveRegion('lungs', 485, 215, 50, 22, t('petProfile.anatomy.regions.lungs', 'Pulmões'))}
        {interactiveRegion('liver', 395, 240, 34, 20, t('petProfile.anatomy.regions.liver', 'Fígado'))}
        {interactiveRegion('stomach', 345, 245, 26, 16, t('petProfile.anatomy.regions.stomach', 'Estômago'))}
        {interactiveRegion('pancreas', 310, 252, 20, 9, t('petProfile.anatomy.regions.pancreas', 'Pâncreas'))}
        {interactiveRegion('kidneys', 279, 230, 30, 22, t('petProfile.anatomy.regions.kidneys', 'Rins'))}
        {interactiveRegion('adrenal', 279, 207, 9, 6, t('petProfile.anatomy.regions.adrenal', 'Adrenais'))}
        {interactiveRegion('intestines', 280, 260, 60, 12, t('petProfile.anatomy.regions.intestines', 'Intestinos'))}
        {interactiveRegion('bladder', 200, 270, 16, 12, t('petProfile.anatomy.regions.bladder', 'Bexiga'))}
        {interactiveRegion('spine-cervical', 575, 192, 35, 8, t('petProfile.anatomy.regions.spine-cervical', 'Coluna cervical'))}
        {interactiveRegion('spine-thoracic', 450, 190, 105, 8, t('petProfile.anatomy.regions.spine-thoracic', 'Coluna torácica'))}
        {interactiveRegion('spine-lumbar', 260, 185, 95, 8, t('petProfile.anatomy.regions.spine-lumbar', 'Coluna lombar'))}
        {interactiveRegion('shoulder', 465, 220, 16, 14, t('petProfile.anatomy.regions.shoulder', 'Ombro'))}
        {interactiveRegion('elbow', 412, 340, 50, 16, t('petProfile.anatomy.regions.elbow', 'Cotovelos'))}
        {interactiveRegion('hips', 250, 245, 55, 18, t('petProfile.anatomy.regions.hips', 'Quadril'))}
        {interactiveRegion('knee', 254, 360, 55, 14, t('petProfile.anatomy.regions.knee', 'Joelhos'))}
        {interactiveRegion('hock', 213, 410, 14, 12, t('petProfile.anatomy.regions.hock', 'Jarrete'))}
        {interactiveRegion('wrist-front', 442, 410, 14, 12, t('petProfile.anatomy.regions.wrist-front', 'Punhos'))}
        {interactiveRegion('paw-front', 412, 446, 50, 10, t('petProfile.anatomy.regions.paw-front', 'Patas dianteiras'))}
        {interactiveRegion('paw-hind', 254, 446, 55, 10, t('petProfile.anatomy.regions.paw-hind', 'Patas traseiras'))}
        {interactiveRegion('skin', 380, 230, 250, 65, t('petProfile.anatomy.regions.skin', 'Pele'))}
      </svg>
    </TooltipProvider>
  );
};

export default DogAnatomySVG;
