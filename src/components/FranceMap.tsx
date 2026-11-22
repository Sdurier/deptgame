import React, { useMemo, useRef, useState } from 'react';
import { LocateFixed, Minus, Plus, Search } from 'lucide-react';
import rawMapData from '../data/franceMapData.json';
import { DEPARTMENTS_META, DepartmentMeta } from '../data/departmentsMeta';

export type DeptVisualStatus = 'default' | 'target' | 'correct' | 'hinted' | 'missed' | 'wrongFlash';

interface DeptPathEntry {
  code: string;
  nom: string;
  isDrom: boolean;
  d: string;
  cx: number;
  cy: number;
  bbox: number[];
  area: number;
  box?: { x: number; y: number; w: number; h: number };
}

interface PetiteCouronneEntry {
  d: string;
  cx: number;
  cy: number;
  bbox: number[];
  area: number;
}

const MAP_DATA = rawMapData as {
  departments: Record<string, DeptPathEntry>;
  petiteCouronne: Record<string, PetiteCouronneEntry>;
};

const DROM_CODES = ['971', '972', '973', '974', '976'];
const PETITE_COURONNE_CODES = ['92', '93', '94', '75']; // Render 75 last so Paris sits cleanly on top

interface FranceMapProps {
  mode: 'map-click' | 'text-guess' | 'explorer';
  activeScope: 'all' | 'metro' | 'drom';
  targetCode: string | null;
  statuses: Record<string, DeptVisualStatus>;
  wrongFlashCode: string | null;
  wrongFlashLabel: string | null;
  selectedExplorerCode: string | null;
  showAllLabels?: boolean;
  onSelectDepartment: (code: string) => void;
}

export const FranceMap: React.FC<FranceMapProps> = ({
  mode,
  activeScope,
  targetCode,
  statuses,
  wrongFlashCode,
  wrongFlashLabel,
  selectedExplorerCode,
  showAllLabels = false,
  onSelectDepartment,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null);

  const allDeptEntries = useMemo(() => Object.values(MAP_DATA.departments), []);
  const metroEntries = useMemo(() => {
    // Render larger departments first, Paris (75) and inner ring last so small paths stay clickable
    return allDeptEntries
      .filter((d) => !d.isDrom)
      .sort((a, b) => {
        if (a.code === '75') return 1;
        if (b.code === '75') return -1;
        return b.area - a.area;
      });
  }, [allDeptEntries]);

  const dromEntries = useMemo(
    () => DROM_CODES.map((c) => MAP_DATA.departments[c]).filter(Boolean),
    []
  );

  const isCodeEnabled = (entry: DeptPathEntry): boolean => {
    if (activeScope === 'metro' && entry.isDrom) return false;
    if (activeScope === 'drom' && !entry.isDrom) return false;
    return true;
  };

  const getVisualStatus = (code: string): DeptVisualStatus => {
    if (wrongFlashCode === code) return 'wrongFlash';
    if (targetCode === code && mode === 'text-guess') return 'target';
    if (mode === 'explorer' && selectedExplorerCode === code) return 'target';
    return statuses[code] || 'default';
  };

  const getPathColors = (status: DeptVisualStatus, isHovered: boolean, enabled: boolean) => {
    if (!enabled) {
      return {
        fill: '#EDF2F7',
        stroke: '#CBD5E1',
        strokeWidth: 0.6,
        opacity: 0.45,
      };
    }

    switch (status) {
      case 'target':
        return {
          fill: '#2563EB',
          stroke: '#1E3A8A',
          strokeWidth: 1.8,
          opacity: 1,
        };
      case 'correct':
        return {
          fill: isHovered ? '#6EE7B7' : '#A7F3D0',
          stroke: '#059669',
          strokeWidth: 1,
          opacity: 1,
        };
      case 'hinted':
        return {
          fill: isHovered ? '#FCD34D' : '#FDE68A',
          stroke: '#D97706',
          strokeWidth: 1,
          opacity: 1,
        };
      case 'missed':
        return {
          fill: isHovered ? '#FCA5A5' : '#FECACA',
          stroke: '#DC2626',
          strokeWidth: 1.1,
          opacity: 1,
        };
      case 'wrongFlash':
        return {
          fill: '#EF4444',
          stroke: '#991B1B',
          strokeWidth: 1.5,
          opacity: 1,
        };
      default:
        return {
          fill: isHovered ? '#DBEAFE' : '#FFFFFF',
          stroke: isHovered ? '#2563EB' : '#8FA3B8',
          strokeWidth: isHovered ? 1.3 : 0.75,
          opacity: 1,
        };
    }
  };

  const canRevealLabelOnHover = (code: string): boolean => {
    if (mode === 'explorer') return true;
    const st = statuses[code];
    return st === 'correct' || st === 'hinted' || st === 'missed';
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPointerPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    if (dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragStartRef.current.moved = true;
      }
      if (zoom > 1) {
        setPan({
          x: dragStartRef.current.panX + dx,
          y: dragStartRef.current.panY + dy,
        });
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    if ((e.target as HTMLElement).closest('button')) return;
    setIsPanning(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: false,
    };
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    // Keep moved flag slightly for click suppression if dragged
    setTimeout(() => {
      dragStartRef.current = null;
    }, 0);
  };

  const handleDeptClick = (entry: DeptPathEntry) => {
    if (dragStartRef.current?.moved) return;
    if (!isCodeEnabled(entry)) return;
    if (mode === 'text-guess') return; // In text-guess mode, clicking isn't the answer mechanism
    onSelectDepartment(entry.code);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(3.5, Number((z + 0.5).toFixed(2))));
  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(1, Number((z - 0.5).toFixed(2)));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const handleFocusIDF = () => {
    const w = containerRef.current?.clientWidth || 720;
    const h = containerRef.current?.clientHeight || 600;
    setZoom(2.6);
    setPan({
      x: Math.round(-0.15 * w),
      y: Math.round(0.35 * h),
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey && zoom === 1 && e.deltaY > 0) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoom((z) => {
      const next = Math.max(1, Math.min(3.5, Number((z + delta).toFixed(2))));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const hoveredMeta: DepartmentMeta | null =
    hoveredCode && canRevealLabelOnHover(hoveredCode) ? DEPARTMENTS_META[hoveredCode] : null;

  const targetEntry = targetCode ? MAP_DATA.departments[targetCode] : null;

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        setHoveredCode(null);
        setPointerPos(null);
        handlePointerUp();
      }}
      onWheel={handleWheel}
      className={`relative w-full aspect-[1000/840] lg:aspect-auto lg:h-full lg:min-h-[640px] bg-[#E8EFF6] rounded-xl border border-slate-200/90 overflow-hidden select-none ${
        zoom > 1 ? `touch-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}` : ''
      }`}
    >
      {/* Interactive SVG Atlas */}
      <div
        className="w-full h-full transition-transform duration-150 ease-out origin-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <svg
          viewBox="0 0 1000 840"
          className="w-full h-full block"
          role="img"
          aria-label="Carte des 101 départements français, métropole et DROM"
        >
          {/* Subtle cartographic graticule lines */}
          <g stroke="#D5E1EE" strokeWidth="0.7" fill="none" pointerEvents="none">
            <line x1="184" y1="0" x2="184" y2="840" strokeDasharray="3 4" />
            <line x1="0" y1="220" x2="1000" y2="220" opacity="0.6" />
            <line x1="0" y1="450" x2="1000" y2="450" opacity="0.6" />
            <line x1="0" y1="680" x2="1000" y2="680" opacity="0.6" />
            <line x1="380" y1="0" x2="380" y2="840" opacity="0.55" />
            <line x1="590" y1="0" x2="590" y2="840" opacity="0.55" />
            <line x1="800" y1="0" x2="800" y2="840" opacity="0.55" />
          </g>

          {/* Subtle Ocean & Sea Typography */}
          <g pointerEvents="none" fill="#6F88A3" fontFamily="Fraunces, Georgia, serif" fontStyle="italic">
            <text x="230" y="475" fontSize="13" letterSpacing="0.18em" opacity="0.7">
              OCÉAN
            </text>
            <text x="215" y="493" fontSize="13" letterSpacing="0.18em" opacity="0.7">
              ATLANTIQUE
            </text>
            <text x="720" y="795" fontSize="12" letterSpacing="0.18em" opacity="0.7">
              MER MÉDITERRANÉE
            </text>
          </g>

          {/* DROM Atlantic Ocean Section Header */}
          <g pointerEvents="none">
            <text
              x="24"
              y="44"
              fill="#475569"
              fontSize="11"
              fontWeight="600"
              letterSpacing="0.06em"
            >
              DROM · ATLANTIQUE
            </text>
          </g>

          {/* DROM Inset Frames on the Left (Atlantic Ocean) */}
          {dromEntries.map((entry) => {
            const box = entry.box!;
            const enabled = isCodeEnabled(entry);
            const status = getVisualStatus(entry.code);
            const isHovered = hoveredCode === entry.code;
            const colors = getPathColors(status, isHovered, enabled);
            const showDromLabel =
              mode === 'explorer' ||
              showAllLabels ||
              status === 'correct' ||
              status === 'hinted' ||
              status === 'missed';

            const frameStroke =
              status === 'target'
                ? '#2563EB'
                : isHovered && enabled && mode !== 'text-guess'
                ? '#60A5FA'
                : '#B5C7DA';

            return (
              <g
                key={entry.code}
                className={enabled && mode !== 'text-guess' ? 'cursor-pointer' : 'cursor-default'}
                onMouseEnter={() => enabled && setHoveredCode(entry.code)}
                onMouseLeave={() => setHoveredCode(null)}
                onClick={() => handleDeptClick(entry)}
              >
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  rx="6"
                  fill={status === 'target' ? '#EFF6FF' : '#F2F6FB'}
                  stroke={frameStroke}
                  strokeWidth={status === 'target' ? 1.8 : 1}
                  strokeDasharray={status === 'target' ? undefined : '4 3'}
                  opacity={enabled ? 1 : 0.45}
                />
                <path
                  d={entry.d}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={colors.strokeWidth}
                  strokeLinejoin="round"
                  opacity={colors.opacity}
                  tabIndex={enabled && mode !== 'text-guess' ? 0 : -1}
                  role={mode !== 'text-guess' ? 'button' : undefined}
                  aria-label={
                    canRevealLabelOnHover(entry.code)
                      ? `${entry.code} ${entry.nom}`
                      : 'Département d’outre-mer à identifier'
                  }
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && enabled && mode !== 'text-guess') {
                      e.preventDefault();
                      handleDeptClick(entry);
                    }
                  }}
                  className="transition-colors duration-150 focus:outline-none focus-visible:stroke-blue-700 focus-visible:stroke-2"
                />
                {showDromLabel && (
                  <text
                    x={box.x + box.w / 2}
                    y={box.y + box.h - 9}
                    textAnchor="middle"
                    fill="#334155"
                    fontSize="10.5"
                    fontWeight="600"
                    pointerEvents="none"
                  >
                    {entry.code} · {entry.nom}
                  </text>
                )}
              </g>
            );
          })}

          {/* Metropolitan France Departments */}
          <g>
            {metroEntries.map((entry) => {
              const enabled = isCodeEnabled(entry);
              const status = getVisualStatus(entry.code);
              const isHovered = hoveredCode === entry.code;
              const colors = getPathColors(status, isHovered, enabled);

              return (
                <path
                  key={entry.code}
                  d={entry.d}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={colors.strokeWidth}
                  strokeLinejoin="round"
                  opacity={colors.opacity}
                  tabIndex={enabled && mode !== 'text-guess' ? 0 : -1}
                  role={mode !== 'text-guess' ? 'button' : undefined}
                  aria-label={
                    canRevealLabelOnHover(entry.code)
                      ? `${entry.code} ${entry.nom}`
                      : 'Département à identifier'
                  }
                  onMouseEnter={() => enabled && setHoveredCode(entry.code)}
                  onMouseLeave={() => setHoveredCode(null)}
                  onClick={() => handleDeptClick(entry)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && enabled && mode !== 'text-guess') {
                      e.preventDefault();
                      handleDeptClick(entry);
                    }
                  }}
                  className={`transition-colors duration-150 focus:outline-none focus-visible:stroke-blue-700 focus-visible:stroke-2 ${
                    enabled && mode !== 'text-guess' ? 'cursor-pointer' : 'cursor-default'
                  }`}
                />
              );
            })}
          </g>

          {/* Optional labels on Metro departments in Explorer mode when zoomed or toggled */}
          {mode === 'explorer' && showAllLabels && (
            <g pointerEvents="none">
              {metroEntries
                .filter((e) => !['75', '92', '93', '94'].includes(e.code))
                .map((entry) => (
                  <text
                    key={`lbl-${entry.code}`}
                    x={entry.cx}
                    y={entry.cy + 3}
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight="600"
                    fontFamily="JetBrains Mono, monospace"
                    fill={selectedExplorerCode === entry.code ? '#FFFFFF' : '#334155'}
                  >
                    {entry.code}
                  </text>
                ))}
            </g>
          )}

          {/* Leader line from Paris (75) to Petite Couronne Magnified Inset */}
          <line
            x1="578"
            y1="232"
            x2="836"
            y2="98"
            stroke="#94A3B8"
            strokeWidth="1"
            strokeDasharray="4 4"
            pointerEvents="none"
          />

          {/* Petite Couronne Magnified Inset Box (Top Right: 75, 92, 93, 94) */}
          <g>
            <rect
              x="836"
              y="24"
              width="146"
              height="146"
              rx="8"
              fill="#F8FAFC"
              stroke="#B5C7DA"
              strokeWidth="1"
              opacity={activeScope === 'drom' ? 0.45 : 1}
            />
            <text
              x="909"
              y="40"
              textAnchor="middle"
              fill="#475569"
              fontSize="10"
              fontWeight="600"
              letterSpacing="0.03em"
              pointerEvents="none"
            >
              Petite Couronne
            </text>
            {PETITE_COURONNE_CODES.map((code) => {
              const pcEntry = MAP_DATA.petiteCouronne[code];
              const metaEntry = MAP_DATA.departments[code];
              if (!pcEntry || !metaEntry) return null;
              const enabled = isCodeEnabled(metaEntry);
              const status = getVisualStatus(code);
              const isHovered = hoveredCode === code;
              const colors = getPathColors(status, isHovered, enabled);
              const showCodeInInset =
                mode === 'explorer' ||
                showAllLabels ||
                status === 'correct' ||
                status === 'hinted' ||
                status === 'missed';

              return (
                <g key={`pc-${code}`}>
                  <path
                    d={pcEntry.d}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth={colors.strokeWidth}
                    strokeLinejoin="round"
                    opacity={colors.opacity}
                    onMouseEnter={() => enabled && setHoveredCode(code)}
                    onMouseLeave={() => setHoveredCode(null)}
                    onClick={() => handleDeptClick(metaEntry)}
                    className={`transition-colors duration-150 ${
                      enabled && mode !== 'text-guess' ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  />
                  {showCodeInInset && (
                    <text
                      x={pcEntry.cx}
                      y={pcEntry.cy + 3}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="700"
                      fontFamily="JetBrains Mono, monospace"
                      fill={status === 'target' ? '#FFFFFF' : '#1E293B'}
                      pointerEvents="none"
                    >
                      {code}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Beacon Pulse Ring on Highlighted Target in Text-Guess Mode */}
          {mode === 'text-guess' && targetEntry && (
            <g pointerEvents="none">
              <circle
                cx={targetEntry.cx}
                cy={targetEntry.cy}
                r={targetEntry.area < 180 ? 12 : 16}
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
                className="animate-dept-beacon"
              />
              {PETITE_COURONNE_CODES.includes(targetEntry.code) && MAP_DATA.petiteCouronne[targetEntry.code] && (
                <circle
                  cx={MAP_DATA.petiteCouronne[targetEntry.code].cx}
                  cy={MAP_DATA.petiteCouronne[targetEntry.code].cy}
                  r="14"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="animate-dept-beacon"
                />
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Wrong-click immediate learning banner inside map */}
      {wrongFlashLabel && (
        <div
          role="status"
          className="absolute top-4 left-1/2 -translate-x-1/2 px-3.5 py-2 rounded-lg bg-slate-900/95 text-white text-xs font-medium shadow-md pointer-events-none flex items-center gap-2 whitespace-nowrap"
        >
          <span className="text-rose-400 font-semibold">Incorrect</span>
          <span aria-hidden="true" className="text-slate-400">·</span>
          <span>Vous avez cliqué sur {wrongFlashLabel}</span>
        </div>
      )}

      {/* Hover Info Tooltip (only shown in Explorer mode or for already-revealed departments) */}
      {hoveredMeta && pointerPos && (
        <div
          className="absolute z-20 pointer-events-none bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 shadow-sm text-xs max-w-[240px]"
          style={{
            left: Math.min(Math.max(12, pointerPos.x + 14), (containerRef.current?.clientWidth || 600) - 245),
            top: Math.max(12, pointerPos.y - 54),
          }}
        >
          <div className="flex items-baseline gap-2 font-semibold text-slate-900">
            <span className="font-mono-tabular text-blue-700">{hoveredMeta.code}</span>
            <span>{hoveredMeta.nom}</span>
          </div>
          <div className="text-slate-500 mt-0.5 truncate">
            {hoveredMeta.prefecture} · {hoveredMeta.region}
          </div>
        </div>
      )}

      {/* Map Zoom & Navigation Controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-1 shadow-sm">
        <button
          type="button"
          onClick={handleFocusIDF}
          title="Zoomer sur l'Île-de-France"
          className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
        >
          <Search className="w-3.5 h-3.5" />
          <span>IDF</span>
        </button>
        <div className="w-px h-4 bg-slate-200" aria-hidden="true" />
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoom <= 1}
          title="Dézoomer"
          aria-label="Dézoomer"
          className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none rounded-md transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="font-mono-tabular text-[11px] font-medium text-slate-600 px-1 min-w-[36px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoom >= 3.5}
          title="Zoomer"
          aria-label="Zoomer"
          className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        {zoom > 1 && (
          <>
            <div className="w-px h-4 bg-slate-200" aria-hidden="true" />
            <button
              type="button"
              onClick={handleResetView}
              title="Recentrer la carte"
              aria-label="Recentrer la carte"
              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            >
              <LocateFixed className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Discrete Legend in Bottom-Left (Only when in quiz mode) */}
      {mode !== 'explorer' && (
        <div className="hidden sm:flex absolute bottom-3 left-3 items-center gap-3 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] text-slate-600 pointer-events-none">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#A7F3D0] border border-[#059669]" />
            Trouvé
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#FDE68A] border border-[#D97706]" />
            Avec aide
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#FECACA] border border-[#DC2626]" />
            Manqué
          </span>
          {mode === 'text-guess' && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB] border border-[#1E3A8A]" />
              À nommer
            </span>
          )}
        </div>
      )}
    </div>
  );
};
