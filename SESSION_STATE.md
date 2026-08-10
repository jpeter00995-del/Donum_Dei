# SESSION STATE — Donum Dei

## META
- user: Maikel (MG)
- device: BUL-06 (Windows)
- tool: Claude Code (Opus 5)
- session: 32
- last_save: 2026-08-10 10:45 Sofia
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

1. **AdSense-Neupruefung beantragen.** Blockiert: Die Chrome-Erweiterung hat
   fuer `google.com` keine Freigabe („Permission denied for reading pages on
   this domain"). Maikel muss im geoeffneten AdSense-Tab oben rechts auf das
   Claude-Symbol klicken und den Zugriff erlauben. Danach: AdSense →
   Websites → donum-dei.pages.dev → „Ueberpruefung beantragen".
   **Vor dem endgueltigen Klick Maikel zeigen, was auf dem Bildschirm steht.**
   Passwoerter niemals selbst eingeben.

2. **Sitemap in der Search Console neu einreichen** — Maikel richtet das ein
   (Konto jpeter00995, Property donum-dei.pages.dev, Menuepunkt „Sitemaps",
   Feld `sitemap-index.xml`, SENDEN).

3. **Offene Entscheidung: 6 Zimmerpflanzen ohne ASPCA-Beleg** auf der
   „haustiersicher"-Liste — Polpala, Rucola, Molchschwanz, Indisches
   Basilikum, Honigmelonen-Salbei, Sommer-Bohnenkraut. Die ASPCA fuehrt sie
   nicht. Optionen: von der Liste nehmen, als „nicht extern geprueft"
   markieren, oder so lassen. Maikel hat noch nicht entschieden.

4. **Offene Entscheidung: 170 Garten- und Wildpflanzen** auf der
   „haustiersicher"-Liste sind weiterhin ohne Beleg. Nur 14 der 184 haben
   eine ASPCA-Quelle. Geprueft wurden bisher nur die Zimmerpflanzen, weil
   dort das Risiko am groessten ist.

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
