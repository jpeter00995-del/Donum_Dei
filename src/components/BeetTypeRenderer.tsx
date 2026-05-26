// === BeetTypeRenderer — garten-typ-spezifisches SVG-Rahmen-Rendering (Welle J) ===
// Rendert den Hintergrund + Rahmen für 4 Garten-Typen:
//   - raised_bed:  Holzrahmen + Erde-Hintergrund
//   - balcony:     Reihe Terrakotta-Töpfe + Brüstungs-Andeutung
//   - field:       offenes Beet mit gestrichelten Reihen
//   - greenhouse:  Glas-Frame + zwei Beete + Mittelgang
// (Visualisierungs-Layer; alles per SVG, keine externen Image-Assets.)

import type { GardenType, Locale } from '@/lib/types';

// === 1. PROPS ===

export interface BeetTypeRendererProps {
  gardenType: GardenType;
  /** Gesamt-Pixel-Breite der SVG-Bühne. */
  widthPx: number;
  /** Gesamt-Pixel-Höhe der SVG-Bühne. */
  heightPx: number;
  locale: Locale;
}

// === 2. SVG-DEFS (Patterns + Filter) ===

function CommonDefs() {
  return (
    <defs>
      {/* === 2.1 Wood-Grain Pattern für Hochbeet === */}
      <pattern id="wood-grain" patternUnits="userSpaceOnUse" width="40" height="20">
        <rect width="40" height="20" fill="#8b5a2b" />
        <path d="M0,5 Q10,3 20,5 T40,5" stroke="#6b4220" strokeWidth="0.7" fill="none" opacity="0.7" />
        <path d="M0,12 Q15,10 25,13 T40,11" stroke="#6b4220" strokeWidth="0.6" fill="none" opacity="0.55" />
        <path d="M0,17 Q12,16 22,18 T40,17" stroke="#5a3818" strokeWidth="0.5" fill="none" opacity="0.45" />
      </pattern>

      {/* === 2.2 Erde-Textur (dunkles Braun + Sprenkel) === */}
      <pattern id="soil" patternUnits="userSpaceOnUse" width="20" height="20">
        <rect width="20" height="20" fill="#5a3e1b" />
        <circle cx="3" cy="5" r="0.8" fill="#3d2810" opacity="0.6" />
        <circle cx="12" cy="9" r="0.6" fill="#7a5a2f" opacity="0.5" />
        <circle cx="17" cy="3" r="0.5" fill="#3d2810" opacity="0.7" />
        <circle cx="8" cy="16" r="0.7" fill="#3d2810" opacity="0.55" />
        <circle cx="15" cy="14" r="0.4" fill="#7a5a2f" opacity="0.5" />
      </pattern>

      {/* === 2.3 Terrakotta-Gradient für Balkon-Töpfe === */}
      <linearGradient id="terracotta" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#c97a4a" />
        <stop offset="60%" stopColor="#a85a30" />
        <stop offset="100%" stopColor="#7a3e1c" />
      </linearGradient>

      {/* === 2.4 Glas-Gradient für Gewächshaus === */}
      <linearGradient id="glass" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#dcefff" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#a8d0f0" stopOpacity="0.35" />
      </linearGradient>
    </defs>
  );
}

// === 3. HAUPT-COMPONENT ===

export default function BeetTypeRenderer(props: BeetTypeRendererProps) {
  const { gardenType, widthPx, heightPx, locale } = props;

  return (
    <svg
      width={widthPx}
      height={heightPx}
      viewBox={`0 0 ${widthPx} ${heightPx}`}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    >
      <CommonDefs />
      {gardenType === 'raised_bed' && <RaisedBed w={widthPx} h={heightPx} />}
      {gardenType === 'balcony' && <Balcony w={widthPx} h={heightPx} />}
      {gardenType === 'field' && <Field w={widthPx} h={heightPx} />}
      {gardenType === 'greenhouse' && <Greenhouse w={widthPx} h={heightPx} />}
      <CompassIndicator w={widthPx} h={heightPx} locale={locale} />
    </svg>
  );
}

// === 4. GARTEN-TYP-VARIANTEN ===

// === 4.1 Hochbeet — Holzrahmen + Erde ===

function RaisedBed({ w, h }: { w: number; h: number }) {
  const FRAME = 14; // Frame-Stärke in px
  return (
    <g>
      {/* Erde */}
      <rect x={FRAME} y={FRAME} width={w - 2 * FRAME} height={h - 2 * FRAME} fill="url(#soil)" />
      {/* Holzrahmen — oben/unten/links/rechts */}
      <rect x={0} y={0} width={w} height={FRAME} fill="url(#wood-grain)" />
      <rect x={0} y={h - FRAME} width={w} height={FRAME} fill="url(#wood-grain)" />
      <rect x={0} y={0} width={FRAME} height={h} fill="url(#wood-grain)" />
      <rect x={w - FRAME} y={0} width={FRAME} height={h} fill="url(#wood-grain)" />
      {/* Frame-Schatten innen */}
      <rect
        x={FRAME} y={FRAME}
        width={w - 2 * FRAME} height={h - 2 * FRAME}
        fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="2"
      />
    </g>
  );
}

// === 4.2 Balkon — Terrakotta-Töpfe Reihe + Brüstung ===

function Balcony({ w, h }: { w: number; h: number }) {
  const potCount = Math.max(3, Math.round(w / 90));
  const potW = w / potCount;
  const potH = h * 0.7;
  const potTopY = h - potH;
  return (
    <g>
      {/* Brüstung oben — graue Linie */}
      <line x1={0} y1={6} x2={w} y2={6} stroke="#9ca3af" strokeWidth="3" />
      <line x1={0} y1={11} x2={w} y2={11} stroke="#9ca3af" strokeWidth="1.5" opacity="0.7" />
      {/* Töpfe */}
      {Array.from({ length: potCount }).map((_, i) => {
        const x = i * potW;
        const cx = x + potW / 2;
        return (
          <g key={i}>
            {/* Topf (trapezförmig, verjüngend nach unten) */}
            <polygon
              points={`${x + potW * 0.08},${potTopY} ${x + potW * 0.92},${potTopY} ${x + potW * 0.82},${h - 6} ${x + potW * 0.18},${h - 6}`}
              fill="url(#terracotta)"
              stroke="#5a2a10"
              strokeWidth="1"
            />
            {/* Topf-Rand oben (dicker Lippen) */}
            <rect
              x={x + potW * 0.05}
              y={potTopY - 4}
              width={potW * 0.9}
              height={6}
              fill="url(#terracotta)"
              stroke="#5a2a10"
              strokeWidth="0.8"
            />
            {/* Erde im Topf */}
            <ellipse cx={cx} cy={potTopY} rx={potW * 0.42} ry={3} fill="#3d2810" />
          </g>
        );
      })}
    </g>
  );
}

// === 4.3 Feld — offen mit Reihen-Andeutung ===

function Field({ w, h }: { w: number; h: number }) {
  const rowCount = Math.max(3, Math.round(h / 50));
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} fill="url(#soil)" />
      {/* Gestrichelte Reihen-Linien */}
      {Array.from({ length: rowCount }).map((_, i) => {
        const y = (h / rowCount) * (i + 0.5);
        return (
          <line
            key={i}
            x1={10} y1={y} x2={w - 10} y2={y}
            stroke="#3d2810" strokeWidth="1" strokeDasharray="6,8" opacity="0.4"
          />
        );
      })}
      {/* Eckpfosten als Andeutung */}
      {[[6, 6], [w - 6, 6], [6, h - 6], [w - 6, h - 6]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4} fill="#6b4220" stroke="#3d2810" strokeWidth="1" />
      ))}
    </g>
  );
}

// === 4.4 Gewächshaus — Glas-Frame + 2 Beete + Mittelgang ===

function Greenhouse({ w, h }: { w: number; h: number }) {
  const FRAME = 8;
  const PATH = Math.max(28, h * 0.18); // Mittelgang
  const bedH = (h - 2 * FRAME - PATH) / 2;
  const bed1Y = FRAME;
  const bed2Y = FRAME + bedH + PATH;
  return (
    <g>
      {/* Glas-Hintergrund */}
      <rect x={0} y={0} width={w} height={h} fill="url(#glass)" />
      {/* Glas-Streben (vertikal) */}
      {[0.25, 0.5, 0.75].map(frac => (
        <line
          key={frac}
          x1={w * frac} y1={FRAME} x2={w * frac} y2={h - FRAME}
          stroke="#7a9fc0" strokeWidth="1" opacity="0.4"
        />
      ))}
      {/* Glas-Frame (außen) */}
      <rect
        x={0} y={0} width={w} height={h}
        fill="none" stroke="#5a7a99" strokeWidth={FRAME}
      />
      {/* Zwei Erdbeete */}
      <rect x={FRAME} y={bed1Y} width={w - 2 * FRAME} height={bedH} fill="url(#soil)" />
      <rect x={FRAME} y={bed2Y} width={w - 2 * FRAME} height={bedH} fill="url(#soil)" />
      {/* Mittelgang als heller Streifen */}
      <rect
        x={FRAME} y={FRAME + bedH}
        width={w - 2 * FRAME} height={PATH}
        fill="#d6c9a8" opacity="0.85"
      />
    </g>
  );
}

// === 5. KOMPASS / SONNEN-INDIKATOR ===

function CompassIndicator({ w, h, locale }: { w: number; h: number; locale: Locale }) {
  const labelN = locale === 'de' ? 'N' : 'N';
  const labelS = locale === 'de' ? 'Süden ☀' : 'South ☀';
  return (
    <g pointerEvents="none">
      {/* Nord-Pfeil oben-links */}
      <g transform={`translate(${18}, ${18})`}>
        <circle r="14" fill="white" opacity="0.92" stroke="#475569" strokeWidth="1" />
        <path d="M0,-9 L4,5 L0,2 L-4,5 Z" fill="#dc2626" />
        <text y={-3.5} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#475569">
          {labelN}
        </text>
      </g>
      {/* Süden-Sonne unten-rechts */}
      <text
        x={w - 8} y={h - 6}
        textAnchor="end" fontSize="10" fontWeight="600" fill="#92400e"
        style={{ paintOrder: 'stroke', stroke: 'white', strokeWidth: 3, strokeLinejoin: 'round' }}
      >
        {labelS}
      </text>
    </g>
  );
}
