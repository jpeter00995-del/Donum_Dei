# CHAT CONTEXT — Donum Dei, Sitzung 32 (2026-08-10)

Gespraechs-Zusammenhang als Absturzschutz. Ergaenzt SESSION_STATE.md,
ersetzt es nicht.

## Wie die Sitzung lief

Maikel kam mit der AdSense-Ablehnungsmail. Erst nur ein Auszug, der Grund
fehlte — der kam im zweiten Anlauf nach: „Richtlinienverstoesse gefunden —
Minderwertige Inhalte".

Die Analyse hat den Grund bestaetigt und dabei mehr gefunden als erwartet.
Die Sitzung ist in sechs Etappen gelaufen, jede mit eigenem Commit und
eigenem Deploy.

## Entscheidungen, die Maikel getroffen hat

| Frage | Entscheidung |
|-------|--------------|
| Reihenfolge der Reparatur | erst nur die Kurztexte, danach alles Weitere |
| Deploy-Weg | Push nach GitHub — stellte sich als unzureichend heraus |
| Nextcloud-Ordner | wird Archiv, nur noch der Klon gilt |
| Rauschpflanzen | vorruebergehend auf „nicht indexieren" |
| Giftpflanzen auf Symptomseiten | komplett raus aus den Empfehlungslisten |
| Haustier-Angaben | alle 32 Zimmerpflanzen an der ASPCA pruefen |
| Save-Verfahren | neuer Kurzbefehl `save + notiz` |

## Wo ich bewusst anders gehandelt habe als gefragt

1. **Rauschpflanzen-noindex:** Maikel sagte „die Seite". Ich habe auch die
   11 Detailseiten gesperrt, weil die Massnahme sonst wirkungslos gewesen
   waere. Angesagt und begruendet, er hat es bestaetigt.

2. **11 Pflanzen ohne Haustier-Angabe:** Maikel wollte sie nachtragen.
   Belegen liess sich nur der Eukalyptus. Die anderen zehn stehen nicht auf
   der ASPCA-Liste — ein „ungiftig" ohne Beleg haette sie auf eine Seite
   gehoben, die Sicherheit verspricht. Bewusst leer gelassen.

## Wo ich mich geirrt habe

- Annahme, Cloudflare zieht sich Aenderungen selbst von GitHub. Falsch —
  steht sogar in der eigenen README. Kostete einen Umweg.
- Zwei Live-Pruefungen zu frueh gemacht und dadurch falschen Alarm gemeldet
  (Cloudflare lieferte noch die alte Fassung). Seitdem mit `?x=<zahl>`.
- Erst spaet erkannt, dass die Browser-Werkzeuge `adsense.google.com`
  grundsaetzlich sperren. Maikel hat dreimal vergeblich Freigaben gesetzt.

## Arbeitsweise, die sich bewaehrt hat

- Jedes Schreib-Werkzeug mit Vorschau als Standard, Schreiben erst mit
  `--schreiben`. Hat mehrfach Unsinn abgefangen.
- Nach jedem Datenlauf zusaetzlich die Live-Seite ansehen, nicht nur das
  Pruef-Skript. Genau so kamen die 12 uebersehenen Wikipedia-Texte und die
  Unterstriche in den Bild-Beschreibungen ans Licht.
- Zahlen statt Adjektive in jeder Meldung.

## Wie Maikel arbeiten will

- Deutsch, einfache Sprache, keine Fachwoerter ohne Erklaerung
- Fragen ans Ende, nummeriert, Optionen mit A/B/C
- Kein „soll ich weitermachen?" — durcharbeiten und melden
- Beweis vor Fertig: keine Erfolgsmeldung ohne gezeigte echte Ausgabe
