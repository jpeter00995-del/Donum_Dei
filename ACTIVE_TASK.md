# Active Task

**Task:** Weg C — duenne Pflanzeneintraege ausbauen
**Started:** 2026-08-20 (Sitzung 35)
**Status:** IN_PROGRESS — Schritt 1 live, Schritt 2 bei 3 von 11 Arten

## Maikels Entscheidung (2026-08-20)

Weg **C** gewaehlt: erst die duennen Pflanzeneintraege ausbauen, dann den
AdSense-Antrag neu stellen. Keine Domain kaufen, kein Sofort-Antrag.

## Schritt 1 — die eigentliche Ursache (erledigt)

Die Tab-Leiste auf jeder Pflanzenseite (`src/components/PlantTabs.tsx`)
rendert eine React-Insel. Sie hat bisher **nur das aktive Panel** erzeugt.
Im ausgelieferten HTML standen damit auf **allen 594 Pflanzenseiten** nur
Beschreibung und Anwendung. Sicherheit, Sammeln, Wirkstoffe und Quellen
waren fuer Google unsichtbar — sie entstehen erst beim Klick im Browser.

Behoben: alle Panels werden serverseitig gerendert, die inaktiven tragen
`hidden`. Fuer Nutzer aendert sich nichts (weiterhin genau ein Panel
sichtbar), fuer Crawler kommt der volle Text dazu.

Gemessen mit `scripts/textmenge.py` (gleicher Build, nur diese Aenderung):

```
Pflanzenseiten unter 1500 Zeichen:   22  ->   0
Seiten der ganzen Site unter 1500:   40  ->  18
duennste Pflanzenseite:            1144  -> 2081  (/en/plant/elettaria-cardamomum/)
Tests:                              376 passed
```

Im Browser geprueft (lokale Vorschau, `/de/plant/elettaria-cardamomum/`):
5 Panels im HTML, genau 1 sichtbar, Klick auf „Sicherheit" schaltet um,
keine Konsolenfehler.

Freigabe von Maikel am 2026-08-20, committet als `7b77c29`, gepusht und mit
`wrangler` veroeffentlicht. Live nachgeprueft: der Produktions-Alias liefert
5 Panels je Pflanzenseite (vorher 1).

## Schritt 2 — Inhalte der 11 Arten (3 erledigt, 8 offen)

Ausbau mit Quellenpflicht: keine Wikipedia-Uebernahme, kein Heilversprechen,
jede neue Aussage haengt an einer Quelle in `sources[]`.

Muster je Art (so bei den ersten drei gemacht):
- `description` um Botanik, Herkunft, Verarbeitung erweitern
- eine dritte `uses`-Position, wo es belegbar ist
- `safety` ausbauen: pregnancy / lactation / children / drug_interactions /
  contraindications — das ist der groesste Textgewinn und der nuetzlichste
- `constituents` aufschluesseln statt Sammelbegriff
- `harvest[]` ergaenzen: Erntezeitpunkt, Trocknung, Lagerung

Gemessen (sichtbarer Text je Seite):

```
Art                       DE vorher  DE jetzt  EN vorher  EN jetzt
elettaria-cardamomum           1249      6592       1144      6135
piper-nigrum                   1336      6368       1250      5966
moringa-oleifera               1308      6844       1193      6355
```

Neue Quelle in allen dreien: LactMed (NIH-Stillzeit-Datenbank) — belastbar
und fuer Nutzerinnen wirklich relevant.

**Noch offen (8):** Roselle, Eukalyptus, Teestrauch, Ginseng, Wermut,
Steinpilz, Austern-Seitling, Schmetterlingstramete, Puppen-Kernkeule.
(Der Eukalyptus-Eintrag hat bereits EMA-Monographien als Quelle, die Pilze
haben ueberwiegend Wikipedia — dort ist die Quellenlage duenner.)

## Schritt 3 — danach

AdSense-Neuantrag. Den kann der Agent **nicht** stellen:
`adsense.google.com` ist fuer die Browser-Werkzeuge gesperrt (getestet
2026-08-10). Maikel klickt selbst: Menue **Websites** →
**donum-dei.pages.dev** → **Ueberpruefung beantragen**.
