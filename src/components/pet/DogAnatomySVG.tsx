import React, { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import type { AnatomyRegionId } from '@/services/anatomy-region-map';
import dogSilhouette from '@/assets/dog-silhouette.png';

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
  mild: 0.65,
  moderate: 0.8,
  severe: 0.92,
};

const SEVERITY_PULSE_DUR: Record<Severity, string> = {
  mild: '3.2s',
  moderate: '2.2s',
  severe: '1.4s',
};

/**
 * Anatomical regions mapped as percentages over the dog-silhouette.png
 * (Golden Retriever standing, facing right, viewBox 1000x1000).
 * Values calibrated visually against the source image.
 */
type RegionCoord = { cx: number; cy: number; rx: number; ry: number };
const REGION_COORDS: Record<AnatomyRegionId, RegionCoord> = {
  // Head
  brain:           { cx: 815, cy: 280, rx: 45, ry: 35 },
  eyes:            { cx: 850, cy: 295, rx: 12, ry: 10 },
  ears:            { cx: 790, cy: 250, rx: 30, ry: 35 },
  mouth:           { cx: 905, cy: 340, rx: 28, ry: 12 },
  throat:          { cx: 770, cy: 370, rx: 25, ry: 18 },
  // Spine
  'spine-cervical':{ cx: 720, cy: 330, rx: 50, ry: 14 },
  'spine-thoracic':{ cx: 560, cy: 360, rx: 130, ry: 14 },
  'spine-lumbar':  { cx: 340, cy: 400, rx: 110, ry: 14 },
  // Thorax
  heart:           { cx: 620, cy: 510, rx: 32, ry: 28 },
  lungs:           { cx: 595, cy: 460, rx: 70, ry: 35 },
  // Abdomen
  liver:           { cx: 525, cy: 520, rx: 45, ry: 26 },
  stomach:         { cx: 460, cy: 545, rx: 36, ry: 22 },
  pancreas:        { cx: 425, cy: 555, rx: 24, ry: 10 },
  kidneys:         { cx: 340, cy: 490, rx: 38, ry: 26 },
  adrenal:         { cx: 340, cy: 460, rx: 12, ry: 7 },
  intestines:      { cx: 400, cy: 605, rx: 80, ry: 22 },
  bladder:         { cx: 280, cy: 615, rx: 22, ry: 16 },
  reproductive:    { cx: 240, cy: 640, rx: 18, ry: 12 },
  // Front leg (right side of image — closer to head)
  shoulder:        { cx: 660, cy: 480, rx: 22, ry: 18 },
  elbow:           { cx: 660, cy: 660, rx: 18, ry: 14 },
  'wrist-front':   { cx: 660, cy: 820, rx: 16, ry: 12 },
  'paw-front':     { cx: 655, cy: 905, rx: 30, ry: 14 },
  // Hind leg (left side of image — toward tail)
  hips:            { cx: 270, cy: 490, rx: 38, ry: 26 },
  knee:            { cx: 245, cy: 685, rx: 18, ry: 16 },
  hock:            { cx: 245, cy: 815, rx: 16, ry: 14 },
  'paw-hind':      { cx: 250, cy: 905, rx: 32, ry: 14 },
  // Skin/coat (covers full body — used for distributed marks)
  skin:            { cx: 500, cy: 500, rx: 350, ry: 200 },
  coat:            { cx: 500, cy: 500, rx: 350, ry: 200 },
  systemic:        { cx: 500, cy: 500, rx: 350, ry: 200 },
};

/**
 * Anatomical overlay using a real Golden Retriever silhouette as base.
 * Glyphs are positioned as SVG primitives over the raster image inside
 * the same viewBox, so everything scales together cleanly.
 */
const DogAnatomySVG: React.FC<Props> = ({
  regionStates,
  systemicSeverity = null,
  showProtectionAura = false,
  className,
}) => {
  const { t } = useTranslation();
  const get = (id: AnatomyRegionId): RegionState | undefined => regionStates[id];
  const coord = (id: AnatomyRegionId) => REGION_COORDS[id];

  // === Glyph renderers ===

  const renderJointGlyph = (id: AnatomyRegionId, baseR = 22) => {
    const s = get(id);
    if (!s || !s.severity) return null;
    const c = coord(id);
    const stroke = SEVERITY_STROKE[s.severity];
    const fill = SEVERITY_FILL[s.severity];
    const op = SEVERITY_OPACITY[s.severity];
    const dur = SEVERITY_PULSE_DUR[s.severity];
    return (
      <g key={`joint-${id}`} pointerEvents="none">
        <circle cx={c.cx} cy={c.cy} r={baseR * 1.3} fill="none" stroke={stroke} strokeWidth={2.4} opacity={op * 0.55}>
          <animate attributeName="r" values={`${baseR * 1.1};${baseR * 1.6};${baseR * 1.1}`} dur={dur} repeatCount="indefinite" />
          <animate attributeName="opacity" values={`${op * 0.55};${op * 0.1};${op * 0.55}`} dur={dur} repeatCount="indefinite" />
        </circle>
        <circle cx={c.cx} cy={c.cy} r={baseR * 0.7} fill={fill} opacity={op * 0.85} stroke={stroke} strokeWidth={1.5} />
        {s.severity !== 'mild' && [0, 60, 120, 180, 240, 300].map(angle => {
          const rad = (angle * Math.PI) / 180;
          const x1 = c.cx + Math.cos(rad) * baseR * 1.0;
          const y1 = c.cy + Math.sin(rad) * baseR * 1.0;
          const x2 = c.cx + Math.cos(rad) * baseR * 1.55;
          const y2 = c.cy + Math.sin(rad) * baseR * 1.55;
          return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={3} strokeLinecap="round" opacity={op} />;
        })}
        {s.isNew && (
          <circle cx={c.cx} cy={c.cy} r={baseR * 1.9} fill="none" stroke={stroke} strokeWidth={2} strokeDasharray="6 5" opacity={0.7}>
            <animate attributeName="stroke-dashoffset" from="0" to="-22" dur="3s" repeatCount="indefinite" />
          </circle>
        )}
        {s.protected && showProtectionAura && (
          <text x={c.cx + baseR * 1.4} y={c.cy - baseR * 1.0} fontSize={22} fill="hsl(160, 70%, 38%)" fontWeight="bold">★</text>
        )}
      </g>
    );
  };

  const renderOrganStain = (id: AnatomyRegionId, options?: { pulse?: boolean }) => {
    const s = get(id);
    if (!s || !s.severity) return null;
    const c = coord(id);
    const fill = SEVERITY_FILL[s.severity];
    const stroke = SEVERITY_STROKE[s.severity];
    const op = SEVERITY_OPACITY[s.severity];
    const dur = SEVERITY_PULSE_DUR[s.severity];
    return (
      <g key={`organ-${id}`} pointerEvents="none">
        <ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={fill} opacity={op * 0.7} stroke={stroke} strokeWidth={2}>
          {options?.pulse && (
            <animate attributeName="opacity" values={`${op * 0.7};${op * 1.0};${op * 0.7}`} dur={dur} repeatCount="indefinite" />
          )}
        </ellipse>
        {s.severity !== 'mild' && [-0.5, 0, 0.5].map(dx =>
          [-0.4, 0.4].map(dy => (
            <circle key={`${dx}-${dy}`} cx={c.cx + dx * c.rx * 0.7} cy={c.cy + dy * c.ry * 0.6} r={2.5} fill={stroke} opacity={op * 0.7} />
          ))
        )}
        {s.isNew && (
          <ellipse cx={c.cx} cy={c.cy} rx={c.rx + 7} ry={c.ry + 6} fill="none" stroke={stroke} strokeWidth={2} strokeDasharray="6 5" opacity={0.65}>
            <animate attributeName="stroke-dashoffset" from="0" to="-22" dur="3s" repeatCount="indefinite" />
          </ellipse>
        )}
        {s.protected && showProtectionAura && (
          <text x={c.cx + c.rx + 4} y={c.cy - c.ry} fontSize={20} fill="hsl(160, 70%, 38%)" fontWeight="bold">★</text>
        )}
      </g>
    );
  };

  const renderBrainWave = () => {
    const s = get('brain');
    if (!s || !s.severity) return null;
    const c = coord('brain');
    const stroke = SEVERITY_STROKE[s.severity];
    const fill = SEVERITY_FILL[s.severity];
    const op = SEVERITY_OPACITY[s.severity];
    const dur = SEVERITY_PULSE_DUR[s.severity];
    return (
      <g key="brain-wave" pointerEvents="none">
        <ellipse cx={c.cx} cy={c.cy + 4} rx={c.rx} ry={c.ry} fill={fill} opacity={op * 0.4} />
        <path
          d={`M ${c.cx - 35} ${c.cy - 5} q 8 -14 16 0 t 16 0 t 16 0 t 16 0`}
          fill="none"
          stroke={stroke}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={op}
        >
          <animate attributeName="opacity" values={`${op};${op * 0.3};${op}`} dur={dur} repeatCount="indefinite" />
        </path>
        {s.protected && showProtectionAura && (
          <text x={c.cx + c.rx} y={c.cy - c.ry} fontSize={22} fill="hsl(160, 70%, 38%)" fontWeight="bold">★</text>
        )}
      </g>
    );
  };

  const renderEyeRing = () => {
    const s = get('eyes');
    if (!s || !s.severity) return null;
    const c = coord('eyes');
    const stroke = SEVERITY_STROKE[s.severity];
    const op = SEVERITY_OPACITY[s.severity];
    return (
      <g key="eye" pointerEvents="none">
        <circle cx={c.cx} cy={c.cy} r={9} fill="hsl(45, 50%, 92%)" opacity={op + 0.05} stroke={stroke} strokeWidth={2.5} />
        <circle cx={c.cx} cy={c.cy} r={3.5} fill={stroke} opacity={op} />
      </g>
    );
  };

  const renderHeartPulse = () => {
    const s = get('heart');
    if (!s || !s.severity) return null;
    const c = coord('heart');
    const fill = SEVERITY_FILL[s.severity];
    const stroke = SEVERITY_STROKE[s.severity];
    const op = SEVERITY_OPACITY[s.severity];
    const dur = SEVERITY_PULSE_DUR[s.severity];
    const heartD = `M ${c.cx} ${c.cy + 22}
                    C ${c.cx - 32} ${c.cy - 4}, ${c.cx - 38} ${c.cy - 30}, ${c.cx - 14} ${c.cy - 30}
                    C ${c.cx - 4} ${c.cy - 30}, ${c.cx} ${c.cy - 20}, ${c.cx} ${c.cy - 14}
                    C ${c.cx} ${c.cy - 20}, ${c.cx + 4} ${c.cy - 30}, ${c.cx + 14} ${c.cy - 30}
                    C ${c.cx + 38} ${c.cy - 30}, ${c.cx + 32} ${c.cy - 4}, ${c.cx} ${c.cy + 22} Z`;
    return (
      <g key="heart" pointerEvents="none" style={{ transformOrigin: `${c.cx}px ${c.cy}px`, transformBox: 'fill-box' as any }}>
        <path d={heartD} fill={fill} opacity={op * 0.9} stroke={stroke} strokeWidth={2}>
          <animateTransform attributeName="transform" type="scale" values="1;1.14;1" dur={dur} repeatCount="indefinite" additive="sum" />
        </path>
        {s.protected && showProtectionAura && (
          <text x={c.cx + 22} y={c.cy - 22} fontSize={22} fill="hsl(160, 70%, 38%)" fontWeight="bold">★</text>
        )}
      </g>
    );
  };

  const renderGISerpentine = () => {
    const s = get('intestines');
    if (!s || !s.severity) return null;
    const c = coord('intestines');
    const stroke = SEVERITY_STROKE[s.severity];
    const fill = SEVERITY_FILL[s.severity];
    const op = SEVERITY_OPACITY[s.severity];
    return (
      <g key="gi" pointerEvents="none">
        <path
          d={`M ${c.cx - 70} ${c.cy} Q ${c.cx - 45} ${c.cy - 18} ${c.cx - 20} ${c.cy} T ${c.cx + 30} ${c.cy} T ${c.cx + 70} ${c.cy}`}
          fill="none"
          stroke={stroke}
          strokeWidth={9}
          strokeLinecap="round"
          opacity={op * 0.85}
        />
        {s.severity !== 'mild' && (
          <path
            d={`M ${c.cx - 70} ${c.cy + 14} Q ${c.cx - 45} ${c.cy + 32} ${c.cx - 20} ${c.cy + 14} T ${c.cx + 30} ${c.cy + 14} T ${c.cx + 70} ${c.cy + 14}`}
            fill="none"
            stroke={fill}
            strokeWidth={6}
            strokeLinecap="round"
            opacity={op * 0.55}
          />
        )}
      </g>
    );
  };

  const renderSpineLine = (id: AnatomyRegionId) => {
    const s = get(id);
    if (!s || !s.severity) return null;
    const c = coord(id);
    return (
      <line
        key={id}
        x1={c.cx - c.rx}
        y1={c.cy}
        x2={c.cx + c.rx}
        y2={c.cy}
        stroke={SEVERITY_FILL[s.severity]}
        strokeWidth={9}
        strokeLinecap="round"
        opacity={SEVERITY_OPACITY[s.severity]}
        pointerEvents="none"
      />
    );
  };

  const renderSkinMarks = () => {
    const s = get('skin');
    if (!s || !s.severity) return null;
    const stroke = SEVERITY_STROKE[s.severity];
    const op = SEVERITY_OPACITY[s.severity];
    const positions: Array<[number, number]> = [
      [380, 410], [460, 400], [540, 395], [620, 405], [700, 415],
      [400, 470], [490, 460], [580, 465], [660, 475],
      [350, 540], [430, 545], [520, 555], [610, 555],
      [780, 320], // ear
      [820, 360], // cheek
    ];
    const count = s.severity === 'severe' ? positions.length : s.severity === 'moderate' ? 9 : 5;
    return (
      <g key="skin" pointerEvents="none" opacity={op}>
        {positions.slice(0, count).map(([x, y], i) => (
          <g key={i}>
            <line x1={x - 5} y1={y - 5} x2={x + 5} y2={y + 5} stroke={stroke} strokeWidth={2.4} strokeLinecap="round" />
            <line x1={x - 5} y1={y + 5} x2={x + 5} y2={y - 5} stroke={stroke} strokeWidth={2.4} strokeLinecap="round" />
          </g>
        ))}
      </g>
    );
  };

  // Systemic recoloring: warm overlay on the body silhouette + drifting particles
  const systemicLayer = useMemo(() => {
    if (!systemicSeverity) return null;
    const fill = SEVERITY_FILL[systemicSeverity];
    const op = SEVERITY_OPACITY[systemicSeverity] * 0.22;
    const dur = SEVERITY_PULSE_DUR[systemicSeverity];
    const particles: Array<[number, number]> = [
      [350, 470], [420, 450], [490, 480], [560, 455], [630, 475],
      [380, 530], [460, 545], [540, 535], [620, 545],
      [400, 590], [480, 600], [560, 595], [640, 590],
      [320, 510], [690, 510],
    ];
    return (
      <g pointerEvents="none">
        {/* Soft body-shaped overlay (matches the silhouette mass) */}
        <ellipse cx={500} cy={510} rx={300} ry={140} fill={fill} opacity={op} />
        {particles.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={4} fill={fill} opacity={op * 2.5}>
            <animate
              attributeName="opacity"
              values={`${op * 2.5};${op * 0.6};${op * 2.5}`}
              dur={dur}
              repeatCount="indefinite"
              begin={`${i * 0.18}s`}
            />
          </circle>
        ))}
      </g>
    );
  }, [systemicSeverity]);

  const interactiveRegion = (id: AnatomyRegionId, label: string) => {
    const s = get(id);
    if (!s) return null;
    const c = coord(id);
    return (
      <Tooltip key={`tt-${id}`}>
        <TooltipTrigger asChild>
          <ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill="transparent" style={{ cursor: 'help' }} />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px]">
          <div className="space-y-1">
            <p className="text-xs font-semibold capitalize">{label}</p>
            {s.conditions.map((cnd, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_FILL[cnd.severity] }} />
                <span className="flex-1">{cnd.name}</span>
                {cnd.isNew ? (
                  <Badge variant="outline" className="text-[9px] h-3.5 px-1 border-amber-300 text-amber-700">
                    {cnd.probability ? `${Math.round(cnd.probability * 100)}%` : t('petProfile.biologicalTimeline.newRisk', 'novo risco')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] h-3.5 px-1">
                    {t(`petProfile.severity.${cnd.severity}`, cnd.severity)}
                  </Badge>
                )}
                {cnd.protectedBy && cnd.protectedBy.length > 0 && (
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
        viewBox="0 0 1000 1000"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="protectionAura" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor="hsl(160, 70%, 50%)" floodOpacity="0.55" result="green" />
            <feComposite in="green" in2="blur" operator="in" result="halo" />
            <feMerge>
              <feMergeNode in="halo" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* === BASE: real Golden Retriever silhouette === */}
        <g filter={showProtectionAura ? 'url(#protectionAura)' : undefined}>
          <image
            href={dogSilhouette}
            x="0"
            y="0"
            width="1000"
            height="1000"
            preserveAspectRatio="xMidYMid meet"
            opacity="0.92"
          />
        </g>

        {/* === SYSTEMIC LAYER === */}
        {systemicLayer}

        {/* === SPINE === */}
        {renderSpineLine('spine-cervical')}
        {renderSpineLine('spine-thoracic')}
        {renderSpineLine('spine-lumbar')}

        {/* === SKIN MARKS === */}
        {renderSkinMarks()}

        {/* === ORGAN GLYPHS === */}
        {renderBrainWave()}
        {renderEyeRing()}
        {/* Ear tint */}
        {(() => {
          const s = get('ears');
          if (!s?.severity) return null;
          const c = coord('ears');
          return (
            <ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={SEVERITY_FILL[s.severity]} opacity={SEVERITY_OPACITY[s.severity] * 0.55} pointerEvents="none" />
          );
        })()}
        {/* Mouth */}
        {(() => {
          const s = get('mouth');
          if (!s?.severity) return null;
          const c = coord('mouth');
          return <ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={SEVERITY_FILL[s.severity]} opacity={SEVERITY_OPACITY[s.severity] * 0.7} pointerEvents="none" />;
        })()}
        {renderOrganStain('throat')}
        {renderHeartPulse()}
        {renderOrganStain('lungs')}
        {renderOrganStain('liver', { pulse: true })}
        {renderOrganStain('stomach')}
        {renderOrganStain('pancreas')}
        {renderOrganStain('kidneys')}
        {renderOrganStain('adrenal')}
        {renderGISerpentine()}
        {renderOrganStain('bladder')}

        {/* === JOINT GLYPHS === */}
        {renderJointGlyph('shoulder', 22)}
        {renderJointGlyph('elbow', 20)}
        {renderJointGlyph('wrist-front', 16)}
        {renderJointGlyph('hips', 26)}
        {renderJointGlyph('knee', 20)}
        {renderJointGlyph('hock', 16)}

        {/* === PAW TINTS === */}
        {(() => {
          const s = get('paw-hind');
          if (!s?.severity) return null;
          const c = coord('paw-hind');
          return <ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={SEVERITY_FILL[s.severity]} opacity={SEVERITY_OPACITY[s.severity] * 0.7} pointerEvents="none" />;
        })()}
        {(() => {
          const s = get('paw-front');
          if (!s?.severity) return null;
          const c = coord('paw-front');
          return <ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={SEVERITY_FILL[s.severity]} opacity={SEVERITY_OPACITY[s.severity] * 0.7} pointerEvents="none" />;
        })()}

        {/* === INTERACTIVE HIT ZONES === */}
        {(Object.keys(REGION_COORDS) as AnatomyRegionId[]).map(id =>
          interactiveRegion(id, t(`petProfile.anatomy.regions.${id}`, id))
        )}
      </svg>
    </TooltipProvider>
  );
};

export default DogAnatomySVG;