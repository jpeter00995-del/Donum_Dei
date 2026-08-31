# Active Task

**Task:** AdSense — dritter Antrag abgelehnt, vierter steht an
**Started:** 2026-08-31 (Sitzung 37)
**Status:** WARTET AUF MAIKEL — er stellt den vierten Antrag

## Stand

Am **2026-08-31** kam die Antwort auf den dritten Antrag: **abgelehnt**, im
Konto steht wieder derselbe Baustein wie beim ersten und zweiten Mal —
„Minderwertige Inhalte. Ihre Website erfuellt noch nicht die Nutzungskriterien
im Google Publisher-Netzwerk."

Die Einleitungsmail klang zunaechst neu („einige Probleme festgestellt"), das
Konto nannte dann aber wortgleich den alten Grund.

**Das ist die eigentliche Information:** Zwischen Antrag 2 und 3 wurde der
Inhalt erheblich verbessert (Sitzung 35: Median der Pflanzenseiten 4574 →
9352 Zeichen, vier von fuenf Reitern ueberhaupt erst im HTML; Sitzung 36:
Zubereitungs-Ratgeber, Brotkrumen, fuenf weitere Arten). Das Urteil hat sich
um kein Wort veraendert. **Der Text ist als Ursache praktisch ausgeschlossen.**

## Maikels Festlegung (2026-08-31) — geaendert gegenueber 2026-08-20

> „Wir werden es diesmal und noch einmal machen, dann werden wir die eigene
> Domain machen."

Also: **Antrag 4 und Antrag 5 noch auf `donum-dei.pages.dev`. Danach eigene
Domain** — das ist beschlossen, nicht mehr offen. Nicht vorher vorschlagen,
aber nach Antrag 5 auch nicht mehr nachfragen, sondern anfangen.

## Was in Sitzung 37 gemacht wurde

**Ueber-/About-Seite korrigiert** (Commit `6d65745`, live). Die Seite behauptete
„Keine Werbung" / „No advertising", waehrend im selben HTML der AdSense-Code
laedt und ein Antrag laeuft. Jetzt: „Kostenlos und ohne Anmeldung" /
„Free to use, no sign-up". Dazu vier veraltete Kennzahlen nachgezogen
(Stand 2026-06 → 2026-08, Quellen 1.707 → 1.909, Seiten 637 → 729,
Tests 324 → 399). Die Pflanzenzahlen (281 + 16 Pilze = 297) waren korrekt.

Geprueft und in Ordnung, also **nicht** die Ursache: `/de/impressum/` mit
echten Angaben, `/de/ueber/`, `/de/datenschutz/`, `/de/bildnachweis/`.

## Search Console — nicht per Werkzeug erreichbar

Versuch am 2026-08-31, ueber Maikels verbundenen Chrome die Indexierung
anzuschieben: Die Seite `search.google.com/search-console` laedt zwar, aber
alle Lese- und Klick-Werkzeuge laufen in Timeouts („Script injection timed
out", „executeScript waited 45000ms"). Gleiches Muster wie bei
`adsense.google.com`. **Nicht erneut versuchen** — an Maikel uebergeben.

Beobachtung dabei, unbestaetigt: Die URL landete auf
`/search-console/welcome`. Diese Seite erscheint, wenn das angemeldete Konto
gar keine Property hat. Die Property liegt laut Projektwissen unter dem Konto
**jpeter00995**. Moeglicherweise ist Chrome mit einem anderen Konto
angemeldet. Konnte ich nicht verifizieren, weil die Seite nicht lesbar war.

## Naechste Schritte

1. **Maikel:** vierten Antrag stellen — AdSense → Websites →
   donum-dei.pages.dev → Ueberpruefung beantragen.
2. **Maikel:** in der Search Console pruefen, mit welchem Konto er angemeldet
   ist, und die staerksten Seiten einzeln zur Indexierung anmelden
   (rund zehn pro Tag).
3. **Backlinks** — bisher kein einziger. Bleibt der groesste offene Hebel und
   ist unabhaengig von AdSense.
4. Nach **Antrag 5**: eigene Domain, beschlossene Sache.

## Was ehrlich offen bleibt

Die Seite ist von keiner Suchmaschine indexiert. Technisch steht dem nichts im
Weg (robots.txt offen, Sitemap liefert, kein `X-Robots-Tag`) — es fehlt an
Verweisen von aussen und an einer eigenen Adresse.
