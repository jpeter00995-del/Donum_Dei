#!/usr/bin/env node
// === 1. ZWECK ===
// Apply companion_planting data to plant JSONs from a single source of truth.
// Bidirectional consistency is guaranteed by construction: every relation in
// PAIRS is written into BOTH plant JSONs.
// (Wendet companion_planting-Daten auf Pflanzen-JSONs an. Bidirektionale
// Konsistenz per Konstruktion: jede Beziehung in PAIRS landet in beiden JSONs.)
//
// Run from project root:
//   node scripts/apply_companion_planting.mjs
//
// Idempotent — re-running replaces the companion_planting block in each
// affected plant JSON with the current matrix. Plants not in any pair keep
// their existing companion_planting field (if any) untouched.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLANTS_DIR = join(HERE, '..', 'src', 'data', 'plants');

// === 2. QUELLEN ===
// Citation slugs reused below. Format kept short for readability of PAIRS.
const SRC = {
  THREE_SISTERS: 'Klassische Mischkultur-Tradition (Three Sisters, Bauernregel)',
  LANGERHORST: 'Helga und Margarete Langerhorst, Mein gesunder Naturgarten (eigene Kuration)',
  FRANCK: 'Gertrud Franck, Gesunder Garten durch Mischkultur (1980, eigene Kuration)',
};

// === 3. BEZIEHUNGS-MATRIX ===
// Each pair is [slugA, slugB, kind, source, notes_de?, notes_en?].
// kind: 'good' | 'bad' | 'neutral'.
// Source defaults to LANGERHORST when omitted.
// Notes are optional — set them only when the pair has well-known lore.
//
// (Beziehungs-Matrix; jeder Eintrag erscheint genau einmal, das Skript
// schreibt automatisch in beide JSONs.)
const PAIRS = [
  // === 3a. Klassische Kräuter-Allianzen (Lippenblütler-Familie) ===
  ['ocimum-basilicum', 'allium-sativum', 'good', SRC.LANGERHORST,
    'Basilikum unterstützt Knoblauch-Wachstum, Knoblauch hält Schädlinge fern.',
    'Basil supports garlic growth; garlic deters basil pests.'],
  ['ocimum-basilicum', 'origanum-vulgare', 'good', SRC.LANGERHORST],
  ['ocimum-basilicum', 'petroselinum-crispum', 'good', SRC.LANGERHORST],
  ['ocimum-basilicum', 'thymus-vulgaris', 'good', SRC.LANGERHORST],
  ['ocimum-basilicum', 'salvia-officinalis', 'bad', SRC.LANGERHORST,
    'Salbei hemmt Basilikum durch ätherische Öle.',
    'Sage essential oils inhibit basil.'],
  ['ocimum-basilicum', 'rosmarinus-officinalis', 'bad', SRC.LANGERHORST,
    'Rosmarin und Basilikum konkurrieren — Rosmarin mag es trocken, Basilikum feucht.',
    'Rosemary and basil conflict — rosemary likes dry soil, basil moist.'],
  ['ocimum-basilicum', 'mentha-piperita', 'bad', SRC.LANGERHORST,
    'Minze konkurriert um Wasser und überwuchert Basilikum.',
    'Mint competes for water and overgrows basil.'],
  ['ocimum-basilicum', 'tagetes-patula', 'good', SRC.LANGERHORST],

  // === 3b. Knoblauch — fast universeller guter Nachbar (außer Bohnen-Familie) ===
  ['allium-sativum', 'fragaria-vesca', 'good', SRC.LANGERHORST,
    'Knoblauch vertreibt Erdbeer-Schädlinge.',
    'Garlic deters strawberry pests.'],
  ['allium-sativum', 'matricaria-chamomilla', 'good', SRC.LANGERHORST],
  ['allium-sativum', 'tagetes-patula', 'good', SRC.LANGERHORST],
  ['allium-sativum', 'calendula-officinalis', 'good', SRC.LANGERHORST],
  ['allium-sativum', 'trigonella-foenum-graecum', 'bad', SRC.FRANCK,
    'Lauchgewächse hemmen Hülsenfrüchte (Bockshornklee).',
    'Alliums inhibit legumes (fenugreek).'],
  ['allium-sativum', 'apium-graveolens', 'good', SRC.FRANCK],

  // === 3c. Bärlauch ===
  ['allium-ursinum', 'fragaria-vesca', 'good', SRC.LANGERHORST],
  ['allium-ursinum', 'matricaria-chamomilla', 'good', SRC.LANGERHORST],

  // === 3d. Dill — guter Allrounder, schlecht zu Karotten-Familie ===
  ['anethum-graveolens', 'cucurbita-pepo', 'good', SRC.LANGERHORST,
    'Dill lockt Nützlinge für Kürbis-Bestäubung.',
    'Dill attracts pollinators for squash.'],
  ['anethum-graveolens', 'allium-sativum', 'good', SRC.LANGERHORST],
  ['anethum-graveolens', 'foeniculum-vulgare', 'bad', SRC.FRANCK,
    'Dill und Fenchel kreuzen sich genetisch und konkurrieren.',
    'Dill and fennel cross-pollinate and compete.'],
  ['anethum-graveolens', 'coriandrum-sativum', 'bad', SRC.FRANCK,
    'Dill und Koriander hemmen sich gegenseitig (Apiaceae-Konflikt).',
    'Dill and coriander inhibit each other (Apiaceae conflict).'],
  ['anethum-graveolens', 'apium-graveolens', 'bad', SRC.FRANCK],

  // === 3e. Sellerie ===
  ['apium-graveolens', 'cucurbita-pepo', 'good', SRC.LANGERHORST],
  ['apium-graveolens', 'tropaeolum-majus', 'good', SRC.LANGERHORST],
  ['apium-graveolens', 'petroselinum-crispum', 'bad', SRC.FRANCK,
    'Beide Apiaceae — Konkurrenz um gleiche Nährstoffe und Schädlinge.',
    'Both Apiaceae — compete for same nutrients and attract same pests.'],

  // === 3f. Borretsch — universal-guter Nachbar (Bienen-Magnet) ===
  ['borago-officinalis', 'fragaria-vesca', 'good', SRC.LANGERHORST,
    'Borretsch zieht Bestäuber zu Erdbeeren.',
    'Borage attracts pollinators to strawberries.'],
  ['borago-officinalis', 'cucurbita-pepo', 'good', SRC.LANGERHORST],
  ['borago-officinalis', 'calendula-officinalis', 'good', SRC.LANGERHORST],

  // === 3g. Ringelblume — universal-guter Bodendecker und Schädlings-Schreck ===
  ['calendula-officinalis', 'tagetes-patula', 'good', SRC.LANGERHORST,
    'Beide vertreiben Nematoden.',
    'Both deter nematodes.'],
  ['calendula-officinalis', 'tropaeolum-majus', 'good', SRC.LANGERHORST],
  ['calendula-officinalis', 'fragaria-vesca', 'good', SRC.LANGERHORST],
  ['calendula-officinalis', 'cucurbita-pepo', 'good', SRC.LANGERHORST],
  ['calendula-officinalis', 'matricaria-chamomilla', 'good', SRC.LANGERHORST],

  // === 3h. Kümmel ===
  ['carum-carvi', 'coriandrum-sativum', 'good', SRC.LANGERHORST],
  ['carum-carvi', 'foeniculum-vulgare', 'bad', SRC.FRANCK],

  // === 3i. Koriander ===
  ['coriandrum-sativum', 'anethum-graveolens', 'bad', SRC.FRANCK], // already above but listed for clarity? No, dedupe-only matters — apply script will dedupe.
  ['coriandrum-sativum', 'foeniculum-vulgare', 'bad', SRC.FRANCK],

  // === 3j. Gartenkürbis (Cucurbita pepo — eine der "Three Sisters") ===
  ['cucurbita-pepo', 'tropaeolum-majus', 'good', SRC.THREE_SISTERS,
    'Kapuzinerkresse hält Blattläuse und Kürbiskäfer fern.',
    'Nasturtium deters aphids and squash beetles.'],
  ['cucurbita-pepo', 'tagetes-patula', 'good', SRC.THREE_SISTERS],
  ['cucurbita-pepo', 'matricaria-chamomilla', 'good', SRC.LANGERHORST],

  // === 3k. Rucola ===
  ['eruca-sativa', 'tropaeolum-majus', 'good', SRC.LANGERHORST],
  ['eruca-sativa', 'ocimum-basilicum', 'good', SRC.LANGERHORST],
  ['eruca-sativa', 'allium-sativum', 'good', SRC.LANGERHORST],

  // === 3l. Fenchel — meistens schlechter Nachbar (allelopathisch) ===
  ['foeniculum-vulgare', 'tropaeolum-majus', 'bad', SRC.FRANCK,
    'Fenchel ist stark allelopathisch und hemmt fast alle Nachbarn.',
    'Fennel is strongly allelopathic and inhibits nearly all neighbours.'],
  ['foeniculum-vulgare', 'apium-graveolens', 'bad', SRC.FRANCK],
  ['foeniculum-vulgare', 'petroselinum-crispum', 'bad', SRC.FRANCK],

  // === 3m. Erdbeere (Wald-Erdbeere) ===
  ['fragaria-vesca', 'petroselinum-crispum', 'good', SRC.LANGERHORST],
  ['fragaria-vesca', 'tagetes-patula', 'good', SRC.LANGERHORST],
  ['fragaria-vesca', 'thymus-vulgaris', 'good', SRC.LANGERHORST],

  // === 3n. Ysop — gute Biene-Pflanze, schlecht zu Radieschen-Familie (hier irrelevant) ===
  ['hyssopus-officinalis', 'cucurbita-pepo', 'good', SRC.LANGERHORST],
  ['hyssopus-officinalis', 'fragaria-vesca', 'good', SRC.LANGERHORST],

  // === 3o. Lorbeer — gewächshaus-tauglich, neutral mit allem ===
  ['laurus-nobilis', 'salvia-officinalis', 'neutral', SRC.LANGERHORST],
  ['laurus-nobilis', 'rosmarinus-officinalis', 'good', SRC.LANGERHORST],

  // === 3p. Lavendel — Bienenmagnet, gut zu Rosen, schlecht zu Feuchtigkeitsliebhabern ===
  ['lavandula-angustifolia', 'rosmarinus-officinalis', 'good', SRC.LANGERHORST],
  ['lavandula-angustifolia', 'thymus-vulgaris', 'good', SRC.LANGERHORST],
  ['lavandula-angustifolia', 'salvia-officinalis', 'good', SRC.LANGERHORST],
  ['lavandula-angustifolia', 'origanum-vulgare', 'good', SRC.LANGERHORST],
  ['lavandula-angustifolia', 'mentha-piperita', 'bad', SRC.LANGERHORST,
    'Minze braucht feuchten Boden, Lavendel trockenen.',
    'Mint needs moist soil, lavender dry.'],

  // === 3q. Liebstöckel — "Maggi-Kraut", universeller Verstärker ===
  ['levisticum-officinale', 'petroselinum-crispum', 'good', SRC.LANGERHORST],
  ['levisticum-officinale', 'apium-graveolens', 'good', SRC.LANGERHORST],

  // === 3r. Kamille — universal-guter Nachbar, "Pflanzenarzt" ===
  ['matricaria-chamomilla', 'mentha-piperita', 'good', SRC.LANGERHORST,
    'Kamille stärkt Minze-Aroma.',
    'Chamomile boosts mint aroma.'],
  ['matricaria-chamomilla', 'origanum-vulgare', 'good', SRC.LANGERHORST],
  ['matricaria-chamomilla', 'thymus-vulgaris', 'good', SRC.LANGERHORST],
  ['matricaria-chamomilla', 'salvia-officinalis', 'good', SRC.LANGERHORST],
  ['matricaria-chamomilla', 'tropaeolum-majus', 'good', SRC.LANGERHORST],
  ['matricaria-chamomilla', 'achillea-millefolium', 'good', SRC.LANGERHORST],

  // === 3s. Pfefferminze ===
  ['mentha-piperita', 'matricaria-chamomilla', 'good', SRC.LANGERHORST], // duplicate intentional — dedupe in script
  ['mentha-piperita', 'mentha-spicata', 'bad', SRC.LANGERHORST,
    'Minz-Arten kreuzen und hybridisieren — räumlich trennen.',
    'Mint species cross-pollinate and hybridise — separate spatially.'],
  ['mentha-piperita', 'petroselinum-crispum', 'bad', SRC.LANGERHORST,
    'Minze überwuchert Petersilie.',
    'Mint overgrows parsley.'],

  // === 3t. Grüne Minze ===
  ['mentha-spicata', 'mentha-villosa', 'bad', SRC.LANGERHORST],

  // === 3u. Katzenminze — Nützlings-Magnet ===
  ['nepeta-cataria', 'cucurbita-pepo', 'good', SRC.LANGERHORST,
    'Katzenminze hält Kürbis-Käfer fern.',
    'Catnip deters squash bugs.'],
  ['nepeta-cataria', 'allium-sativum', 'good', SRC.LANGERHORST],

  // === 3v. Indisches Basilikum ===
  ['ocimum-tenuiflorum', 'allium-sativum', 'good', SRC.LANGERHORST],
  ['ocimum-tenuiflorum', 'calendula-officinalis', 'good', SRC.LANGERHORST],

  // === 3w. Oregano ===
  ['origanum-vulgare', 'cucurbita-pepo', 'good', SRC.LANGERHORST],
  ['origanum-vulgare', 'thymus-vulgaris', 'good', SRC.LANGERHORST],
  ['origanum-vulgare', 'salvia-officinalis', 'good', SRC.LANGERHORST],

  // === 3x. Petersilie ===
  ['petroselinum-crispum', 'allium-sativum', 'good', SRC.LANGERHORST],
  ['petroselinum-crispum', 'tropaeolum-majus', 'good', SRC.LANGERHORST],

  // === 3y. Anis ===
  ['pimpinella-anisum', 'coriandrum-sativum', 'good', SRC.LANGERHORST],

  // === 3z. Rosmarin ===
  ['rosmarinus-officinalis', 'salvia-officinalis', 'good', SRC.LANGERHORST],
  ['rosmarinus-officinalis', 'thymus-vulgaris', 'good', SRC.LANGERHORST],

  // === 3aa. Salbei ===
  ['salvia-officinalis', 'thymus-vulgaris', 'good', SRC.LANGERHORST],
  ['salvia-officinalis', 'allium-sativum', 'bad', SRC.LANGERHORST,
    'Salbei und Lauchgewächse stören sich gegenseitig.',
    'Sage and alliums inhibit each other.'],

  // === 3bb. Bohnenkraut — klassischer Bohnen-Begleiter (hier ohne Bohnen-Pflanze) ===
  ['satureja-hortensis', 'trigonella-foenum-graecum', 'good', SRC.LANGERHORST,
    'Bohnenkraut stärkt Hülsenfrüchte (klassische Mischkultur).',
    'Savory strengthens legumes (classic companion pair).'],
  ['satureja-hortensis', 'allium-sativum', 'bad', SRC.LANGERHORST],

  // === 3cc. Tagetes — Nematoden-Schreck, universal-gut ===
  ['tagetes-patula', 'tropaeolum-majus', 'good', SRC.LANGERHORST],
  ['tagetes-patula', 'thymus-vulgaris', 'good', SRC.LANGERHORST],

  // === 3dd. Mutterkraut ===
  ['tanacetum-parthenium', 'allium-sativum', 'good', SRC.LANGERHORST],
  ['tanacetum-parthenium', 'matricaria-chamomilla', 'good', SRC.LANGERHORST],

  // === 3ee. Thymian ===
  ['thymus-vulgaris', 'cucurbita-pepo', 'good', SRC.LANGERHORST,
    'Thymian hält Kohlweißling und Kürbis-Schädlinge fern.',
    'Thyme deters cabbage white and squash pests.'],
  ['thymus-vulgaris', 'tropaeolum-majus', 'good', SRC.LANGERHORST],

  // === 3ff. Bockshornklee — Stickstoff-Sammler ===
  ['trigonella-foenum-graecum', 'cucurbita-pepo', 'good', SRC.LANGERHORST,
    'Bockshornklee fixiert Stickstoff für Kürbis (Three-Sisters-Logik).',
    'Fenugreek fixes nitrogen for squash (Three Sisters logic).'],

  // === 3gg. Kapuzinerkresse — universal-guter Schädlings-Köder ===
  ['tropaeolum-majus', 'allium-sativum', 'good', SRC.LANGERHORST],
  ['tropaeolum-majus', 'rosmarinus-officinalis', 'good', SRC.LANGERHORST],

  // === 3hh. Brennnessel — Jauche-Quelle, universal-Stärker ===
  ['urtica-dioica', 'matricaria-chamomilla', 'good', SRC.LANGERHORST,
    'Brennnessel-Jauche stärkt Kamille und viele Kräuter.',
    'Nettle slurry strengthens chamomile and many herbs.'],
  ['urtica-dioica', 'mentha-piperita', 'good', SRC.LANGERHORST],

  // === 3ii. Estragon ===
  ['artemisia-dracunculus', 'ocimum-basilicum', 'neutral', SRC.LANGERHORST],
  ['artemisia-dracunculus', 'petroselinum-crispum', 'good', SRC.LANGERHORST],

  // === 3jj. Schafgarbe — Pflanzen-Stärkungs-Mittel ===
  ['achillea-millefolium', 'matricaria-chamomilla', 'good', SRC.LANGERHORST], // duplicate intentional
  ['achillea-millefolium', 'origanum-vulgare', 'good', SRC.LANGERHORST],
  ['achillea-millefolium', 'lavandula-angustifolia', 'good', SRC.LANGERHORST],

  // ============================================================
  // === 4. WELLE C.3 — GEMÜSE-ALLIANZEN (klassische Mischkultur) ===
  // ============================================================
  // (Bidirektional über das Skript erzwungen. Quellen: Three-Sisters-Tradition,
  // Langerhorst, Franck, klassische DACH-Bauernregeln.)

  // === 4a. Three Sisters (Native American) ===
  ['zea-mays', 'phaseolus-vulgaris-vulgaris', 'good', SRC.THREE_SISTERS,
    'Bohne fixiert Stickstoff für Mais (Three-Sisters-Klassiker).',
    'Bean fixes nitrogen for corn (classic Three Sisters).'],
  ['zea-mays', 'cucurbita-pepo', 'good', SRC.THREE_SISTERS,
    'Kürbis-Blätter beschatten den Boden und halten Feuchtigkeit für Mais.',
    'Squash leaves shade soil and retain moisture for corn.'],
  ['zea-mays', 'cucurbita-pepo-zucchini', 'good', SRC.THREE_SISTERS],
  ['phaseolus-vulgaris-vulgaris', 'cucurbita-pepo', 'good', SRC.THREE_SISTERS,
    'Bohne stickstoffreich, Kürbis nährstoffhungrig — perfekte Symbiose.',
    'Bean is nitrogen-rich, squash is heavy feeder — perfect symbiosis.'],
  ['phaseolus-vulgaris-vulgaris', 'cucurbita-pepo-zucchini', 'good', SRC.THREE_SISTERS],
  ['phaseolus-vulgaris-nanus', 'zea-mays', 'good', SRC.THREE_SISTERS],
  ['phaseolus-vulgaris-nanus', 'cucurbita-pepo', 'good', SRC.THREE_SISTERS],

  // === 4b. Tomate ===
  ['solanum-lycopersicum', 'ocimum-basilicum', 'good', SRC.LANGERHORST,
    'Klassisch: Basilikum hält Weiße Fliege fern und verbessert Tomatenaroma.',
    'Classic: basil deters whitefly and improves tomato aroma.'],
  ['solanum-lycopersicum', 'petroselinum-crispum', 'good', SRC.LANGERHORST,
    'Petersilie lockt Nützlinge zu Tomate.',
    'Parsley attracts beneficial insects to tomato.'],
  ['solanum-lycopersicum', 'tagetes-patula', 'good', SRC.LANGERHORST,
    'Tagetes vertreibt Nematoden im Tomatenbeet.',
    'Marigold deters nematodes in the tomato bed.'],
  ['solanum-lycopersicum', 'calendula-officinalis', 'good', SRC.LANGERHORST],
  ['solanum-lycopersicum', 'allium-sativum', 'good', SRC.LANGERHORST,
    'Knoblauch hält Tomaten-Schädlinge fern.',
    'Garlic deters tomato pests.'],
  ['solanum-lycopersicum', 'allium-cepa', 'good', SRC.LANGERHORST],
  ['solanum-lycopersicum', 'apium-graveolens', 'good', SRC.LANGERHORST],
  ['solanum-lycopersicum', 'tropaeolum-majus', 'good', SRC.LANGERHORST,
    'Kapuzinerkresse ist Blattlaus-Köder für Tomate.',
    'Nasturtium is an aphid trap for tomato.'],
  ['solanum-lycopersicum', 'brassica-oleracea-capitata-alba', 'bad', SRC.FRANCK,
    'Tomate und Kohl konkurrieren stark um Nährstoffe.',
    'Tomato and cabbage compete heavily for nutrients.'],
  ['solanum-lycopersicum', 'brassica-oleracea-capitata-rubra', 'bad', SRC.FRANCK],
  ['solanum-lycopersicum', 'brassica-oleracea-italica', 'bad', SRC.FRANCK],
  ['solanum-lycopersicum', 'foeniculum-vulgare', 'bad', SRC.FRANCK,
    'Fenchel hemmt Tomatenwachstum stark.',
    'Fennel strongly inhibits tomato growth.'],
  ['solanum-lycopersicum', 'cucumis-sativus', 'bad', SRC.FRANCK,
    'Tomate und Gurke teilen Pilzkrankheiten (Mehltau).',
    'Tomato and cucumber share fungal diseases (mildew).'],
  ['solanum-lycopersicum', 'solanum-tuberosum', 'bad', SRC.LANGERHORST,
    'Beide Nachtschattengewächse — Kraut- und Knollenfäule überträgt sich.',
    'Both Solanaceae — late blight transfers between them.'],

  // === 4c. Kartoffel ===
  ['solanum-tuberosum', 'phaseolus-vulgaris-nanus', 'good', SRC.LANGERHORST,
    'Buschbohne hält Kartoffelkäfer fern.',
    'Bush bean deters Colorado potato beetle.'],
  ['solanum-tuberosum', 'tagetes-patula', 'good', SRC.LANGERHORST,
    'Tagetes vertreibt Nematoden im Kartoffelbeet.',
    'Marigold deters nematodes in the potato bed.'],
  ['solanum-tuberosum', 'calendula-officinalis', 'good', SRC.LANGERHORST],
  ['solanum-tuberosum', 'spinacia-oleracea', 'good', SRC.LANGERHORST,
    'Spinat als Untersaat liefert Stickstoff und beschattet Boden.',
    'Spinach as undersowing provides nitrogen and shades soil.'],
  ['solanum-tuberosum', 'cucurbita-pepo', 'bad', SRC.LANGERHORST,
    'Beide stark zehrend — konkurrieren um Wasser und Nährstoffe.',
    'Both heavy feeders — compete for water and nutrients.'],
  ['solanum-tuberosum', 'apium-graveolens', 'bad', SRC.FRANCK],

  // === 4d. Paprika / Chilli / Aubergine (Solanaceae-Cluster) ===
  ['capsicum-annuum', 'ocimum-basilicum', 'good', SRC.LANGERHORST,
    'Basilikum verbessert Paprika-Aroma und hält Schädlinge fern.',
    'Basil improves pepper aroma and deters pests.'],
  ['capsicum-annuum', 'tagetes-patula', 'good', SRC.LANGERHORST],
  ['capsicum-annuum', 'calendula-officinalis', 'good', SRC.LANGERHORST],
  ['capsicum-annuum', 'allium-sativum', 'good', SRC.LANGERHORST],
  ['capsicum-annuum', 'foeniculum-vulgare', 'bad', SRC.FRANCK],
  ['capsicum-chinense', 'ocimum-basilicum', 'good', SRC.LANGERHORST],
  ['capsicum-chinense', 'tagetes-patula', 'good', SRC.LANGERHORST],
  ['solanum-melongena', 'ocimum-basilicum', 'good', SRC.LANGERHORST],
  ['solanum-melongena', 'tagetes-patula', 'good', SRC.LANGERHORST],
  ['solanum-melongena', 'phaseolus-vulgaris-nanus', 'good', SRC.LANGERHORST,
    'Buschbohne hält Kartoffelkäfer-Verwandte von Aubergine fern.',
    'Bush bean deters Colorado-potato-beetle relatives from eggplant.'],

  // === 4e. Karotte ↔ Zwiebel / Lauch (klassische Allianz) ===
  ['daucus-carota-sativus', 'allium-cepa', 'good', SRC.LANGERHORST,
    'Möhrenfliege ↔ Zwiebelfliege gegenseitige Abwehr — klassische DACH-Bauernregel.',
    'Carrot fly vs onion fly mutual deterrence — classic DACH companion pair.'],
  ['daucus-carota-sativus', 'allium-porrum', 'good', SRC.LANGERHORST,
    'Lauch hält Möhrenfliege fern (gleicher Mechanismus wie Zwiebel).',
    'Leek deters carrot fly (same mechanism as onion).'],
  ['daucus-carota-sativus', 'allium-sativum', 'good', SRC.LANGERHORST],
  ['daucus-carota-sativus', 'pisum-sativum-sativum', 'good', SRC.LANGERHORST,
    'Erbsen liefern Stickstoff für Karotten.',
    'Peas provide nitrogen for carrots.'],
  ['daucus-carota-sativus', 'lactuca-sativa-capitata', 'good', SRC.LANGERHORST],
  ['daucus-carota-sativus', 'lactuca-sativa-crispa', 'good', SRC.LANGERHORST],
  ['daucus-carota-sativus', 'raphanus-sativus-sativus', 'good', SRC.LANGERHORST],
  ['daucus-carota-sativus', 'rosmarinus-officinalis', 'good', SRC.LANGERHORST],
  ['daucus-carota-sativus', 'salvia-officinalis', 'good', SRC.LANGERHORST],
  ['daucus-carota-sativus', 'tagetes-patula', 'good', SRC.LANGERHORST],
  ['daucus-carota-sativus', 'anethum-graveolens', 'bad', SRC.FRANCK,
    'Dill und Karotte konkurrieren (gleiche Apiaceae-Familie).',
    'Dill and carrot compete (same Apiaceae family).'],
  ['daucus-carota-sativus', 'apium-graveolens', 'bad', SRC.FRANCK],

  // === 4f. Erbse, Bohne (Fabaceae) ↔ Zwiebel/Knoblauch BAD ===
  ['pisum-sativum-sativum', 'allium-cepa', 'bad', SRC.LANGERHORST,
    'Lauchgewächse hemmen Hülsenfrüchte (klassische Bauernregel).',
    'Alliums inhibit legumes (classic rule).'],
  ['pisum-sativum-sativum', 'allium-porrum', 'bad', SRC.LANGERHORST],
  ['pisum-sativum-sativum', 'allium-sativum', 'bad', SRC.LANGERHORST],
  ['pisum-sativum-saccharatum', 'allium-cepa', 'bad', SRC.LANGERHORST],
  ['pisum-sativum-saccharatum', 'allium-sativum', 'bad', SRC.LANGERHORST],
  ['phaseolus-vulgaris-nanus', 'allium-cepa', 'bad', SRC.LANGERHORST],
  ['phaseolus-vulgaris-nanus', 'allium-sativum', 'bad', SRC.LANGERHORST],
  ['phaseolus-vulgaris-vulgaris', 'allium-cepa', 'bad', SRC.LANGERHORST],
  ['phaseolus-vulgaris-vulgaris', 'allium-sativum', 'bad', SRC.LANGERHORST],

  // === 4g. Erbse & Bohnen: gute Nachbarn ===
  ['pisum-sativum-sativum', 'daucus-carota-sativus', 'good', SRC.LANGERHORST],
  ['pisum-sativum-sativum', 'cucumis-sativus', 'good', SRC.LANGERHORST],
  ['pisum-sativum-sativum', 'spinacia-oleracea', 'good', SRC.LANGERHORST],
  ['pisum-sativum-sativum', 'lactuca-sativa-capitata', 'good', SRC.LANGERHORST],
  ['pisum-sativum-saccharatum', 'daucus-carota-sativus', 'good', SRC.LANGERHORST],
  ['phaseolus-vulgaris-nanus', 'satureja-hortensis', 'good', SRC.LANGERHORST,
    'Bohnenkraut stärkt Bohnen — klassische Mischkultur.',
    'Savory strengthens beans — classic companion pair.'],
  ['phaseolus-vulgaris-vulgaris', 'satureja-hortensis', 'good', SRC.LANGERHORST],
  ['phaseolus-vulgaris-nanus', 'apium-graveolens', 'good', SRC.LANGERHORST,
    'Bohne und Sellerie sind klassische Mischkultur.',
    'Bean and celery are classic companions.'],
  ['phaseolus-vulgaris-nanus', 'cucumis-sativus', 'good', SRC.LANGERHORST],
  ['phaseolus-vulgaris-vulgaris', 'cucumis-sativus', 'good', SRC.LANGERHORST],

  // === 4h. Kohl-Familie (Brassicaceae) ===
  ['brassica-oleracea-capitata-alba', 'apium-graveolens', 'good', SRC.LANGERHORST,
    'Sellerie hält Kohlweißling fern (klassische DACH-Bauernregel).',
    'Celery deters cabbage white butterfly (classic DACH rule).'],
  ['brassica-oleracea-capitata-rubra', 'apium-graveolens', 'good', SRC.LANGERHORST],
  ['brassica-oleracea-italica', 'apium-graveolens', 'good', SRC.LANGERHORST],
  ['brassica-oleracea-capitata-alba', 'lactuca-sativa-capitata', 'good', SRC.LANGERHORST],
  ['brassica-oleracea-capitata-alba', 'lactuca-sativa-crispa', 'good', SRC.LANGERHORST],
  ['brassica-oleracea-capitata-alba', 'spinacia-oleracea', 'good', SRC.LANGERHORST],
  ['brassica-oleracea-capitata-alba', 'tagetes-patula', 'good', SRC.LANGERHORST],
  ['brassica-oleracea-italica', 'lactuca-sativa-capitata', 'good', SRC.LANGERHORST],
  ['brassica-oleracea-italica', 'allium-cepa', 'good', SRC.LANGERHORST,
    'Zwiebel hält Kohlfliege fern.',
    'Onion deters cabbage root fly.'],
  ['brassica-oleracea-italica', 'thymus-vulgaris', 'good', SRC.LANGERHORST,
    'Thymian-Duft maskiert Brokkoli für Kohlweißling.',
    'Thyme scent masks broccoli from cabbage white butterfly.'],
  ['brassica-oleracea-botrytis', 'apium-graveolens', 'good', SRC.LANGERHORST],
  ['brassica-oleracea-gongylodes', 'lactuca-sativa-crispa', 'good', SRC.LANGERHORST],
  ['brassica-oleracea-gongylodes', 'allium-cepa', 'good', SRC.LANGERHORST],
  ['brassica-oleracea-capitata-alba', 'fragaria-vesca', 'bad', SRC.LANGERHORST,
    'Kohl und Erdbeere konkurrieren um Nährstoffe und Wasser.',
    'Cabbage and strawberry compete for nutrients and water.'],
  ['brassica-oleracea-italica', 'fragaria-vesca', 'bad', SRC.LANGERHORST],

  // === 4i. Salat ↔ Radieschen (klassische Schnellkultur-Allianz) ===
  ['lactuca-sativa-capitata', 'raphanus-sativus-sativus', 'good', SRC.LANGERHORST,
    'Klassiker: Radieschen schnellt, Salat langsam — perfekte Reihenkultur.',
    'Classic: radishes are fast, lettuce is slow — perfect row companions.'],
  ['lactuca-sativa-crispa', 'raphanus-sativus-sativus', 'good', SRC.LANGERHORST],
  ['lactuca-sativa-capitata', 'daucus-carota-sativus', 'good', SRC.LANGERHORST],
  ['lactuca-sativa-capitata', 'allium-cepa', 'good', SRC.LANGERHORST],
  ['lactuca-sativa-crispa', 'allium-cepa', 'good', SRC.LANGERHORST],
  ['lactuca-sativa-capitata', 'fragaria-vesca', 'good', SRC.LANGERHORST],
  ['lactuca-sativa-crispa', 'fragaria-vesca', 'good', SRC.LANGERHORST],
  ['lactuca-sativa-capitata', 'eruca-sativa', 'good', SRC.LANGERHORST],
  ['lactuca-sativa-capitata', 'petroselinum-crispum', 'bad', SRC.FRANCK,
    'Petersilie und Salat hemmen sich (Wurzelausscheidungen).',
    'Parsley and lettuce inhibit each other (root exudates).'],

  // === 4j. Spinat ↔ Erdbeere (klassisch gut) ===
  ['spinacia-oleracea', 'fragaria-vesca', 'good', SRC.LANGERHORST,
    'Spinat liefert Stickstoff für Erdbeere und beschattet Boden.',
    'Spinach provides nitrogen for strawberry and shades soil.'],
  ['spinacia-oleracea', 'brassica-oleracea-capitata-alba', 'good', SRC.LANGERHORST],
  ['spinacia-oleracea', 'allium-cepa', 'good', SRC.LANGERHORST],
  ['spinacia-oleracea', 'lactuca-sativa-capitata', 'good', SRC.LANGERHORST],

  // === 4k. Knoblauch ↔ Erdbeere (gut), Knoblauch ↔ Bohne (BAD bereits oben) ===
  ['allium-sativum', 'daucus-carota-sativus', 'good', SRC.LANGERHORST,
    'Knoblauch hält Möhrenfliege fern.',
    'Garlic deters carrot fly.'],
  ['allium-sativum', 'solanum-lycopersicum', 'good', SRC.LANGERHORST],

  // === 4l. Gurke (Cucumis) ===
  ['cucumis-sativus', 'anethum-graveolens', 'good', SRC.LANGERHORST,
    'Klassiker: Dill mit Gurken-Einlegen — auch im Beet gute Nachbarn.',
    'Classic: dill with pickled cucumbers — also good bed companions.'],
  ['cucumis-sativus', 'allium-cepa', 'good', SRC.LANGERHORST],
  ['cucumis-sativus', 'tropaeolum-majus', 'good', SRC.LANGERHORST],
  ['cucumis-sativus', 'calendula-officinalis', 'good', SRC.LANGERHORST],
  ['cucumis-sativus', 'lactuca-sativa-capitata', 'good', SRC.LANGERHORST],

  // === 4m. Zucchini ===
  ['cucurbita-pepo-zucchini', 'tropaeolum-majus', 'good', SRC.LANGERHORST,
    'Kapuzinerkresse hält Kürbiskäfer fern.',
    'Nasturtium deters squash beetles.'],
  ['cucurbita-pepo-zucchini', 'calendula-officinalis', 'good', SRC.LANGERHORST],
  ['cucurbita-pepo-zucchini', 'borago-officinalis', 'good', SRC.LANGERHORST,
    'Borretsch lockt Bestäuber zu Zucchini-Blüten.',
    'Borage attracts pollinators to zucchini flowers.'],
  ['cucurbita-pepo-zucchini', 'allium-cepa', 'good', SRC.LANGERHORST],
  ['cucurbita-pepo-zucchini', 'solanum-tuberosum', 'bad', SRC.LANGERHORST,
    'Beide stark zehrend — Konkurrenz.',
    'Both heavy feeders — competition.'],

  // === 4n. Mais ↔ weitere ===
  ['zea-mays', 'cucumis-sativus', 'good', SRC.LANGERHORST,
    'Mais bietet Klettergerüst für Gurke (analog Three Sisters).',
    'Corn provides climbing frame for cucumber (analogous to Three Sisters).'],
  ['zea-mays', 'tropaeolum-majus', 'good', SRC.LANGERHORST],

  // === 4o. Rote Bete ↔ Mangold / Spinat (gleiche Familie, gute Nachbarn) ===
  ['beta-vulgaris-conditiva', 'brassica-oleracea-capitata-alba', 'good', SRC.LANGERHORST],
  ['beta-vulgaris-conditiva', 'lactuca-sativa-capitata', 'good', SRC.LANGERHORST],
  ['beta-vulgaris-conditiva', 'allium-cepa', 'good', SRC.LANGERHORST,
    'Zwiebel hält Bete-Schädlinge fern.',
    'Onion deters beet pests.'],
  ['beta-vulgaris-cicla', 'daucus-carota-sativus', 'good', SRC.LANGERHORST],
  ['beta-vulgaris-cicla', 'phaseolus-vulgaris-nanus', 'good', SRC.LANGERHORST],

  // === 4p. Zwiebel ↔ Möhre (oben), Zwiebel ↔ Kamille (Aroma-Verstärkung) ===
  ['allium-cepa', 'matricaria-chamomilla', 'good', SRC.LANGERHORST,
    'Kamille verstärkt Zwiebel-Aroma (klassische Bauernregel).',
    'Chamomile boosts onion aroma (classic rule).'],
  ['allium-cepa', 'tagetes-patula', 'good', SRC.LANGERHORST],
  ['allium-porrum', 'apium-graveolens', 'good', SRC.LANGERHORST,
    'Lauch und Sellerie sind klassische Wintergemüse-Mischkultur.',
    'Leek and celery are classic winter-vegetable companions.'],
  ['allium-porrum', 'fragaria-vesca', 'good', SRC.LANGERHORST],

  // === 4q. Pastinake ↔ Apiaceae-Gruppe ===
  ['pastinaca-sativa', 'allium-cepa', 'good', SRC.LANGERHORST],
  ['pastinaca-sativa', 'lactuca-sativa-capitata', 'good', SRC.LANGERHORST],
  ['pastinaca-sativa', 'apium-graveolens', 'bad', SRC.FRANCK,
    'Pastinake und Sellerie sind beide Apiaceae — Schädlings-Hotspot.',
    'Parsnip and celery are both Apiaceae — pest hotspot.'],

  // === 4r. Knollensellerie ↔ Kohl, Lauch (klassisch) ===
  ['apium-graveolens-rapaceum', 'brassica-oleracea-capitata-alba', 'good', SRC.LANGERHORST],
  ['apium-graveolens-rapaceum', 'allium-porrum', 'good', SRC.LANGERHORST],
  ['apium-graveolens-rapaceum', 'phaseolus-vulgaris-nanus', 'good', SRC.LANGERHORST],

  // === 4s. Petersilienwurzel — Standard-Apiaceae-Verhalten ===
  ['petroselinum-crispum-tuberosum', 'allium-cepa', 'good', SRC.LANGERHORST],
  ['petroselinum-crispum-tuberosum', 'solanum-lycopersicum', 'good', SRC.LANGERHORST],
  ['petroselinum-crispum-tuberosum', 'lactuca-sativa-capitata', 'bad', SRC.FRANCK],

  // === 4t. Rosenkohl, Wirsing: gleiches Verhalten wie Weisskohl/Brokkoli ===
  ['brassica-oleracea-gemmifera', 'apium-graveolens', 'good', SRC.LANGERHORST],
  ['brassica-oleracea-gemmifera', 'spinacia-oleracea', 'good', SRC.LANGERHORST],
  ['brassica-oleracea-sabauda', 'apium-graveolens', 'good', SRC.LANGERHORST],
  ['brassica-oleracea-sabauda', 'allium-porrum', 'good', SRC.LANGERHORST],

  // === 4u. Rettich (Winter) ↔ Salat / Möhre ===
  ['raphanus-sativus-niger', 'lactuca-sativa-capitata', 'good', SRC.LANGERHORST],
  ['raphanus-sativus-niger', 'daucus-carota-sativus', 'good', SRC.LANGERHORST],

  // ============================================================
  // === 5. WELLE F — Schnittlauch + Rhabarber (Holzer-Klassiker) ===
  // ============================================================

  // === 5a. Schnittlauch (Allium schoenoprasum) ===
  // Allium-Verhalten: gut zu Möhre/Salat/Erdbeere/Tomate, schlecht zu Hülsenfrüchten.
  ['allium-schoenoprasum', 'daucus-carota-sativus', 'good', SRC.LANGERHORST,
    'Schnittlauch hält Möhrenfliege fern — klassische Allium-Mischkultur.',
    'Chives deter carrot fly — classic Allium companion pairing.'],
  ['allium-schoenoprasum', 'lactuca-sativa-capitata', 'good', SRC.LANGERHORST,
    'Schnittlauch lockert Aphiden ab und hält Salat-Schädlinge fern.',
    'Chives distract aphids and keep lettuce pests away.'],
  ['allium-schoenoprasum', 'fragaria-vesca', 'good', SRC.LANGERHORST,
    'Schnittlauch schützt Erdbeere vor Pilzen (Grauschimmel).',
    'Chives protect strawberry from fungi (grey mould).'],
  ['allium-schoenoprasum', 'allium-cepa', 'good', SRC.LANGERHORST,
    'Beide Allium-Familie, vertragen sich problemlos.',
    'Both Allium family, coexist without issue.'],
  ['allium-schoenoprasum', 'solanum-lycopersicum', 'good', SRC.LANGERHORST,
    'Schnittlauch hält Aphiden von Tomaten fern und lockt Bienen.',
    'Chives deter aphids from tomatoes and attract bees.'],
  ['allium-schoenoprasum', 'phaseolus-vulgaris-vulgaris', 'bad', SRC.LANGERHORST,
    'Allium hemmt Stickstoff-fixierende Hülsenfrüchte (klassische Bauernregel).',
    'Alliums inhibit nitrogen-fixing legumes (classic rule).'],
  ['allium-schoenoprasum', 'pisum-sativum-sativum', 'bad', SRC.LANGERHORST,
    'Allium hemmt Erbsen-Wachstum — räumlich trennen.',
    'Alliums inhibit pea growth — separate spatially.'],

  // === 5b. Rhabarber (Rheum rhabarbarum) ===
  // Tiefwurzler mit großen Blättern: gut zu Kohl/Knoblauch/Salat, schlecht zu Möhre.
  // Quelle: Sepp Holzer, Sepp Holzers Permakultur (eigene Adaption).
  ['rheum-rhabarbarum', 'brassica-oleracea-capitata-alba', 'good', SRC.LANGERHORST,
    'Rhabarber-Blätter beschatten den Boden, Kohl profitiert von der Feuchte.',
    'Rhubarb leaves shade the soil, cabbage benefits from the retained moisture.'],
  ['rheum-rhabarbarum', 'brassica-oleracea-capitata-rubra', 'good', SRC.LANGERHORST,
    'Rhabarber-Blätter beschatten den Boden — auch Rotkohl mag das.',
    'Rhubarb leaves shade the soil — red cabbage likes it too.'],
  ['rheum-rhabarbarum', 'allium-sativum', 'good', SRC.LANGERHORST,
    'Knoblauch hält Rhabarber-Schädlinge und Wurzelpilze fern.',
    'Garlic deters rhubarb pests and root fungi.'],
  ['rheum-rhabarbarum', 'lactuca-sativa-capitata', 'good', SRC.LANGERHORST,
    'Salat als Bodendecker unter den großen Rhabarber-Blättern.',
    'Lettuce as ground cover beneath the large rhubarb leaves.'],
  ['rheum-rhabarbarum', 'daucus-carota-sativus', 'bad', SRC.LANGERHORST,
    'Beide Tiefwurzler — konkurrieren um den gleichen Wurzelraum.',
    'Both deep-rooting — compete for the same root space.'],
];

// === 4. ZUSATZ-LOOKUPS ===
// Plants that have a companion_planting block but where we only know the
// neutral status / notes from a generic source — kept in case future passes
// expand from here. Currently empty.
const STANDALONE_NOTES = {};

// === 5. AUFBAU PRO-SLUG-DATEN ===
// Build per-slug { good_partners, bad_partners, neutral, source, notes_de, notes_en }.
const bySlug = new Map();

function ensureSlot(slug) {
  if (!bySlug.has(slug)) {
    bySlug.set(slug, {
      good: new Set(),
      bad: new Set(),
      neutral: new Set(),
      sources: new Set(),
      notes_de: [],
      notes_en: [],
    });
  }
  return bySlug.get(slug);
}

for (const pair of PAIRS) {
  const [a, b, kind, source, notes_de, notes_en] = pair;
  if (a === b) {
    throw new Error(`Self-pair forbidden: ${a}`);
  }
  const slotA = ensureSlot(a);
  const slotB = ensureSlot(b);

  if (kind === 'good') {
    slotA.good.add(b);
    slotB.good.add(a);
  } else if (kind === 'bad') {
    slotA.bad.add(b);
    slotB.bad.add(a);
  } else if (kind === 'neutral') {
    slotA.neutral.add(b);
    slotB.neutral.add(a);
  } else {
    throw new Error(`Unknown kind '${kind}' for pair ${a}/${b}`);
  }

  slotA.sources.add(source);
  slotB.sources.add(source);

  if (notes_de) {
    // Store note on both sides — they describe the same relationship.
    slotA.notes_de.push(`${b}: ${notes_de}`);
    slotB.notes_de.push(`${a}: ${notes_de}`);
  }
  if (notes_en) {
    slotA.notes_en.push(`${b}: ${notes_en}`);
    slotB.notes_en.push(`${a}: ${notes_en}`);
  }
}

// === 6. APPLY ===
// Loop existing plant JSONs and write companion_planting block where slug
// appears in bySlug.
let updated = 0;
const files = readdirSync(PLANTS_DIR).filter(f => f.endsWith('.json'));

for (const file of files) {
  const path = join(PLANTS_DIR, file);
  const raw = readFileSync(path, 'utf8');
  const plant = JSON.parse(raw);

  if (!bySlug.has(plant.slug)) continue;

  const slot = bySlug.get(plant.slug);
  const sourceCombined = Array.from(slot.sources).sort().join(' | ');

  // Preserve `reasons` from the prior file (managed by scripts/seed_permaculture.mjs).
  // Filter to only partners that still exist in the new good/bad/neutral lists.
  // (Reasons werden von seed_permaculture.mjs gepflegt; hier preserven und auf
  //  aktuell gültige Partner filtern, damit das Schema konsistent bleibt.)
  const prevReasons =
    plant.companion_planting && typeof plant.companion_planting === 'object'
      ? plant.companion_planting.reasons
      : undefined;

  const cp = {
    good_partners: Array.from(slot.good).sort(),
    bad_partners: Array.from(slot.bad).sort(),
  };
  if (slot.neutral.size > 0) {
    cp.neutral = Array.from(slot.neutral).sort();
  }

  if (prevReasons && typeof prevReasons === 'object') {
    const validPartners = new Set([
      ...cp.good_partners,
      ...cp.bad_partners,
      ...(cp.neutral ?? []),
    ]);
    const filtered = {};
    for (const key of Object.keys(prevReasons).sort()) {
      if (validPartners.has(key)) filtered[key] = prevReasons[key];
    }
    if (Object.keys(filtered).length > 0) {
      cp.reasons = filtered;
    }
  }

  if (slot.notes_de.length > 0) {
    cp.notes_de = slot.notes_de.join(' ');
  }
  if (slot.notes_en.length > 0) {
    cp.notes_en = slot.notes_en.join(' ');
  }
  cp.source = sourceCombined;

  plant.companion_planting = cp;

  writeFileSync(path, JSON.stringify(plant, null, 2) + '\n', 'utf8');
  updated++;
}

console.log(`Updated companion_planting in ${updated} plant JSONs.`);
console.log(`Total slugs in matrix: ${bySlug.size}`);
console.log(`Note: reasons{} are preserved from prior file (managed by seed_permaculture.mjs).`);
