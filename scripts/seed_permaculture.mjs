#!/usr/bin/env node
// === 1. ZWECK ===
// Single source of truth for two permaculture-deep data fields on each Plant:
//   (a) permaculture_functions[]  — what role the plant plays in a bed
//   (b) companion_planting.reasons{} — short explanations per partner slug
//
// (Single-Source-of-Truth für die beiden Permakultur-Felder pro Pflanze:
//  permaculture_functions[] und companion_planting.reasons{}.)
//
// Bidirectional consistency for reasons is guaranteed by construction:
// every entry in REASONS is written into BOTH partner JSONs (with each
// side's own perspective string, if both provided).
//
// Idempotent — re-running replaces the two managed fields in each affected
// plant JSON. Plants not in any source-of-truth map keep their existing
// fields untouched.
//
// Run from project root:
//   node scripts/seed_permaculture.mjs
//
// Sources: paraphrased / adapted from Sepp Holzer, Bill Mollison,
// Toby Hemenway and classic German Mischkultur tradition.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLANTS_DIR = join(HERE, '..', 'src', 'data', 'plants');

// === 2. PFLANZEN-FUNKTIONEN ===
// Map: slug → permaculture_functions[]
// (Pro Pflanze: welche Permakultur-Rollen erfüllt sie.)
// Comments cite the lineage: H = Holzer, M = Mollison, He = Hemenway,
// CT = Classical tradition (Bauernregel / Three Sisters).
const FUNCTIONS = {
  // === 2a. Hülsenfrüchte — Stickstoff-Fixierer ===
  'phaseolus-vulgaris-nanus':   ['nitrogen_fixer', 'vertical_low', 'ground_cover'],            // H/CT
  'phaseolus-vulgaris-vulgaris':['nitrogen_fixer', 'vertical_high'],                            // CT (Stangenbohne)
  'pisum-sativum-sativum':      ['nitrogen_fixer', 'vertical_mid'],                             // CT
  'pisum-sativum-saccharatum':  ['nitrogen_fixer', 'vertical_mid'],                             // CT
  'trigonella-foenum-graecum':  ['nitrogen_fixer', 'medicinal', 'vertical_low'],                // M

  // === 2b. Allium-Familie — Schädlings-Abwehr ===
  'allium-sativum':             ['pest_repellent', 'aromatic_repellent', 'medicinal'],          // CT/He
  'allium-cepa':                ['pest_repellent', 'aromatic_repellent'],                       // CT
  'allium-porrum':              ['pest_repellent', 'vertical_mid'],                             // CT
  'allium-ursinum':             ['pest_repellent', 'medicinal', 'ground_cover'],                // He
  'allium-schoenoprasum':       ['pollinator_attractor', 'pest_repellent', 'aromatic_repellent','edible_flower','medicinal'], // CT (lila Blüten essbar, Aphiden-Abwehr)
  'nepeta-cataria':             ['pest_repellent', 'pollinator_attractor', 'aromatic_repellent','medicinal'], // He

  // === 2c. Kräuter — aromatische Abwehr + Bestäuber ===
  'ocimum-basilicum':           ['aromatic_repellent', 'pest_repellent'],                        // CT
  'ocimum-tenuiflorum':         ['aromatic_repellent', 'medicinal', 'pollinator_attractor'],     // He
  'origanum-vulgare':           ['aromatic_repellent', 'pollinator_attractor', 'medicinal'],     // H/CT
  'thymus-vulgaris':            ['aromatic_repellent', 'pollinator_attractor', 'ground_cover','medicinal'], // H
  'salvia-officinalis':         ['aromatic_repellent', 'pollinator_attractor', 'medicinal'],     // H
  'rosmarinus-officinalis':     ['aromatic_repellent', 'pollinator_attractor', 'medicinal','microclimate'], // H
  'lavandula-angustifolia':     ['pollinator_attractor', 'aromatic_repellent', 'medicinal'],     // H
  'mentha-piperita':            ['aromatic_repellent', 'pollinator_attractor', 'medicinal','ground_cover'], // He
  'mentha-spicata':             ['aromatic_repellent', 'pollinator_attractor', 'ground_cover'],  // He
  'mentha-villosa':             ['aromatic_repellent', 'pollinator_attractor', 'ground_cover'],  // He
  'melissa-officinalis':        ['pollinator_attractor', 'aromatic_repellent', 'medicinal'],     // H/CT
  'satureja-hortensis':         ['aromatic_repellent', 'pest_repellent', 'medicinal'],           // CT
  'hyssopus-officinalis':       ['pollinator_attractor', 'aromatic_repellent', 'medicinal'],     // M
  'laurus-nobilis':             ['aromatic_repellent', 'medicinal', 'vertical_high'],            // M
  'artemisia-dracunculus':      ['aromatic_repellent', 'medicinal'],                             // CT

  // === 2d. Apiaceae — Tiefwurzler + Nützlings-Magneten ===
  'anethum-graveolens':         ['pollinator_attractor', 'aromatic_repellent'],                  // CT
  'foeniculum-vulgare':         ['pollinator_attractor', 'medicinal', 'root_loosener'],          // CT (auch allelopathisch — siehe Reasons)
  'coriandrum-sativum':         ['pollinator_attractor', 'aromatic_repellent', 'medicinal'],     // He
  'carum-carvi':                ['pollinator_attractor', 'aromatic_repellent', 'root_loosener'], // CT
  'pimpinella-anisum':          ['pollinator_attractor', 'aromatic_repellent', 'medicinal'],     // M
  'petroselinum-crispum':       ['pollinator_attractor', 'medicinal'],                           // CT
  'petroselinum-crispum-tuberosum': ['root_loosener', 'pollinator_attractor'],                   // He
  'apium-graveolens':           ['pest_repellent', 'vertical_mid'],                              // CT
  'apium-graveolens-rapaceum':  ['pest_repellent', 'root_loosener'],                             // CT
  'levisticum-officinale':      ['pollinator_attractor', 'medicinal', 'vertical_high'],          // CT
  'daucus-carota-sativus':      ['root_loosener', 'vertical_low'],                               // CT
  'pastinaca-sativa':           ['root_loosener', 'vertical_low'],                               // CT

  // === 2e. Blüten — Insekten-Magneten + essbare Blüten ===
  'borago-officinalis':         ['pollinator_attractor', 'dynamic_accumulator', 'edible_flower'],// H
  'calendula-officinalis':      ['pollinator_attractor', 'pest_repellent', 'edible_flower','medicinal'], // CT
  'tagetes-patula':             ['pest_repellent', 'pollinator_attractor', 'edible_flower'],     // CT (Nematoden!)
  'tropaeolum-majus':           ['pest_repellent', 'ground_cover', 'edible_flower','pollinator_attractor'], // CT
  'matricaria-chamomilla':      ['pollinator_attractor', 'medicinal', 'dynamic_accumulator'],    // H ("Pflanzenarzt")
  'tanacetum-parthenium':       ['pest_repellent', 'pollinator_attractor', 'medicinal'],         // H
  'achillea-millefolium':       ['pollinator_attractor', 'dynamic_accumulator', 'medicinal'],    // H

  // === 2f. Solanaceae — mittlere Schicht, hungrige Pflanzen ===
  'solanum-lycopersicum':       ['vertical_mid', 'pollinator_attractor'],                        // CT
  'solanum-tuberosum':          ['vertical_low', 'root_loosener'],                               // CT
  'solanum-melongena':          ['vertical_mid', 'pollinator_attractor'],                        // M
  'capsicum-annuum':            ['vertical_mid'],                                                // CT
  'capsicum-chinense':          ['vertical_mid'],                                                // CT

  // === 2g. Cucurbitaceae — Bodendecker + Bestäuber ===
  'cucurbita-pepo':             ['ground_cover', 'pollinator_attractor', 'edible_flower'],       // CT (Three Sisters)
  'cucurbita-pepo-zucchini':    ['ground_cover', 'pollinator_attractor', 'edible_flower'],       // CT
  'cucumis-sativus':            ['ground_cover', 'pollinator_attractor'],                        // CT

  // === 2h. Mais ===
  'zea-mays':                   ['vertical_high', 'shade_provider', 'microclimate'],             // CT (Three Sisters)

  // === 2i. Brassicaceae — Blattgemüse, hungrig ===
  'brassica-oleracea-capitata-alba':  ['vertical_mid', 'ground_cover'],                          // CT
  'brassica-oleracea-capitata-rubra': ['vertical_mid', 'ground_cover'],                          // CT
  'brassica-oleracea-italica':        ['vertical_mid'],                                          // CT
  'brassica-oleracea-botrytis':       ['vertical_mid'],                                          // CT
  'brassica-oleracea-gemmifera':      ['vertical_high'],                                         // CT
  'brassica-oleracea-gongylodes':     ['vertical_low', 'root_loosener'],                         // CT
  'brassica-oleracea-sabauda':        ['vertical_mid', 'ground_cover'],                          // CT
  'eruca-sativa':                     ['vertical_low', 'pollinator_attractor'],                  // He
  'raphanus-sativus-sativus':         ['vertical_low', 'root_loosener'],                         // CT (Radieschen, schnell)
  'raphanus-sativus-niger':           ['vertical_low', 'root_loosener'],                         // CT (Winterrettich)

  // === 2j. Blattgemüse / Salate ===
  'lactuca-sativa-capitata':    ['vertical_low', 'ground_cover'],                                // CT
  'lactuca-sativa-crispa':      ['vertical_low', 'ground_cover'],                                // CT
  'spinacia-oleracea':          ['vertical_low', 'ground_cover'],                                // CT

  // === 2k. Rote Bete / Mangold ===
  'beta-vulgaris-conditiva':    ['vertical_low', 'root_loosener'],                               // CT
  'beta-vulgaris-cicla':        ['vertical_mid'],                                                // CT

  // === 2l. Erdbeere ===
  'fragaria-vesca':             ['ground_cover', 'pollinator_attractor', 'edible_flower'],       // H

  // === 2m. Beinwell / Brennnessel — dynamische Akkumulatoren (klassische Holzer-Pflanzen) ===
  'symphytum-officinale':       ['dynamic_accumulator', 'root_loosener', 'pollinator_attractor','medicinal'], // H (Mulch-Quelle, 1.5m Wurzel)
  'urtica-dioica':              ['dynamic_accumulator', 'pollinator_attractor', 'medicinal'],    // H (Jauche-Quelle)
  'rheum-rhabarbarum':          ['ground_cover', 'dynamic_accumulator', 'medicinal', 'shade_provider'], // H (große Blätter, mehrjährig)
};

// === 3. BEZIEHUNGS-BEGRÜNDUNGEN ===
// Format: [slugA, slugB, { de_a, en_a, de_b?, en_b? }]
// If only de_a/en_a are given, the same text is mirrored to the partner.
// If de_b/en_b are given, the partner gets its own perspective string.
// (Bidirektional gepflegt; gleiche Begründung wenn nur eine Perspektive
// angegeben, sonst zwei verschiedene Texte.)
const REASONS = [
  // === 3a. Klassische Allium-Allianzen ===
  ['daucus-carota-sativus', 'allium-cepa', {
    de_a: 'Zwiebel hält Möhrenfliege fern.',
    en_a: 'Onion deters carrot fly.',
    de_b: 'Karotte hält Zwiebelfliege fern.',
    en_b: 'Carrot deters onion fly.',
  }],
  ['daucus-carota-sativus', 'allium-porrum', {
    de_a: 'Lauch hält Möhrenfliege fern (gleicher Mechanismus wie Zwiebel).',
    en_a: 'Leek deters carrot fly (same mechanism as onion).',
    de_b: 'Karotte ist guter Lauch-Begleiter, kein Schädlings-Konflikt.',
    en_b: 'Carrot is a good leek companion with no pest conflict.',
  }],
  ['daucus-carota-sativus', 'allium-sativum', {
    de_a: 'Knoblauch hält Möhrenfliege und Pilze fern.',
    en_a: 'Garlic deters carrot fly and fungi.',
  }],
  ['daucus-carota-sativus', 'pisum-sativum-sativum', {
    de_a: 'Erbsen fixieren Stickstoff, den die Karotte zum Wachstum nutzt.',
    en_a: 'Peas fix nitrogen that carrots use to grow.',
    de_b: 'Karotte lockert den Boden für die Erbsen-Wurzel.',
    en_b: 'Carrot loosens soil for the pea root.',
  }],
  ['daucus-carota-sativus', 'rosmarinus-officinalis', {
    de_a: 'Rosmarin-Duft maskiert Karotten vor Möhrenfliege.',
    en_a: 'Rosemary scent masks carrots from carrot fly.',
  }],

  // === 3b. Three Sisters ===
  ['zea-mays', 'phaseolus-vulgaris-vulgaris', {
    de_a: 'Mais bietet Stangenbohne ein lebendes Klettergerüst.',
    en_a: 'Maize provides a living climbing frame for the pole bean.',
    de_b: 'Bohne fixiert Stickstoff aus der Luft, den hungriger Mais braucht.',
    en_b: 'Bean fixes atmospheric nitrogen that hungry maize needs.',
  }],
  ['zea-mays', 'cucurbita-pepo', {
    de_a: 'Kürbis beschattet den Mais-Boden und hält Feuchtigkeit.',
    en_a: 'Squash shades the maize bed and retains moisture.',
    de_b: 'Mais wirft Halbschatten für junge Kürbis-Blätter.',
    en_b: 'Maize casts partial shade for young squash leaves.',
  }],
  ['zea-mays', 'cucumis-sativus', {
    de_a: 'Mais dient als Klettergerüst für Gurke (Three-Sisters-Analogon).',
    en_a: 'Maize serves as climbing frame for cucumber (Three Sisters analogue).',
  }],
  ['zea-mays', 'tropaeolum-majus', {
    de_a: 'Kapuzinerkresse als Blattlaus-Köder schützt Mais.',
    en_a: 'Nasturtium as aphid trap protects maize.',
  }],
  ['phaseolus-vulgaris-vulgaris', 'cucurbita-pepo', {
    de_a: 'Bohne stickstoffreich, Kürbis nährstoffhungrig — perfekte Symbiose.',
    en_a: 'Bean is nitrogen-rich, squash is heavy feeder — perfect symbiosis.',
  }],
  ['phaseolus-vulgaris-nanus', 'zea-mays', {
    de_a: 'Buschbohne fixiert Stickstoff für den hungrigen Mais.',
    en_a: 'Bush bean fixes nitrogen for hungry maize.',
  }],
  ['phaseolus-vulgaris-nanus', 'cucurbita-pepo', {
    de_a: 'Buschbohne düngt mit Stickstoff, Kürbis beschattet Bohnen-Boden.',
    en_a: 'Bush bean fertilises with nitrogen, squash shades bean bed.',
  }],

  // === 3c. Tomate — klassischer Mischkultur-Star ===
  ['solanum-lycopersicum', 'ocimum-basilicum', {
    de_a: 'Basilikum vertreibt Weiße Fliege und verbessert Tomatenaroma.',
    en_a: 'Basil deters whitefly and improves tomato aroma.',
    de_b: 'Tomate spendet Basilikum Halbschatten in der Mittagshitze.',
    en_b: 'Tomato gives basil partial shade during midday heat.',
  }],
  ['solanum-lycopersicum', 'tagetes-patula', {
    de_a: 'Tagetes-Wurzeln vertreiben Nematoden im Tomatenbeet.',
    en_a: 'Marigold roots deter nematodes in the tomato bed.',
  }],
  ['solanum-lycopersicum', 'petroselinum-crispum', {
    de_a: 'Petersilie lockt Florfliegen, die Blattläuse fressen.',
    en_a: 'Parsley attracts lacewings that eat aphids.',
  }],
  ['solanum-lycopersicum', 'allium-sativum', {
    de_a: 'Knoblauch hält Spinnmilben und Tomaten-Pilze fern.',
    en_a: 'Garlic deters spider mites and tomato fungi.',
  }],
  ['solanum-lycopersicum', 'tropaeolum-majus', {
    de_a: 'Kapuzinerkresse zieht Blattläuse von der Tomate ab (Köderpflanze).',
    en_a: 'Nasturtium pulls aphids away from tomato (trap plant).',
  }],
  ['solanum-lycopersicum', 'calendula-officinalis', {
    de_a: 'Ringelblume lockt Nützlinge und vertreibt Nematoden.',
    en_a: 'Calendula attracts beneficials and deters nematodes.',
  }],
  ['solanum-lycopersicum', 'foeniculum-vulgare', {
    de_a: 'Fenchel hemmt Tomaten-Wachstum stark (allelopathisch).',
    en_a: 'Fennel strongly inhibits tomato growth (allelopathic).',
  }],
  ['solanum-lycopersicum', 'cucumis-sativus', {
    de_a: 'Tomate und Gurke teilen Pilzkrankheiten (Mehltau) — infizieren sich.',
    en_a: 'Tomato and cucumber share fungal disease (mildew) — cross-infection.',
  }],
  ['solanum-lycopersicum', 'solanum-tuberosum', {
    de_a: 'Beide Nachtschattengewächse — Kraut- und Knollenfäule überträgt sich.',
    en_a: 'Both Solanaceae — late blight transfers between them.',
  }],
  ['solanum-lycopersicum', 'brassica-oleracea-capitata-alba', {
    de_a: 'Tomate und Kohl konkurrieren stark um Stickstoff.',
    en_a: 'Tomato and cabbage compete heavily for nitrogen.',
  }],
  ['solanum-lycopersicum', 'apium-graveolens', {
    de_a: 'Sellerie-Duft maskiert Tomate vor Schädlingen.',
    en_a: 'Celery scent masks tomato from pests.',
  }],

  // === 3d. Kartoffel ===
  ['solanum-tuberosum', 'phaseolus-vulgaris-nanus', {
    de_a: 'Buschbohne hält Kartoffelkäfer fern (klassische Bauernregel).',
    en_a: 'Bush bean deters Colorado potato beetle (classic rule).',
  }],
  ['solanum-tuberosum', 'tagetes-patula', {
    de_a: 'Tagetes vertreibt Nematoden, die an Kartoffel-Knollen nagen.',
    en_a: 'Marigold deters nematodes that attack potato tubers.',
  }],
  ['solanum-tuberosum', 'spinacia-oleracea', {
    de_a: 'Spinat als Untersaat liefert Stickstoff und beschattet den Boden.',
    en_a: 'Spinach as undersowing provides nitrogen and shades soil.',
  }],
  ['solanum-tuberosum', 'cucurbita-pepo', {
    de_a: 'Beide stark zehrend — konkurrieren um Wasser und Nährstoffe.',
    en_a: 'Both heavy feeders — compete for water and nutrients.',
  }],

  // === 3e. Paprika / Aubergine ===
  ['capsicum-annuum', 'ocimum-basilicum', {
    de_a: 'Basilikum hält Schädlinge fern und verbessert Paprika-Aroma.',
    en_a: 'Basil deters pests and improves pepper aroma.',
  }],
  ['capsicum-annuum', 'tagetes-patula', {
    de_a: 'Tagetes vertreibt Nematoden und Blattläuse.',
    en_a: 'Marigold deters nematodes and aphids.',
  }],
  ['capsicum-annuum', 'allium-sativum', {
    de_a: 'Knoblauch hält Spinnmilben und Pilze fern.',
    en_a: 'Garlic deters spider mites and fungi.',
  }],
  ['solanum-melongena', 'phaseolus-vulgaris-nanus', {
    de_a: 'Buschbohne hält Kartoffelkäfer-Verwandte von Aubergine fern.',
    en_a: 'Bush bean deters Colorado-beetle relatives from eggplant.',
  }],
  ['solanum-melongena', 'ocimum-basilicum', {
    de_a: 'Basilikum schützt Aubergine vor Weißer Fliege.',
    en_a: 'Basil protects eggplant from whitefly.',
  }],

  // === 3f. Hülsenfrüchte ↔ Allium (BAD) ===
  ['phaseolus-vulgaris-vulgaris', 'allium-sativum', {
    de_a: 'Lauchgewächse hemmen Hülsenfrüchte (klassische Bauernregel).',
    en_a: 'Alliums inhibit legumes (classic rule).',
  }],
  ['phaseolus-vulgaris-nanus', 'allium-cepa', {
    de_a: 'Zwiebel und Bohne hemmen sich gegenseitig.',
    en_a: 'Onion and bean inhibit each other.',
  }],
  ['pisum-sativum-sativum', 'allium-cepa', {
    de_a: 'Erbse und Zwiebel sollten getrennt stehen — Wachstumshemmung.',
    en_a: 'Pea and onion should be separated — growth inhibition.',
  }],

  // === 3g. Hülsenfrüchte gute Allianzen ===
  ['phaseolus-vulgaris-nanus', 'satureja-hortensis', {
    de_a: 'Bohnenkraut stärkt Bohnen und hält Schwarze Bohnenlaus fern.',
    en_a: 'Savory strengthens beans and deters black bean aphid.',
  }],
  ['phaseolus-vulgaris-vulgaris', 'satureja-hortensis', {
    de_a: 'Bohnenkraut ist klassischer Bohnen-Partner gegen Läuse.',
    en_a: 'Savory is the classic bean partner against aphids.',
  }],
  ['phaseolus-vulgaris-nanus', 'apium-graveolens', {
    de_a: 'Klassische Mischkultur: Bohne düngt, Sellerie nutzt den Stickstoff.',
    en_a: 'Classic companions: bean fertilises, celery uses the nitrogen.',
  }],

  // === 3h. Allium gut zu Gemüse ===
  ['allium-sativum', 'fragaria-vesca', {
    de_a: 'Knoblauch vertreibt Erdbeer-Pilze (Grauschimmel).',
    en_a: 'Garlic deters strawberry fungi (grey mould).',
  }],
  ['allium-cepa', 'matricaria-chamomilla', {
    de_a: 'Kamille verstärkt Zwiebel-Aroma — alte Bauernregel.',
    en_a: 'Chamomile boosts onion aroma — old farming rule.',
  }],
  ['allium-porrum', 'apium-graveolens', {
    de_a: 'Lauch und Sellerie ergänzen sich nährstoff-mäßig perfekt.',
    en_a: 'Leek and celery complement each other nutritionally.',
  }],
  ['allium-porrum', 'fragaria-vesca', {
    de_a: 'Lauch hält Erdbeer-Schädlinge fern.',
    en_a: 'Leek deters strawberry pests.',
  }],

  // === 3i. Kohl-Familie ===
  ['brassica-oleracea-capitata-alba', 'apium-graveolens', {
    de_a: 'Sellerie hält Kohlweißling fern (klassische DACH-Bauernregel).',
    en_a: 'Celery deters cabbage white butterfly (classic DACH rule).',
  }],
  ['brassica-oleracea-italica', 'allium-cepa', {
    de_a: 'Zwiebel hält Kohlfliege fern.',
    en_a: 'Onion deters cabbage root fly.',
  }],
  ['brassica-oleracea-italica', 'thymus-vulgaris', {
    de_a: 'Thymian-Duft maskiert Brokkoli für Kohlweißling.',
    en_a: 'Thyme scent masks broccoli from cabbage white butterfly.',
  }],
  ['brassica-oleracea-capitata-alba', 'spinacia-oleracea', {
    de_a: 'Spinat-Wurzeln saponieren den Boden — Kohl wächst kräftiger.',
    en_a: 'Spinach roots produce saponins — cabbage grows stronger.',
  }],
  ['brassica-oleracea-capitata-alba', 'fragaria-vesca', {
    de_a: 'Kohl und Erdbeere konkurrieren stark um Nährstoffe und Wasser.',
    en_a: 'Cabbage and strawberry compete for nutrients and water.',
  }],

  // === 3j. Salat / Radieschen — schnelle Mischkultur ===
  ['lactuca-sativa-capitata', 'raphanus-sativus-sativus', {
    de_a: 'Klassiker: Radieschen schnellt, Salat langsam — perfekte Reihenkultur.',
    en_a: 'Classic: radishes fast, lettuce slow — perfect row companions.',
  }],
  ['lactuca-sativa-capitata', 'fragaria-vesca', {
    de_a: 'Salat als Bodendecker zwischen Erdbeer-Reihen.',
    en_a: 'Lettuce as ground cover between strawberry rows.',
  }],
  ['lactuca-sativa-capitata', 'petroselinum-crispum', {
    de_a: 'Petersilie und Salat hemmen sich (Wurzelausscheidungen).',
    en_a: 'Parsley and lettuce inhibit each other (root exudates).',
  }],

  // === 3k. Erdbeere ===
  ['fragaria-vesca', 'borago-officinalis', {
    de_a: 'Borretsch zieht Bestäuber zu Erdbeer-Blüten und stärkt die Pflanze.',
    en_a: 'Borage attracts pollinators to strawberry blossoms and strengthens the plant.',
  }],
  ['fragaria-vesca', 'spinacia-oleracea', {
    de_a: 'Spinat liefert Stickstoff für Erdbeer-Wachstum.',
    en_a: 'Spinach provides nitrogen for strawberry growth.',
  }],
  ['fragaria-vesca', 'matricaria-chamomilla', {
    de_a: 'Kamille stärkt Erdbeere und hält Pilze fern (Holzer-Lieblings-Allianz).',
    en_a: 'Chamomile strengthens strawberry and deters fungi (Holzer favourite).',
  }],
  ['fragaria-vesca', 'tagetes-patula', {
    de_a: 'Tagetes vertreibt Wurzelnematoden bei Erdbeeren.',
    en_a: 'Marigold deters root nematodes around strawberries.',
  }],
  ['fragaria-vesca', 'thymus-vulgaris', {
    de_a: 'Thymian als Bodendecker hält Schnecken fern.',
    en_a: 'Thyme as ground cover deters slugs.',
  }],

  // === 3l. Gurke ===
  ['cucumis-sativus', 'anethum-graveolens', {
    de_a: 'Klassiker: Dill mit Gurken-Einlegen — auch im Beet beste Nachbarn.',
    en_a: 'Classic: dill with pickled cucumbers — also best bed partners.',
  }],
  ['cucumis-sativus', 'tropaeolum-majus', {
    de_a: 'Kapuzinerkresse hält Gurken-Schädlinge fern.',
    en_a: 'Nasturtium deters cucumber pests.',
  }],
  ['cucumis-sativus', 'calendula-officinalis', {
    de_a: 'Ringelblume vertreibt Nematoden und lockt Nützlinge.',
    en_a: 'Calendula deters nematodes and attracts beneficials.',
  }],
  ['cucumis-sativus', 'allium-cepa', {
    de_a: 'Zwiebel hält Mehltau-Sporen von Gurken fern.',
    en_a: 'Onion deters mildew spores from cucumbers.',
  }],

  // === 3m. Zucchini ===
  ['cucurbita-pepo-zucchini', 'borago-officinalis', {
    de_a: 'Borretsch lockt Bestäuber zu Zucchini-Blüten — mehr Früchte.',
    en_a: 'Borage attracts pollinators to zucchini flowers — more fruits.',
  }],
  ['cucurbita-pepo-zucchini', 'tropaeolum-majus', {
    de_a: 'Kapuzinerkresse hält Kürbiskäfer fern.',
    en_a: 'Nasturtium deters squash beetles.',
  }],
  ['cucurbita-pepo-zucchini', 'solanum-tuberosum', {
    de_a: 'Beide stark zehrend — Wasser- und Nährstoff-Konkurrenz.',
    en_a: 'Both heavy feeders — water and nutrient competition.',
  }],

  // === 3n. Kürbis ===
  ['cucurbita-pepo', 'tropaeolum-majus', {
    de_a: 'Kapuzinerkresse hält Blattläuse und Kürbiskäfer fern.',
    en_a: 'Nasturtium deters aphids and squash beetles.',
  }],
  ['cucurbita-pepo', 'borago-officinalis', {
    de_a: 'Borretsch zieht Bestäuber zu Kürbis-Blüten.',
    en_a: 'Borage attracts pollinators to squash flowers.',
  }],
  ['cucurbita-pepo', 'thymus-vulgaris', {
    de_a: 'Thymian hält Kürbis-Schädlinge fern.',
    en_a: 'Thyme deters squash pests.',
  }],
  ['cucurbita-pepo', 'matricaria-chamomilla', {
    de_a: 'Kamille stärkt Kürbis-Wachstum (klassische Mischkultur).',
    en_a: 'Chamomile strengthens squash growth (classic companion).',
  }],

  // === 3o. Spinat ===
  ['spinacia-oleracea', 'fragaria-vesca', {
    de_a: 'Spinat als Bodendecker liefert Stickstoff für Erdbeer-Wurzeln.',
    en_a: 'Spinach as ground cover provides nitrogen for strawberry roots.',
  }],

  // === 3p. Kräuter-Allianzen ===
  ['ocimum-basilicum', 'allium-sativum', {
    de_a: 'Basilikum unterstützt Knoblauch-Wachstum.',
    en_a: 'Basil supports garlic growth.',
    de_b: 'Knoblauch schützt Basilikum vor Pilzen.',
    en_b: 'Garlic protects basil from fungi.',
  }],
  ['ocimum-basilicum', 'salvia-officinalis', {
    de_a: 'Salbei hemmt Basilikum durch ätherische Öle.',
    en_a: 'Sage essential oils inhibit basil.',
  }],
  ['ocimum-basilicum', 'rosmarinus-officinalis', {
    de_a: 'Rosmarin mag trocken, Basilikum feucht — Wasser-Konflikt.',
    en_a: 'Rosemary likes dry, basil likes moist — water conflict.',
  }],
  ['ocimum-basilicum', 'mentha-piperita', {
    de_a: 'Minze überwuchert Basilikum und konkurriert um Wasser.',
    en_a: 'Mint overgrows basil and competes for water.',
  }],
  ['lavandula-angustifolia', 'mentha-piperita', {
    de_a: 'Minze braucht feuchten Boden, Lavendel trockenen.',
    en_a: 'Mint needs moist soil, lavender needs dry.',
  }],
  ['rosmarinus-officinalis', 'thymus-vulgaris', {
    de_a: 'Beide mediterran-trocken-tolerant — perfekte Kräuter-Allianz.',
    en_a: 'Both Mediterranean and drought-tolerant — perfect herb pairing.',
  }],
  ['rosmarinus-officinalis', 'salvia-officinalis', {
    de_a: 'Mediterrane Trocken-Allianz — gleiche Bedürfnisse.',
    en_a: 'Mediterranean dry alliance — same needs.',
  }],
  ['salvia-officinalis', 'thymus-vulgaris', {
    de_a: 'Beide aromatisch und trockenheits-tolerant — Kräuter-Spirale-Klassiker.',
    en_a: 'Both aromatic and drought-tolerant — herb-spiral classic.',
  }],
  ['origanum-vulgare', 'thymus-vulgaris', {
    de_a: 'Beide aromatisch und insekten-freundlich — ideale Nachbarn.',
    en_a: 'Both aromatic and bee-friendly — ideal neighbours.',
  }],
  ['lavandula-angustifolia', 'rosmarinus-officinalis', {
    de_a: 'Mediterrane Trocken-Profis — Lavendel zieht Bienen, Rosmarin schützt.',
    en_a: 'Mediterranean dry specialists — lavender draws bees, rosemary protects.',
  }],

  // === 3q. Fenchel — fast überall problematisch ===
  ['foeniculum-vulgare', 'anethum-graveolens', {
    de_a: 'Fenchel und Dill kreuzen sich genetisch und konkurrieren.',
    en_a: 'Fennel and dill cross-pollinate and compete.',
  }],
  ['foeniculum-vulgare', 'coriandrum-sativum', {
    de_a: 'Fenchel hemmt Koriander-Keimung (Apiaceae-Konflikt).',
    en_a: 'Fennel inhibits coriander germination (Apiaceae conflict).',
  }],
  ['foeniculum-vulgare', 'tropaeolum-majus', {
    de_a: 'Fenchel ist stark allelopathisch und hemmt fast alle Nachbarn.',
    en_a: 'Fennel is strongly allelopathic and inhibits nearly all neighbours.',
  }],

  // === 3r. Borretsch — Universal-Magnet ===
  ['borago-officinalis', 'matricaria-chamomilla', {
    de_a: 'Beide Bestäuber-Magneten — verstärken Insekten-Anflug.',
    en_a: 'Both pollinator magnets — boost insect activity.',
  }],
  ['borago-officinalis', 'calendula-officinalis', {
    de_a: 'Ringelblume und Borretsch — der Insekten-Doppel-Magnet.',
    en_a: 'Calendula and borage — the dual insect magnet.',
  }],

  // === 3s. Kamille — "Pflanzenarzt" ===
  ['matricaria-chamomilla', 'allium-sativum', {
    de_a: 'Kamille stärkt Knoblauch und hält Wurzelpilze fern.',
    en_a: 'Chamomile strengthens garlic and deters root fungi.',
  }],
  ['matricaria-chamomilla', 'mentha-piperita', {
    de_a: 'Kamille verstärkt Minz-Aroma — Holzer-Lieblingspaar.',
    en_a: 'Chamomile enhances mint aroma — Holzer favourite pair.',
  }],

  // === 3t. Beinwell / Brennnessel — Holzer-Klassiker ===
  ['symphytum-officinale', 'fragaria-vesca', {
    de_a: 'Beinwell-Mulch (Wurzel zieht aus 1.5m Tiefe) düngt Erdbeere kostenlos.',
    en_a: 'Comfrey mulch (root mines 1.5m deep) fertilises strawberry for free.',
  }],
  ['urtica-dioica', 'matricaria-chamomilla', {
    de_a: 'Brennnessel-Jauche stärkt Kamille und viele andere Kräuter.',
    en_a: 'Nettle slurry strengthens chamomile and many other herbs.',
  }],

  // === 3u. Tagetes / Kapuzinerkresse — Universal-Schädlings-Schreck ===
  ['tagetes-patula', 'tropaeolum-majus', {
    de_a: 'Beide vertreiben Bodenschädlinge und sind essbar.',
    en_a: 'Both deter soil pests and are edible.',
  }],
  ['tagetes-patula', 'allium-cepa', {
    de_a: 'Tagetes hält Zwiebelfliege fern.',
    en_a: 'Marigold deters onion fly.',
  }],

  // === 3v. Mediterrane Kräuter-Spirale ===
  ['thymus-vulgaris', 'cucurbita-pepo', {
    de_a: 'Thymian hält Kohlweißling und Kürbis-Schädlinge fern.',
    en_a: 'Thyme deters cabbage white and squash pests.',
  }],

  // === 3w. Knoblauch + Tomate (klassisch) ===
  ['allium-sativum', 'solanum-lycopersicum', {
    de_a: 'Klassiker: Knoblauch in jedem Tomatenbeet — hält Mehltau fern.',
    en_a: 'Classic: garlic in every tomato bed — deters mildew.',
  }],

  // === 3x. WELLE F — Schnittlauch (Allium schoenoprasum) ===
  // Allium-Familie: gut zu Möhre/Salat/Erdbeere, schlecht zu Hülsenfrüchten.
  ['allium-schoenoprasum', 'daucus-carota-sativus', {
    de_a: 'Schnittlauch hält Möhrenfliege fern — klassische Allium-Mischkultur.',
    en_a: 'Chives deter carrot fly — classic Allium companion pairing.',
  }],
  ['allium-schoenoprasum', 'lactuca-sativa-capitata', {
    de_a: 'Schnittlauch lockert Aphiden ab und hält Salat-Schädlinge fern.',
    en_a: 'Chives distract aphids and keep lettuce pests away.',
  }],
  ['allium-schoenoprasum', 'fragaria-vesca', {
    de_a: 'Schnittlauch schützt Erdbeere vor Pilzen (Grauschimmel).',
    en_a: 'Chives protect strawberry from fungi (grey mould).',
  }],
  ['allium-schoenoprasum', 'allium-cepa', {
    de_a: 'Beide Allium-Familie, vertragen sich problemlos.',
    en_a: 'Both Allium family, coexist without issue.',
  }],
  ['allium-schoenoprasum', 'solanum-lycopersicum', {
    de_a: 'Schnittlauch hält Aphiden von Tomaten fern und lockt Bienen für Bestäubung.',
    en_a: 'Chives deter aphids from tomatoes and attract bees for pollination.',
  }],
  ['allium-schoenoprasum', 'phaseolus-vulgaris-vulgaris', {
    de_a: 'Allium hemmt Stickstoff-fixierende Hülsenfrüchte (klassische Bauernregel).',
    en_a: 'Alliums inhibit nitrogen-fixing legumes (classic rule).',
  }],
  ['allium-schoenoprasum', 'pisum-sativum-sativum', {
    de_a: 'Allium hemmt Erbsen-Wachstum — räumlich trennen.',
    en_a: 'Alliums inhibit pea growth — separate spatially.',
  }],

  // === 3y. WELLE F — Rhabarber (Rheum rhabarbarum) ===
  // Tiefwurzler mit großen Blättern: gut zu Kohl/Knoblauch/Salat, schlecht zu Möhre.
  ['rheum-rhabarbarum', 'brassica-oleracea-capitata-alba', {
    de_a: 'Rhabarber-Blätter beschatten den Boden, Kohl profitiert von der Feuchte.',
    en_a: 'Rhubarb leaves shade the soil, cabbage benefits from the retained moisture.',
  }],
  ['rheum-rhabarbarum', 'brassica-oleracea-capitata-rubra', {
    de_a: 'Rhabarber-Blätter beschatten den Boden — auch Rotkohl mag das.',
    en_a: 'Rhubarb leaves shade the soil — red cabbage likes it too.',
  }],
  ['rheum-rhabarbarum', 'allium-sativum', {
    de_a: 'Knoblauch hält Rhabarber-Schädlinge und Wurzelpilze fern.',
    en_a: 'Garlic deters rhubarb pests and root fungi.',
  }],
  ['rheum-rhabarbarum', 'lactuca-sativa-capitata', {
    de_a: 'Salat als Bodendecker unter den großen Rhabarber-Blättern.',
    en_a: 'Lettuce as ground cover beneath the large rhubarb leaves.',
  }],
  ['rheum-rhabarbarum', 'daucus-carota-sativus', {
    de_a: 'Beide Tiefwurzler — konkurrieren um den gleichen Wurzelraum.',
    en_a: 'Both deep-rooting — compete for the same root space.',
  }],
];

// === 4. APPLY-LOGIK ===
// Build per-slug data structures:
//   funcsBySlug: slug → string[]
//   reasonsBySlug: slug → Record<slug, {de, en}>
const funcsBySlug = new Map(Object.entries(FUNCTIONS));

const reasonsBySlug = new Map();
function ensureReasonSlot(slug) {
  if (!reasonsBySlug.has(slug)) reasonsBySlug.set(slug, {});
  return reasonsBySlug.get(slug);
}

for (const [a, b, payload] of REASONS) {
  if (a === b) throw new Error(`Self-reason forbidden: ${a}`);
  const { de_a, en_a, de_b, en_b } = payload;
  if (!de_a || !en_a) throw new Error(`Reason missing de_a/en_a for ${a}↔${b}`);

  const slotA = ensureReasonSlot(a);
  const slotB = ensureReasonSlot(b);

  // A's perspective on B
  slotA[b] = { de: de_a, en: en_a };
  // B's perspective on A — use de_b/en_b if given, else mirror de_a/en_a
  slotB[a] = {
    de: de_b ?? de_a,
    en: en_b ?? en_a,
  };
}

// === 5. APPLY auf Pflanzen-JSONs ===
let updatedFuncs = 0;
let updatedReasons = 0;
let totalReasonEntries = 0;
const knownSlugs = new Set();

const files = readdirSync(PLANTS_DIR).filter(f => f.endsWith('.json'));

for (const file of files) {
  const path = join(PLANTS_DIR, file);
  const raw = readFileSync(path, 'utf8');
  const plant = JSON.parse(raw);
  knownSlugs.add(plant.slug);

  let changed = false;

  // (a) permaculture_functions
  if (funcsBySlug.has(plant.slug)) {
    const funcs = funcsBySlug.get(plant.slug);
    // Stable, deduplicated, defined order preserved
    const seen = new Set();
    const dedup = [];
    for (const f of funcs) {
      if (!seen.has(f)) { seen.add(f); dedup.push(f); }
    }
    plant.permaculture_functions = dedup;
    updatedFuncs++;
    changed = true;
  }

  // (b) reasons inside companion_planting (only if companion_planting exists)
  if (reasonsBySlug.has(plant.slug) && plant.companion_planting) {
    const reasons = reasonsBySlug.get(plant.slug);
    const cp = plant.companion_planting;
    // Filter reasons to only those whose partner is in good/bad/neutral
    // (so the schema stays internally consistent).
    const validPartners = new Set([
      ...(cp.good_partners ?? []),
      ...(cp.bad_partners ?? []),
      ...(cp.neutral ?? []),
    ]);
    const filtered = {};
    for (const [partner, text] of Object.entries(reasons)) {
      if (validPartners.has(partner)) filtered[partner] = text;
    }
    if (Object.keys(filtered).length > 0) {
      // Sort keys for stable diff
      const sorted = {};
      for (const key of Object.keys(filtered).sort()) {
        sorted[key] = filtered[key];
      }
      cp.reasons = sorted;
      updatedReasons++;
      totalReasonEntries += Object.keys(sorted).length;
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(path, JSON.stringify(plant, null, 2) + '\n', 'utf8');
  }
}

// === 6. REPORT ===
console.log(`Permaculture functions written to ${updatedFuncs} plant JSONs.`);
console.log(`Reasons written to ${updatedReasons} plant JSONs (${totalReasonEntries} reason entries total).`);

// Warn about FUNCTIONS slugs that don't exist on disk
const missingFuncSlugs = [...funcsBySlug.keys()].filter(s => !knownSlugs.has(s));
if (missingFuncSlugs.length > 0) {
  console.warn(`WARN: ${missingFuncSlugs.length} FUNCTIONS slugs not found on disk:`);
  for (const s of missingFuncSlugs) console.warn(`  - ${s}`);
}

// Warn about REASONS slugs that don't exist on disk
const reasonSlugs = new Set(REASONS.flatMap(([a, b]) => [a, b]));
const missingReasonSlugs = [...reasonSlugs].filter(s => !knownSlugs.has(s));
if (missingReasonSlugs.length > 0) {
  console.warn(`WARN: ${missingReasonSlugs.length} REASONS slugs not found on disk:`);
  for (const s of missingReasonSlugs) console.warn(`  - ${s}`);
}
