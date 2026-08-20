# Active Task

**Task:** AdSense — dritter Antrag laeuft
**Started:** 2026-08-20 (Sitzung 35)
**Status:** WARTET AUF GOOGLE — nichts zu tun, bis die Antwort da ist

## Stand

Maikel hat am **2026-08-20** die erneute Ueberpruefung beantragt, nachdem
Weg C abgeschlossen und veroeffentlicht war. Antwort dauert erfahrungsgemaess
ein paar Tage bis rund zwei Wochen. Im Konto aendert sich bis dahin nichts
von allein.

## Maikels Festlegung (2026-08-20)

Eigene Domain (`donum-dei.de`, in Sitzung 33 als frei geprueft) bleibt
**zurueckgestellt**. Erst diesen Weg zu Ende gehen: wenn es nach **zwei bis
drei weiteren Versuchen** nicht klappt, wird ueber die Domain neu gesprochen.
Nicht von sich aus wieder vorschlagen.

## Was in Sitzung 35 gemacht wurde (fertig, live)

**Schritt 1 — die eigentliche Ursache.** `src/components/PlantTabs.tsx`
rendert eine React-Insel und erzeugte bisher nur das aktive Panel. Im
ausgelieferten HTML standen damit auf allen 594 Pflanzenseiten nur
Beschreibung und Anwendung; Sicherheit, Sammeln, Wirkstoffe und Quellen waren
fuer Crawler unsichtbar. Jetzt werden alle Panels serverseitig gerendert, die
inaktiven mit `hidden`. Fuer Nutzer unveraendert. Commit `7b77c29`.

**Schritt 2 — zwoelf textarme Arten ausgebaut.** Commits `dc09d98` (Kardamom,
Pfeffer, Moringa) und `d2ad9e7` (die uebrigen neun).

```
Pflanzen-Detailseiten  Median  4574 -> 9352   Minimum  1144 -> 2505
Site-Seiten unter 1500 Zeichen:   40 ->   18
validate:zod 297/297 · scan_descriptions ok · 376 Tests gruen
```

Deployed und am Produktions-Alias geprueft (5 Panels je Pflanzenseite,
neuer Text live).

## Wenn die Antwort kommt

**Ablehnung mit demselben Baustein** — dann ist es nicht der Text. Zaehlen,
der wievielte Versuch das war, und nach zwei bis drei Runden die Domainfrage
wieder aufmachen (siehe oben, Maikels Festlegung).

**Ablehnung mit neuem Wortlaut** — den Wortlaut ernst nehmen, er ist die
erste konkrete Information seit drei Antraegen.

**Freigabe** — Anzeigen-Einrichtung pruefen: `ads.txt` liegt bereits mit
`pub-5000356216672097`, das AdSense-Script ist im Layout eingebunden.

## Was ehrlich offen bleibt

Die Seite ist von **keiner** Suchmaschine indexiert
(`site:donum-dei.pages.dev` → 0 Treffer bei Google, geprueft 2026-08-20).
Das bleibt der eigentliche Nachteil, und Textmenge loest ihn nicht.

Weiterhin duenn, aber bewusst nicht angefasst: `/de/suche/`, `/de/quiz/`,
`/de/mein-garten/start/` (Suche und Garten-Planer-Start stehen schon auf
`noindex`) und die Sprachweichen `/es/`, `/fr/`, `/bg/` — reine
Weiterleitungsseiten.
