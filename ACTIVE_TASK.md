# Active Task

**Task:** AdSense — dritter Antrag laeuft
**Started:** 2026-08-20 (Sitzung 35)
**Status:** WARTET AUF GOOGLE — seit zwei Tagen ohne Antwort

## Stand

Maikel hat am **2026-08-20** die erneute Ueberpruefung beantragt. Antwort
dauert erfahrungsgemaess ein paar Tage bis rund zwei Wochen. Im Konto aendert
sich bis dahin nichts von allein.

In Sitzung 36 (2026-08-22) wurde auf Maikels Auftrag hin waehrend der
Wartezeit weitergearbeitet — drei Wellen, siehe SESSION_STATE § 3. Das greift
nicht in den laufenden Antrag ein: es aendert nur, was Google beim naechsten
Crawl vorfindet, und zwar zum Besseren.

## Maikels Festlegung (2026-08-20)

Eigene Domain (`donum-dei.de`, in Sitzung 33 als frei geprueft) bleibt
**zurueckgestellt**. Erst diesen Weg zu Ende gehen: wenn es nach **zwei bis
drei weiteren Versuchen** nicht klappt, wird ueber die Domain neu gesprochen.
Nicht von sich aus wieder vorschlagen.

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

Technisch steht dem nichts im Weg — am 2026-08-22 live nachgeprueft:
`robots.txt` erlaubt alles ausser `/pagefind/`, die Sitemap liefert 696 URLs,
und die Antwort-Header tragen kein `X-Robots-Tag`. Es fehlt schlicht an
Verweisen von aussen: **bisher kein einziger Backlink.** Das ist der naechste
echte Hebel, unabhaengig von AdSense.

Weiterhin duenn, aber bewusst nicht angefasst: `/de/suche/`, `/de/quiz/`,
`/de/mein-garten/start/` (Suche und Garten-Planer-Start stehen schon auf
`noindex`) und die Sprachweichen `/es/`, `/fr/`, `/bg/` — reine
Weiterleitungsseiten.
