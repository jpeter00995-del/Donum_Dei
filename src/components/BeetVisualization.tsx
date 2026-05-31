// === BeetVisualization — visueller Beet-Planer (Welle J, Pointer-Events-Refactor 2026-05-18) ===
// Haupt-Renderer für den Beet-Plan-Tab. Kombiniert:
//   - BeetTypeRenderer (Garten-Typ-spezifischer Hintergrund)
//   - BeetCell-Komponenten (Pflanzen-Icons mit Quantity)
//   - Pointer-Events Drag&Drop für User-Positionierung (Maus + Touch + Stift)
//   - Warnungs-Anzeige (Companion / Schatten / Overflow)
// (Visualisiert ein Beet mit Smart-Layout + manueller Drag&Drop-Override.)
//
// WICHTIG: Pointer Events statt HTML5 native DnD, damit es auf iPad funktioniert.
// Capture-Owner ist die Cell selbst → setPointerCapture(pointerId) hält die Events
// dort, auch wenn der Finger die Cell verlässt. Position wird LIVE aktualisiert
// (Icon folgt dem Finger). Parent debounced den localStorage-Write.

import { useMemo, useRef, useState } from 'react';
import type { Plant, Locale, GardenType } from '@/lib/types';
import type { PlanPlant } from '@/lib/planPlant';
import {
  computeBeetLayout,
  type CartEntry,
  type UserPosition,
  type BeetWarning,
} from '@/lib/beetLayout';
import BeetCell from './BeetCell';
import BeetTypeRenderer from './BeetTypeRenderer';
import { t as t_i18n } from '@/lib/i18n';

// === 1. PROPS ===

export interface BeetVisualizationProps {
  cart: readonly CartEntry[];
  // Schlankes Plan-DTO statt voller Plant-Objekte. computeBeetLayout + BeetCell
  // lesen nur companion_planting/permaculture_functions/garden_meta.spacing_cm/
  // names/image — alle im PlanPlant-DTO vorhanden.
  plants: readonly PlanPlant[];
  gardenType: GardenType;
  areaSqm: number;
  locale: Locale;
  /** Persistente User-Positionen (custom_plan.beet_positions). */
  userPositions?: readonly UserPosition[];
  /** Callback bei Position-Änderung — Parent persistiert in localStorage. */
  onPositionsChange?: (positions: UserPosition[]) => void;
}

// === 2. KONSTANTEN ===

/** Default Pixel/Meter — wird responsiv überschrieben. */
const DEFAULT_PX_PER_M = 100;
/** Maximale SVG-Bühnen-Breite in px. */
const MAX_STAGE_WIDTH = 720;

// === 3. COMPONENT ===

export default function BeetVisualization(props: BeetVisualizationProps) {
  const {
    cart, plants, gardenType, areaSqm, locale,
    userPositions = [],
    onPositionsChange,
  } = props;

  // === 3.1 Layout berechnen ===
  const layout = useMemo(
    // Cast: computeBeetLayout liest nur DTO-vorhandene Garten-Felder.
    () => computeBeetLayout(cart, gardenType, areaSqm, plants as unknown as Plant[], { user_positions: [...userPositions] }),
    [cart, gardenType, areaSqm, plants, userPositions],
  );

  // === 3.2 Plant-Lookup ===
  const plantBySlug = useMemo(() => {
    const m = new Map<string, PlanPlant>();
    for (const p of plants) m.set(p.slug, p);
    return m;
  }, [plants]);

  // === 3.3 Responsive Stage-Größe ===
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Pixel/Meter — abhängig von verfügbarer Breite.
  const stageWidthPx = Math.min(MAX_STAGE_WIDTH, layout.total_size.width * DEFAULT_PX_PER_M);
  const pxPerM = stageWidthPx / layout.total_size.width;
  const stageHeightPx = layout.total_size.height * pxPerM;

  // === 3.4 Drag-State ===
  // draggedSlug = aktiv gezogene Cell (oder null). dragOffset = Pixel-Offset
  // innerhalb der Cell wo der Pointer ursprünglich angesetzt hat — damit die
  // Cell beim Bewegen nicht zur Pointer-Position springt sondern an dem Punkt
  // bleibt wo man sie gegriffen hat.
  const [draggedSlug, setDraggedSlug] = useState<string | null>(null);
  const dragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // === 3.5 Pointer-Handler ===
  function handlePointerDown(slug: string, e: React.PointerEvent<HTMLDivElement>) {
    // Nur primärer Pointer — Multi-Touch ignorieren (kein Pinch/Zoom-Konflikt).
    if (!e.isPrimary) return;
    // Capture: alle weiteren Pointer-Events gehen an die Cell, auch wenn der
    // Finger sie verlässt. Ohne Capture würde der Drag stoppen sobald der
    // Pointer aus der Cell-Bbox raus ist.
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = {
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
    };
    setDraggedSlug(slug);
  }

  function handlePointerMove(slug: string, e: React.PointerEvent<HTMLDivElement>) {
    if (draggedSlug !== slug || !containerRef.current) return;
    const stageRect = containerRef.current.getBoundingClientRect();
    // Neue Cell-Position (Top-Left) in Pixel relativ zur Bühne.
    const newPxX = e.clientX - stageRect.left - dragOffset.current.dx;
    const newPxY = e.clientY - stageRect.top - dragOffset.current.dy;
    // Pixel → Meter, gegen Bühnenränder geclampt.
    const newX = Math.max(0, Math.min(layout.total_size.width, newPxX / pxPerM));
    const newY = Math.max(0, Math.min(layout.total_size.height, newPxY / pxPerM));
    updatePosition(slug, newX, newY);
  }

  function handlePointerUp(slug: string, e: React.PointerEvent<HTMLDivElement>) {
    if (draggedSlug !== slug) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDraggedSlug(null);
  }

  function handlePointerCancel(slug: string, e: React.PointerEvent<HTMLDivElement>) {
    // iOS kann Touch abbrechen (System-Geste, Notification etc.) — sauber aufräumen.
    if (draggedSlug !== slug) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDraggedSlug(null);
  }

  function updatePosition(slug: string, x: number, y: number) {
    const next: UserPosition[] = [...userPositions.filter(p => p.slug !== slug)];
    next.push({ slug, x, y });
    onPositionsChange?.(next);
  }

  // === 3.6 Keyboard-Drag ===
  function handleKeyMove(slug: string, dx: number, dy: number) {
    const cell = layout.cells.find(c => c.slug === slug);
    if (!cell) return;
    const newX = Math.max(0, Math.min(layout.total_size.width - cell.w, cell.x + dx));
    const newY = Math.max(0, Math.min(layout.total_size.height - cell.h, cell.y + dy));
    updatePosition(slug, newX, newY);
  }

  // === 3.7 Reset to Auto-Layout ===
  function resetLayout() {
    onPositionsChange?.([]);
  }

  // === 3.8 Render ===
  if (cart.length === 0) {
    return (
      <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
        {t_i18n(locale, 'plan.beet.empty')}
      </div>
    );
  }

  return (
    <div data-testid="beet-visualization">
      {/* === 4.1 Header mit Garten-Typ + Maße === */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <p className="text-xs text-slate-600">
          <span className="font-medium">{t_i18n(locale, `plan.gardentype.${gardenType}`)}</span>
          {' · '}
          {layout.total_size.width.toLocaleString(locale === 'de' ? 'de-DE' : 'en-US')} m ×{' '}
          {layout.total_size.height.toLocaleString(locale === 'de' ? 'de-DE' : 'en-US')} m
        </p>
        {userPositions.length > 0 && (
          <button
            type="button"
            onClick={resetLayout}
            className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            {t_i18n(locale, 'plan.beet.reset_layout')}
          </button>
        )}
      </div>

      {/* === 4.2 Beet-Stage (SVG + Cells) ===
          Kein onDragOver/onDrop mehr nötig — Pointer-Capture an der Cell selbst
          hält die Events dort, unabhängig von Stage-Boundaries. */}
      <div
        ref={containerRef}
        className="relative mx-auto overflow-hidden rounded-lg shadow-sm border border-slate-300 bg-slate-100"
        style={{
          width: `${stageWidthPx}px`,
          maxWidth: '100%',
          height: `${stageHeightPx}px`,
          aspectRatio: `${layout.total_size.width} / ${layout.total_size.height}`,
          // touchAction:none auch auf der Stage — verhindert Pan/Pinch während
          // ein Cell-Drag läuft. Pointer-Capture allein reicht auf iOS nicht
          // wenn die Stage selbst scrollbar wäre.
          touchAction: 'none',
        }}
        role="application"
        aria-label={t_i18n(locale, 'plan.beet.aria_stage')}
      >
        <BeetTypeRenderer
          gardenType={gardenType}
          widthPx={stageWidthPx}
          heightPx={stageHeightPx}
          locale={locale}
        />
        {layout.cells.map(cell => {
          const plant = plantBySlug.get(cell.slug);
          if (!plant) return null;
          return (
            <BeetCell
              key={cell.slug}
              cell={cell}
              plant={plant}
              locale={locale}
              pxPerM={pxPerM}
              selected={draggedSlug === cell.slug}
              onPointerDown={(e) => handlePointerDown(cell.slug, e)}
              onPointerMove={(e) => handlePointerMove(cell.slug, e)}
              onPointerUp={(e) => handlePointerUp(cell.slug, e)}
              onPointerCancel={(e) => handlePointerCancel(cell.slug, e)}
              onKeyMove={(dx, dy) => handleKeyMove(cell.slug, dx, dy)}
            />
          );
        })}
      </div>

      {/* === 4.3 Zonen-Legende === */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full ring-2 ring-amber-500/60 bg-white" />
          {t_i18n(locale, 'plan.beet.zone_north')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full ring-2 ring-emerald-500/50 bg-white" />
          {t_i18n(locale, 'plan.beet.zone_middle')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full ring-2 ring-sky-500/50 bg-white" />
          {t_i18n(locale, 'plan.beet.zone_south')}
        </span>
        <span className="ml-auto italic">
          {t_i18n(locale, 'plan.beet.dragdrop_hint')}
        </span>
      </div>

      {/* === 4.4 Warnungen === */}
      {layout.warnings.length > 0 && (
        <WarningsList warnings={layout.warnings} locale={locale} />
      )}
    </div>
  );
}

// === 5. WARN-LISTE ===

function WarningsList({ warnings, locale }: { warnings: BeetWarning[]; locale: Locale }) {
  // Gruppiere Warnungen nach Typ
  const bad = warnings.filter(w => w.type === 'bad_neighbor');
  const sun = warnings.filter(w => w.type === 'sun_mismatch');
  const crowded = warnings.filter(w => w.type === 'too_crowded');

  const intro = t_i18n(locale, 'plan.beet.warnings_heading');

  return (
    <aside
      className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
      role="status"
      data-testid="beet-warnings"
    >
      <h3 className="font-semibold mb-2">
        <span aria-hidden="true">💡 </span>{intro}
      </h3>
      <ul className="list-disc list-inside space-y-1.5">
        {bad.map((w, i) => (
          <li key={`bad-${i}`}>
            <span className="font-medium">
              {locale === 'de' ? 'Nachbarschaft: ' : 'Neighbours: '}
            </span>
            {locale === 'de' ? w.message_de : w.message_en}
          </li>
        ))}
        {sun.map((w, i) => (
          <li key={`sun-${i}`}>
            <span className="font-medium">
              {locale === 'de' ? 'Sonne: ' : 'Sun: '}
            </span>
            {locale === 'de' ? w.message_de : w.message_en}
          </li>
        ))}
        {crowded.map((w, i) => (
          <li key={`cr-${i}`}>
            <span className="font-medium">
              {locale === 'de' ? 'Platz: ' : 'Space: '}
            </span>
            {locale === 'de' ? w.message_de : w.message_en}
          </li>
        ))}
      </ul>
    </aside>
  );
}
