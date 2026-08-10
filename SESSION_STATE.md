# SESSION STATE — Donum Dei

## META
- user: Maikel (MG)
- device: BUL-06 (Windows)
- tool: Claude Code (Opus 5)
- session: 33
- last_save: 2026-08-10 14:55 Sofia
- live_url: https://donum-dei.pages.dev
- github: jpeter00995-del/Donum_Dei

## ⚠️ ZUERST LESEN — ARBEITSORT HAT SICH GEAENDERT

**Gearbeitet wird ab sofort in `C:\Dev\DonumDei_git`** (Mac: `~/Dev/DonumDei_git`).
Der Nextcloud-Ordner `75_Maikel/Donum_Dei/` ist **Archiv** und veraltet.
Er traegt eine Warndatei `_ARCHIV_NICHT_MEHR_BEARBEITEN.md` und einen
Warnblock oben in seiner `CLAUDE.md`. Dort nichts mehr aendern.

Grund: Das `.git` im NC-Ordner hing sechs Commits hinterher, waehrend die
Dateien darin neuer waren als sein eigener Git-Stand. Entscheidung Maikel
am 2026-08-10.

**Veroeffentlichen geht NICHT ueber GitHub.** Cloudflare Pages hat keine
Git-Anbindung. Nach jedem Push von Hand:

```
cd C:\Dev\DonumDei_git
npm run build
npx wrangler pages deploy dist --project-name=donum-dei
```

Cloudflare-Konto: **jpeter00995@gmail.com** (Account-ID
f30fcefaecc3116b91a14df5bc5e326c, enthaelt `donum-dei` und `bulfox`).
Ein Login mit mbg82008@gmail.com schlaegt fehl — dieses Konto hat keine
Pages-Projekte.

Build braucht `npm install --legacy-peer-deps`.

## SITZUNG 33 (2026-08-10 nachmittags) — HAUSTIER-ANGABEN BELEGT

Die beiden offenen Entscheidungen aus Sitzung 32 (6 Zimmerpflanzen und 170
Garten-/Wildpflanzen ohne ASPCA-Beleg) sind erledigt — nicht durch eine
Entscheidung, sondern durch Nachschlagen.

| Commit | Inhalt |
|--------|--------|
| `5e3cb9c` | Haustier-Angaben belegt oder als ungeprüft gekennzeichnet |
| `24d6943` | zweite Quelle (CliniTox), Nachtschatten-Hinweis, 5 weitere Umstufungen |

```
ASPCA-Liste geholt:                     978 Einträge
Treffer bei unseren Pflanzen:            87 (54 Art, 33 Gattung)
Falsche "sicher"-Einstufungen gedreht:   16 gesamt
Widersprüche zwischen zwei Feldern:      16 -> 0
haustiergiftig:                    103 -> 119
haustiersicher:                    184 -> 168 (25 belegt / 143 unbelegt)
Tests:                             357 -> 376
```

Zweite und dritte Quelle geprüft: **CliniTox** (Institut für Veterinär-
pharmakologie, Universität Zürich) und die Giftpflanzen-Liste der
**Giftinformationszentrale Bonn**. Bonn taugt nicht als Beleg — sie führt nur
Vergiftungen beim Menschen. Und außer der ASPCA hat keine Quelle eine
Ungiftig-Liste; ein fehlender Eintrag beweist also nichts.

Ein CliniTox-Giftgrad ist kein Hund/Katze-Urteil (Salbei: CliniTox „schwach
giftig", ASPCA „ungiftig für Haustiere"). Er steht deshalb als Hinweis mit
Quelle in `safety.tox_note` und wird nie in `pet_toxic` umgemünzt. Umgestuft
wurde nur mit tierspezifischem Grund: Bärlauch, Eiche, Busch- und
Stangenbohne, Rhabarber.

Kern: `safety.pet_toxic` und `indoor_growing.pet_safe` liefen unabhängig
nebeneinander und widersprachen sich bei 16 Pflanzen — Lavendel stand mit
„🐾 haustier-sicher" auf der Seite, die ihn als giftig auswies. Die
Oberfläche liest jetzt nur noch ein Feld (`src/lib/petSafety.ts`), ein Test
über alle echten Daten verhindert das Auseinanderlaufen.

Die „ungiftig"-Listen sind geteilt in „Von der ASPCA geführt" (24) und
„Ohne externe Prüfung" (149). Empfehlungsblöcke und das Pfoten-Symbol
zeigen nur noch Belegtes.

Vollständiger Bericht: `HAUSTIER_BEFUND_2026-08-10.md`.

## CONTEXT (Sitzung 32, 2026-08-10)

Google hat die Seite fuer AdSense abgelehnt: „Richtlinienverstoesse —
Minderwertige Inhalte". Die ganze Sitzung ging darum, die Ursachen zu finden
und zu beheben. Dabei kam ein Sicherheitsproblem ans Licht, das mit AdSense
nichts zu tun hatte.

## WAS ERLEDIGT IST (alles live und nachgemessen)

| Commit | Inhalt |
|--------|--------|
| `870204c` | 203 Kurztexte (`teaser`) original neu, DE + EN; Pruef-Skript erweitert |
| `e04ff73` | 9 Platzhalter-Beschreibungen ersetzt, 6 Anzeigenamen korrigiert |
| `940b075` | 30 woertlich uebernommene Wikipedia-Beschreibungen ersetzt |
| `c833bd8` | 6 Bild-Beschreibungen (`image.alt`) ohne Unterstrich |
| `7d90109` | lesbare Quellenangaben, echte Ernte-Monatsseiten, noindex fuer kontrollierte Arten |
| `29c701d` | keine Giftpflanzen mehr in den „Heilpflanzen gegen"-Listen |
| `86fd3ed` | Haustier-Giftigkeit bei 28 Pflanzen an der ASPCA-Liste geprueft |

```
Teaser mit Wikipedia-Text:              183 -> 0
Beschreibungen mit Wikipedia-Muster:     30 -> 0
Platzhalter "siehe Wikipedia-Artikel":    9 -> 0
Roh-Codes [#src_...]:            ~600 Seiten -> 0
Zierpflanzen auf Ernte-Seiten:           15 -> 0
Giftpflanzen auf Symptomseiten:          40 -> 0
Kontrollierte Arten indexiert:           11 -> 0
haustiergiftig / haustiersicher:   89/197 -> 103/184
Tests:                                  340 -> 357
Build:                                  707 Seiten
```

## WICHTIGE ERKENNTNISSE

1. **Die Juli-Reparatur war unvollstaendig, weil das Pruef-Skript zu eng war.**
   `scan_descriptions.mjs` las nur `description`, nie `teaser`. Das Gate war
   gruen, obwohl 62 % der sichtbaren Kurztexte kopiert waren. Jetzt prueft es
   beide Felder plus Platzhalter. Trotzdem rutschten spaeter noch 12
   kopierte Beschreibungen durch, weil Formulierungen wie „bildet eine
   Pflanzengattung" nicht in der Musterliste standen — deshalb gibt es
   zusaetzlich `scripts/pruef_beschreibungen.py`, das auch auffaellig kurze
   Texte meldet.

2. **Ein gruenes Gate beweist nur, dass die Muster nicht greifen.**
   Nach jedem Datenlauf zusaetzlich stichprobenartig die Live-Seite ansehen.

3. **Nach einem Deploy liefert Cloudflare kurzzeitig noch die alte Fassung.**
   Live-Pruefungen mit Cache-Umgehung machen: `?x=<zufallszahl>` anhaengen.
   Ohne das gab es in dieser Sitzung zweimal falschen Alarm.

## NEXT STEPS — konkret, in dieser Reihenfolge

1. **AdSense-Neupruefung: ERLEDIGT am 2026-08-10.** Maikel hat den Antrag
   selbst gestellt (der Agent kann das nicht, siehe ACTIVE_TASK.md).
   Stand laut AdSense-Oberflaeche:
   - „Inhaberschaft der Website bestaetigen" — gruener Haken
   - „Ueberpruefung angefordert" — gruener Haken
   - Uhrzeit der Anfrage: 10. Aug. 2026, 09:12
   - Google: „in der Regel einige Tage, vereinzelt zwei bis vier Wochen"

   **Auf die Antwort warten.** Kommt eine erneute Ablehnung: den kompletten
   Mailtext in den Chat geben. Der Grund steht unter „Es wurden
   Richtlinienverstoesse gefunden" — davon haengt alles Weitere ab.

2. **Sitemap in der Search Console neu einreichen** — Maikel richtet das ein
   (Konto jpeter00995, Property donum-dei.pages.dev, Menuepunkt „Sitemaps",
   Feld `sitemap-index.xml`, SENDEN).

3. **ERLEDIGT in Sitzung 33** — die unbelegten „haustiersicher"-Angaben sind
   jetzt als „ohne externe Pruefung" gekennzeichnet und von den belegten
   getrennt. Offen bleibt nur: eine zweite Quelle suchen (z. B.
   Giftinformationszentrale Bonn), um einen Teil der 149 zu belegen.

4. **ERLEDIGT in Sitzung 33** — siehe Punkt 3 und
   `HAUSTIER_BEFUND_2026-08-10.md`.

5. **10 Pflanzen ohne Haustier-Angabe** (Teestrauch, Kardamom, Roselle,
   Ginseng, Schwarzer Pfeffer, Moringa, Ashwagandha, Kratom, Peyote,
   Puppen-Kernkeule): stehen nicht auf der ASPCA-Liste. Bewusst leer
   gelassen — ein „ungiftig" ohne Beleg wuerde sie auf eine Seite heben, die
   Sicherheit verspricht. Nicht ohne neue Quelle aendern.

6. Eigene Domain donum-dei.de (Maikel kauft, dann Cloudflare Custom Domain).

## WARNINGS

- Nextcloud-Ordner = Archiv. Nur `C:\Dev\DonumDei_git` gilt.
- Cloudflare-Deploy nur von Hand, richtiges Konto beachten (siehe oben).
- Live-Checks immer mit Cache-Umgehung.
- Die noindex-Sperre fuer die 11 kontrollierten Arten ist eine bewusste
  Entscheidung fuer den AdSense-Antrag. An jeder betroffenen Stelle steht
  ein Kommentar, wie man sie zuruecknimmt.
- Sicherung der Pflanzendaten vor dem ASPCA-Eingriff liegt im
  Session-Scratchpad (`plants_pre_aspca`), zusaetzlich
  `_backups/plants_2026-08-10_pre_teaser.tar.gz` im Klon.

## NEUE WERKZEUGE DIESER SITZUNG

```
scripts/teaser_export.py        betroffene Pflanzen stapelweise listen
scripts/teaser_apply.py         Teaser schreiben, Vorschau als Standard
scripts/teaser_zeige.py         Datenansicht fuer einzelne Slugs
scripts/patch_apply.py          description/names schreiben, geprueft
scripts/beschr_zeige.py         Datenansicht fuer Beschreibungen
scripts/pruef_beschreibungen.py Bericht: Wikipedia-Muster + kurze Texte
scripts/fix_alt_texte.py        Bild-Beschreibungen ohne Unterstrich
scripts/aspca_uebernehmen.py    Haustier-Giftigkeit mit Quelle eintragen
src/lib/harvestMonth.ts         echter Ernte-Filter (+11 Tests)
src/lib/harvestMonthText.ts     Monatstexte DE/EN
src/lib/symptomText.ts          Symptomtexte DE/EN
```

Alle Schreib-Werkzeuge haben Vorschau als Standard und schreiben erst mit
`--schreiben`.

## VOLLSTAENDIGER BERICHT

`75_Maikel/Donum_Dei/ADSENSE_BEFUND_2026-08-10.md` (im Archiv-Ordner,
enthaelt alle Messwerte und Zwischenschritte dieser Sitzung).
