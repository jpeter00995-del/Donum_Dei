// === BeetCell — einzelne Pflanzen-Zelle im Beet (Welle J, Pointer-Events-Refactor 2026-05-18) ===
// Rendert eine einzelne Cell (Cluster aus mehreren Pflanzen einer Sorte)
// als rundes Plant-Image mit Quantity-Badge.
// (Eine Pflanzen-Zelle als rundes Icon mit Badge und Drag-Handle.)
//
// WICHTIG: Drag&Drop verwendet Pointer Events (nicht HTML5 native DnD),
// damit es auf iPad/iOS Safari funktioniert. HTML5 DnD ist auf iOS broken.
// `touch-action: none` ist Pflicht — sonst stiehlt iOS den Touch fürs Scrollen.

import type { Locale } from '@/lib/types';
import type { PlanPlant } from '@/lib/planPlant';
import type { BeetCell as BeetCellData } from '@/lib/beetLayout';

// === 1. PROPS ===

export interface BeetCellProps {
  cell: BeetCellData;
  // Schlankes Plan-DTO — BeetCell liest nur names/image/companion_planting/
  // permaculture_functions, alle im DTO vorhanden.
  plant: PlanPlant;
  locale: Locale;
  /** Pixel pro Meter — vom Container festgelegt. */
  pxPerM: number;
  /** Selected = hervorgehoben (Hover/Klick/aktiv im Drag). */
  selected?: boolean;
  /** Klick-Handler (öffnet Tooltip oder Detail). */
  onClick?: () => void;
  /** Pointer-Down — startet Drag (Mouse/Touch/Pen, ein Event-System). */
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  /** Pointer-Move — wird vom Capture-Owner empfangen, auch ausserhalb der Cell. */
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  /** Pointer-Up — beendet Drag. */
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  /** Pointer-Cancel — iOS kann Touch abbrechen (System-Geste etc.). */
  onPointerCancel?: (e: React.PointerEvent<HTMLDivElement>) => void;
  /** Tastatur-Drag: Pfeiltasten verschieben Cell. */
  onKeyMove?: (dx: number, dy: number) => void;
}

// === 2. COMPONENT ===

export default function BeetCell(props: BeetCellProps) {
  const {
    cell, plant, locale, pxPerM, selected, onClick,
    onPointerDown, onPointerMove, onPointerUp, onPointerCancel,
    onKeyMove,
  } = props;

  // === 2.1 Pixel-Maße aus Meter berechnen ===
  const leftPx = cell.x * pxPerM;
  const topPx = cell.y * pxPerM;
  const widthPx = Math.max(40, cell.w * pxPerM);
  const heightPx = Math.max(40, cell.h * pxPerM);
  // Icon-Größe: kleiner der beiden, aber min 32 / max 96 px
  const iconSize = Math.min(96, Math.max(32, Math.min(widthPx, heightPx) * 0.8));

  // === 2.2 Tooltip-Daten ===
  const goodPartners = plant.companion_planting?.good_partners ?? [];
  const badPartners = plant.companion_planting?.bad_partners ?? [];
  const fns = plant.permaculture_functions ?? [];

  const tooltipLines: string[] = [];
  if (fns.length > 0) {
    const label = locale === 'de' ? 'Funktionen' : 'Functions';
    tooltipLines.push(`${label}: ${fns.slice(0, 3).join(', ')}`);
  }
  if (goodPartners.length > 0) {
    const label = locale === 'de' ? 'Gut mit' : 'Pairs with';
    tooltipLines.push(`${label}: ${goodPartners.slice(0, 3).join(', ')}`);
  }
  if (badPartners.length > 0) {
    const label = locale === 'de' ? 'Nicht mit' : 'Avoid';
    tooltipLines.push(`${label}: ${badPartners.slice(0, 3).join(', ')}`);
  }
  const title = `${plant.names[locale]} (${plant.names.latin})\n${tooltipLines.join('\n')}`;

  // === 2.3 Zone-Farbring (visueller Höhen-Hinweis) ===
  const ringColor =
    cell.zone === 'north' ? 'ring-amber-500/60'
      : cell.zone === 'south' ? 'ring-sky-500/50'
        : 'ring-emerald-500/50';

  // === 2.4 Keyboard-Handler ===
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!onKeyMove) return;
    const step = 0.25; // 25cm pro Tasten-Schritt
    if (e.key === 'ArrowUp') { e.preventDefault(); onKeyMove(0, -step); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); onKeyMove(0, step); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); onKeyMove(-step, 0); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); onKeyMove(step, 0); }
  }

  return (
    <div
      className={[
        'beet-cell absolute flex items-center justify-center select-none cursor-move',
        'transition-shadow duration-150',
        selected ? 'z-30 drop-shadow-lg' : 'z-10',
      ].join(' ')}
      style={{
        left: `${leftPx}px`,
        top: `${topPx}px`,
        width: `${widthPx}px`,
        height: `${heightPx}px`,
        // touchAction:none verhindert dass iOS den Touch fürs Scrollen abfängt.
        touchAction: 'none',
      }}
      tabIndex={0}
      role="button"
      aria-label={`${plant.names[locale]} (${cell.quantity})`}
      title={title}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={handleKeyDown}
      data-testid="beet-cell"
      data-slug={plant.slug}
      data-zone={cell.zone}
    >
      {/* === 2.5 Plant-Image rund cropped === */}
      <div
        className={[
          'relative rounded-full overflow-hidden bg-white shadow-md',
          'ring-2 ring-offset-1 ring-offset-transparent',
          ringColor,
        ].join(' ')}
        style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
      >
        <img
          src={`/images/plants/${plant.image.filename}`}
          alt={plant.image.alt[locale]}
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
          draggable={false}
        />

        {/* === 2.6 Quantity-Badge oben-rechts === */}
        {cell.quantity > 1 && (
          <div
            className={[
              'absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full',
              'bg-emerald-600 text-white text-xs font-bold',
              'flex items-center justify-center shadow ring-2 ring-white',
              'pointer-events-none',
            ].join(' ')}
            aria-label={locale === 'de' ? `${cell.quantity} Pflanzen` : `${cell.quantity} plants`}
          >
            ×{cell.quantity}
          </div>
        )}
      </div>

      {/* === 2.7 Name unter dem Icon === */}
      {iconSize >= 48 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 px-1 py-0.5 rounded bg-white/85 text-[10px] font-medium text-slate-800 whitespace-nowrap pointer-events-none"
          style={{ top: `calc(50% + ${iconSize / 2}px + 2px)` }}
        >
          {plant.names[locale]}
        </div>
      )}
    </div>
  );
}
