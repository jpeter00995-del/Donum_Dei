# Active Task

**Task:** Weg C — duenne Pflanzeneintraege ausbauen
**Started:** 2026-08-20 (Sitzung 35)
**Status:** IN_PROGRESS — Schritt 1 erledigt und gemessen, NICHT veroeffentlicht

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

**Offen: Commit + Deploy.** Die Aenderung ist gebaut, aber noch nicht
veroeffentlicht — Maikel gibt frei.

## Schritt 2 — Inhalte der 11 Arten (noch offen)

Auch nach Schritt 1 die textaermsten Arten. Ausbau braucht Recherche mit
Quellenpflicht (keine Wikipedia-Uebernahme, kein Heilversprechen):

Kardamom, Schwarzer Pfeffer, Moringa, Roselle, Eukalyptus, Teestrauch,
Ginseng, Wermut, Steinpilz, Austern-Seitling, Schmetterlingstramete,
Puppen-Kernkeule.

## Schritt 3 — danach

AdSense-Neuantrag. Den kann der Agent **nicht** stellen:
`adsense.google.com` ist fuer die Browser-Werkzeuge gesperrt (getestet
2026-08-10). Maikel klickt selbst: Menue **Websites** →
**donum-dei.pages.dev** → **Ueberpruefung beantragen**.
