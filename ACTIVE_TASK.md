# Active Task

**Task:** AdSense — zweite Ablehnung aufgearbeitet, Entscheidung offen
**Started:** 2026-08-20
**Status:** WARTET AUF MAIKELS ENTSCHEIDUNG

## Stand

Google hat zum **zweiten Mal** abgelehnt, mit demselben Wortlaut:

> Minderwertige Inhalte — Ihre Website erfuellt noch nicht die
> Nutzungskriterien im Google Publisher-Netzwerk.

Die Mail nennt keine Einzelheiten. Auch im Konto stand nur dieser Baustein.

Daraufhin gemessen statt geraten (`scripts/textmenge.py`, neu): Die
interaktiven Seiten waren reine React-Einhaengepunkte und im ausgelieferten
HTML praktisch leer — `/de/mein-garten/` enthielt **ein** Zeichen sichtbaren
Text. Alle standen gleichzeitig in der Sitemap.

Das ist behoben und live (Commit `ca5606e`). Details in SESSION_STATE.md.

## Die entscheidende Erkenntnis

```
site:donum-dei.pages.dev  ->  Google: 0 Treffer
                              Bing:   0 Treffer (Sitzung 33)
                              DuckDuckGo: 0 Treffer (Sitzung 33)
```

Die Seite ist von **keiner** Suchmaschine indexiert. Sie laeuft auf einer
geliehenen Cloudflare-Unteradresse, hat keine Besucher und keinen einzigen
Verweis von aussen. Diese Kombination fuehrt bei AdSense sehr zuverlaessig
zu genau diesem Textbaustein — unabhaengig davon, wie gut die Texte sind.

Die Inhalte sind seit Sitzung 32 durchgearbeitet: keine Kopien, keine
Platzhalter, keine leeren Seiten mehr. Wenn eine dritte Ablehnung denselben
Wortlaut hat, liegt es mit hoher Wahrscheinlichkeit nicht am Text.

## OFFENE ENTSCHEIDUNG — hier weitermachen

Maikel wurde gefragt, hat aber noch nicht geantwortet. **Nicht eigenmaechtig
entscheiden, sondern die Frage zu Beginn der neuen Sitzung stellen:**

**A** — Erst `donum-dei.de` kaufen (in Sitzung 33 als frei geprueft, DNS und
DENIC), Custom Domain in Cloudflare einhaengen, `site` in
`astro.config.mjs` umstellen, Weiterleitung von der pages.dev-Adresse,
neue Property in der Search Console. Danach ein paar Wochen laufen lassen
und erst dann neu beantragen. **Das ist der Vorschlag des Agenten.**

**B** — Sofort wieder beantragen, die leeren Seiten sind ja weg.

**C** — Erst die 11 duennen Pflanzeneintraege ausbauen, dann beantragen.

## Was der Agent NICHT kann

Den AdSense-Antrag selbst stellen. Getestet am 2026-08-10 mit angemeldetem
Chrome und korrekt gesetzter Erweiterungs-Freigabe:

```
navigate    -> Navigation to this domain is not allowed
read_page   -> Permission denied for reading pages on this domain
screenshot  -> Permission denied for this action on this domain
```

Die Sperre gilt fuer `adsense.google.com` und liegt auf der Werkzeug-Seite.
Nicht erneut versuchen. Maikel bekommt stattdessen eine Klick-Anleitung:
Menue **Websites** → **donum-dei.pages.dev** → **Ueberpruefung beantragen**.
