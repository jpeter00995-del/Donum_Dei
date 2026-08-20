# Active Task

**Task:** Weg C — duenne Pflanzeneintraege ausbauen
**Started:** 2026-08-20 (Sitzung 35)
**Status:** Schritt 1 + 2 fertig und live. Naechstes: AdSense-Neuantrag durch Maikel.

## Maikels Entscheidung (2026-08-20)

Weg **C** gewaehlt: erst die duennen Pflanzeneintraege ausbauen, dann den
AdSense-Antrag neu stellen. Keine Domain kaufen, kein Sofort-Antrag.
Veroeffentlicht wird gesammelt, wenn alle Arten fertig sind.

## Schritt 1 — die eigentliche Ursache (erledigt, live)

`src/components/PlantTabs.tsx` rendert eine React-Insel und hat bisher **nur
das aktive Panel** erzeugt. Im ausgelieferten HTML standen damit auf **allen
594 Pflanzenseiten** nur Beschreibung und Anwendung. Sicherheit, Sammeln,
Wirkstoffe und Quellen waren fuer Crawler unsichtbar.

Behoben: alle Panels serverseitig, die inaktiven mit `hidden`. Fuer Nutzer
unveraendert — weiterhin genau ein Panel sichtbar.

```
Pflanzenseiten unter 1500 Zeichen:   22  ->   0
Site-Seiten unter 1500 Zeichen:      40  ->  18
duennste Pflanzenseite:            1144  -> 2081
```

Commit `7b77c29`, deployed und am Produktions-Alias geprueft (5 Panels).

## Schritt 2 — Inhalte der 12 Arten (erledigt)

Muster je Art:
- `description` um Botanik, Herkunft, Verarbeitung erweitert
- eine dritte belegte `uses`-Position
- `safety` ausgebaut: pregnancy / lactation / children / drug_interactions /
  contraindications — groesster Textgewinn und der nuetzlichste Teil
- `constituents` aufgeschluesselt statt Sammelbegriff
- `harvest[]` mit Erntezeitpunkt, Trocknung, Lagerung

```
Art                       DE vor  DE neu  EN vor  EN neu
elettaria-cardamomum        1249    6592    1144    6135
piper-nigrum                1336    6368    1250    5966
moringa-oleifera            1308    6844    1193    6355
hibiscus-sabdariffa         1317    6251    1219    5921
eucalyptus-globulus         1382    6824    1256    6419
camellia-sinensis           1399    7390    1264    6781
panax-ginseng               1506    6412    1379    5944
artemisia-absinthium        1587    7174    1482    6864
boletus-edulis              1430    5696    1338    5428
pleurotus-ostreatus         1462    5928    1373    5643
trametes-versicolor         1497    6514    1343    6032
cordyceps-militaris         1427    5943    1288    5632
```

Neu aufgenommene Quellen: LactMed (NIH-Stillzeit-Datenbank) fuer Kardamom,
Pfeffer und Moringa; Bundesamt fuer Strahlenschutz fuer den Steinpilz
(Cs-137 in Wildpilzen).

**Sachliche Korrektur nebenbei:** Beim Wermut standen zwei Anwendungen auf
`evidence_level: ema_well_established`. Die EMA fuehrt Absinthii herba aber
als **traditional use**, nicht als well-established. Auf `traditional`
korrigiert und die EMA-Angaben ergaenzt (nur Erwachsene, hoechstens zwei
Wochen, Gegenanzeigen Gallenwege/Leber/Korbbluetler).

## Schritt 3 — jetzt dran: AdSense-Neuantrag

Den kann der Agent **nicht** stellen: `adsense.google.com` ist fuer die
Browser-Werkzeuge gesperrt (getestet 2026-08-10). Maikel klickt selbst:
Menue **Websites** → **donum-dei.pages.dev** → **Ueberpruefung beantragen**.

Im Konto aendert sich bis dahin nichts von allein — nach einer Ablehnung
bleibt derselbe Textbaustein stehen, bis eine neue Pruefung beantragt wird.

## Was danach offen bleibt

Die Seite ist weiterhin **von keiner Suchmaschine indexiert**
(`site:donum-dei.pages.dev` → 0 Treffer bei Google, Stand 2026-08-20).
Das ist der eigentliche Nachteil, und Text allein loest ihn nicht. Weg A
(eigene Domain `donum-dei.de`, in Sitzung 33 als frei geprueft) plus erste
Verweise von aussen bleibt der staerkste Hebel — bewusst zurueckgestellt.

Ausserdem weiterhin duenn, aber bewusst nicht angefasst: die
Werkzeug-Seiten `/de/suche/`, `/de/quiz/`, `/de/mein-garten/start/` und die
Sprachweichen `/es/`, `/fr/`, `/bg/`. Suche und Garten-Planer-Start stehen
schon auf `noindex`; die Sprachweichen sind reine Weiterleitungsseiten.
