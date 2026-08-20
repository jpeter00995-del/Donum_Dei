# SESSION STATE — Donum Dei

## META
- user: Maikel (MG)
- device: BUL-06 (Windows)
- tool: Claude Code (Opus 5)
- session: 34
- last_save: 2026-08-20 10:42 Sofia
- live_url: https://donum-dei.pages.dev
- github: jpeter00995-del/Donum_Dei

---

## 1. ZUERST LESEN — ARBEITSORT UND VEROEFFENTLICHEN

**Gearbeitet wird in `C:\Dev\DonumDei_git`** (Mac: `~/Dev/DonumDei_git`).
Der Nextcloud-Ordner `75_Maikel/Donum_Dei/` ist **Archiv** und veraltet —
dort nichts mehr aendern. Er traegt eine Warndatei
`_ARCHIV_NICHT_MEHR_BEARBEITEN.md`.

**Ein Push macht die Seite NICHT live.** Cloudflare Pages hat keine
Git-Anbindung. Nach jeder Aenderung von Hand:

```
cd C:\Dev\DonumDei_git
npm run build
npx wrangler pages deploy dist --project-name=donum-dei
```

Cloudflare-Konto: **jpeter00995@gmail.com**
(Account-ID f30fcefaecc3116b91a14df5bc5e326c, Projekte `donum-dei`, `bulfox`).
Ein Login mit mbg82008@gmail.com schlaegt fehl — das Konto hat keine
Pages-Projekte.

Build braucht `npm install --legacy-peer-deps`.

**Live-Pruefungen immer mit Cache-Umgehung**, sonst liefert Cloudflare kurz
nach dem Deploy noch die alte Fassung:

```
curl -s "https://donum-dei.pages.dev/de/?x=$RANDOM"
```

Das hat in Sitzung 32 zweimal zu falschem Alarm gefuehrt.

---

## 2. WORUM ES GERADE GEHT

Google hat den AdSense-Antrag **zweimal** abgelehnt, beide Male mit
demselben Baustein: „Minderwertige Inhalte — Ihre Website erfuellt noch
nicht die Nutzungskriterien im Google Publisher-Netzwerk."

Die zweite Mail nannte keine Einzelheiten, auch nicht im Konto.

**Die offene Entscheidung steht in `ACTIVE_TASK.md`. Sie zuerst mit Maikel
klaeren, bevor irgendetwas gebaut wird.**

---

## 3. WAS ERLEDIGT IST

### Sitzung 32 (2026-08-10, vormittags) — Inhalte

| Commit | Inhalt |
|--------|--------|
| `870204c` | 203 Kurztexte (`teaser`) original neu, DE + EN |
| `e04ff73` | 9 Platzhalter-Beschreibungen, 6 Anzeigenamen korrigiert |
| `940b075` | 30 woertlich uebernommene Wikipedia-Beschreibungen ersetzt |
| `c833bd8` | 6 Bild-Beschreibungen ohne Unterstrich |
| `7d90109` | lesbare Quellenangaben, echte Ernte-Monatsseiten, noindex fuer kontrollierte Arten |
| `29c701d` | keine Giftpflanzen mehr in den „Heilpflanzen gegen"-Listen |
| `86fd3ed` | Haustier-Giftigkeit bei 28 Pflanzen an der ASPCA geprueft |

### Sitzung 33 (2026-08-10, nachmittags) — Haustierdaten und Technik

| Commit | Inhalt |
|--------|--------|
| `5e3cb9c` | vollstaendige ASPCA-Liste (978 Eintraege) gegen alle 297 Pflanzen |
| `24d6943` | zweite Quelle CliniTox, Nachtschatten-Hinweis, 5 Umstufungen |
| `a1e92b9` | Startseite 68 KB leichter, Gattungs-Hinweise, Link-Pruefer |

### Sitzung 34 (2026-08-20) — leere Seiten

| Commit | Inhalt |
|--------|--------|
| `ca5606e` | leere Werkzeug-Seiten mit echtem Text gefuellt |

Neu: `scripts/textmenge.py` misst den sichtbaren Text je gebauter Seite.
Befund vorher:

```
/de/mein-garten/      1 Zeichen      /de/karte/          144
/en/my-garden/        1 Zeichen      /de/mischkultur/    400
/de/quiz/            92 Zeichen
```

Alle standen in der Sitemap — ein Crawler wurde eingeladen, leere Seiten zu
indexieren. Ursache: reine React-Einhaengepunkte ohne serverseitigen Inhalt,
„Mein Garten" hatte nicht einmal ein `<h1>`.

Behoben ueber `src/lib/seitenText.ts` (neu): serverseitiger Einleitungstext
fuer Garten-Planer, Mischkultur, Quiz, Karte, Hilfe-bei und Permakultur in
DE und EN, dazu drei Absaetze auf den Feedback-Seiten. Kein Fuellmaterial —
die Texte erklaeren das Werkzeug und nennen die Grenzen.
Suche und Formular-Schritt des Garten-Planers stehen jetzt auf `noindex`
und sind aus der Sitemap gefiltert.

Live nachgemessen:

```
/de/mein-garten/      1  ->   941 Zeichen
/de/mischkultur/    400  ->  1681
/de/quiz/            92  ->   867
/de/karte/          144  ->  1001
/de/feedback/       536  ->  1391
/de/permakultur/   1498  ->  2515
```

### Gesamtzahlen

```
Teaser mit Wikipedia-Text:              183 -> 0
Beschreibungen mit Wikipedia-Muster:     30 -> 0
Platzhalter "siehe Wikipedia-Artikel":    9 -> 0
Roh-Codes [#src_...]:            ~600 Seiten -> 0
Zierpflanzen auf Ernte-Seiten:           15 -> 0
Giftpflanzen auf Symptomseiten:          40 -> 0
Seiten in der Sitemap unter 1500 Zeichen: 34 -> 32
Tests:                                  340 -> 376
Build:                                  707 Seiten
Sitemap:                                674 URLs
```

---

## 4. ERKENNTNISSE UND FALLEN

1. **Die Seite ist von keiner Suchmaschine indexiert.**
   `site:donum-dei.pages.dev` liefert bei Google, Bing und DuckDuckGo je
   null Treffer. Zusammen mit der geliehenen `pages.dev`-Adresse und
   fehlenden Verweisen von aussen ist das die wahrscheinlichste Ursache der
   Ablehnungen — nicht der Text.

2. **Ein gruenes Pruef-Skript beweist nur, dass die Muster nicht greifen.**
   In Sitzung 32 meldete `scan_descriptions.mjs` OK, waehrend 62 % der
   sichtbaren Kurztexte kopiert waren — das Skript las nur `description`,
   nie `teaser`. Nach jedem Datenlauf zusaetzlich die Live-Seite ansehen.

3. **Zahlen schlagen Vermutungen.** Der Durchbruch in Sitzung 34 kam
   dadurch, den sichtbaren Text zu messen statt zu raten, was Google
   stoeren koennte.

4. **`adsense.google.com` ist fuer die Browser-Werkzeuge gesperrt.**
   Nicht erneut versuchen, siehe ACTIVE_TASK.md.

---

## 5. NEXT STEPS

1. **Die offene Entscheidung aus `ACTIVE_TASK.md` mit Maikel klaeren.**
   Domain kaufen (Vorschlag) / sofort neu beantragen / erst Pflanzen ausbauen.

2. **Falls Domain (Weg A):** `donum-dei.de` ist frei (Sitzung 33 geprueft).
   Danach: Custom Domain in Cloudflare, `site` in `astro.config.mjs`,
   Weiterleitung von der pages.dev-Adresse, neue Property in der Search
   Console, Sitemap dort einreichen.

3. **Falls Pflanzen (Weg C):** 22 Seiten (11 Arten x DE/EN) liegen unter
   1500 Zeichen — Kardamom, Moringa, Roselle, Schwarzer Pfeffer,
   Eukalyptus, Teestrauch, Ginseng, Wermut und die drei Pilze
   (Steinpilz, Austern-Seitling, Schmetterlingstramete), dazu
   Puppen-Kernkeule. Ausbau braucht Recherche mit Quellenpflicht.

4. **Linkaufbau** — bisher null Verweise von aussen. Ohne die wird die
   Seite auch mit eigener Domain nicht indexiert.

5. **10 Pflanzen ohne Haustier-Angabe** bleiben bewusst leer (nicht auf der
   ASPCA-Liste). Ein „ungiftig" ohne Beleg wuerde sie auf eine Seite heben,
   die Sicherheit verspricht. Nicht ohne neue Quelle aendern.

---

## 6. NICHT ANFASSEN

- Die `noindex`-Sperre fuer die 11 rechtlich kontrollierten Arten
  (Cannabis, Koka, Peyote u. a.) ist eine bewusste Entscheidung fuer den
  AdSense-Antrag. An jeder Stelle steht ein Kommentar, wie man sie
  zuruecknimmt.
- Giftige und kontrollierte Arten erscheinen bewusst nicht in den
  „Heilpflanzen gegen"-Listen (`istFuerEmpfehlungGeeignet` in
  `symptomSearch.ts`).
- Der Nextcloud-Ordner bleibt Archiv.

---

## 7. WERKZEUGE

```
scripts/textmenge.py            sichtbarer Text je Seite, nach Typ gruppiert
scripts/pruef_beschreibungen.py Wikipedia-Muster + zu kurze Beschreibungen
scripts/scan_descriptions.mjs   Pre-Deploy-Gate: teaser UND description
scripts/teaser_apply.py         Teaser schreiben, Vorschau als Standard
scripts/patch_apply.py          description/names schreiben, geprueft
scripts/aspca_uebernehmen.py    Haustier-Giftigkeit mit Quelle eintragen
scripts/fix_alt_texte.py        Bild-Beschreibungen ohne Unterstrich
scripts/link_check.py           tote Links im Build
src/lib/seitenText.ts           Texte der Werkzeug-Seiten DE/EN
src/lib/harvestMonth(.test).ts  echter Ernte-Filter
src/lib/harvestMonthText.ts     Monatstexte DE/EN
src/lib/symptomText.ts          Symptomtexte DE/EN
```

Alle Schreib-Werkzeuge haben Vorschau als Standard und schreiben erst mit
`--schreiben`.

## 8. BERICHTE

- `75_Maikel/Donum_Dei/ADSENSE_BEFUND_2026-08-10.md` (Archiv-Ordner)
- `HAUSTIER_BEFUND_2026-08-10.md` (im Klon)
