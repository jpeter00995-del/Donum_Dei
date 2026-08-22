# SESSION STATE — Donum Dei

## META
- user: Maikel (MG)
- device: MacBook-Air-von-maikel (macOS)
- tool: Claude Code (Opus 5)
- session: 36
- last_save: 2026-08-22 13:05 Sofia
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

Google hat den AdSense-Antrag zweimal abgelehnt, beide Male mit demselben
Baustein: „Minderwertige Inhalte — Ihre Website erfuellt noch nicht die
Nutzungskriterien im Google Publisher-Netzwerk."

In Sitzung 35 wurde Weg C abgearbeitet (Details in `ACTIVE_TASK.md`) und
veroeffentlicht. Maikel hat danach am **2026-08-20** die erneute
Ueberpruefung beantragt — **es laeuft also der dritte Antrag.**

**Jetzt wird gewartet. Nichts weiter bauen, bis die Antwort da ist.**

Maikels Festlegung dazu: Die eigene Domain bleibt zurueckgestellt. Erst
diesen Weg zu Ende gehen — wenn es nach zwei bis drei weiteren Versuchen
nicht klappt, wird ueber die Domain neu gesprochen. Nicht von sich aus
wieder vorschlagen.

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

### Sitzung 35 (2026-08-20) — Weg C

| Commit | Inhalt |
|--------|--------|
| `7b77c29` | alle Pflanzen-Reiter serverseitig rendern |
| `dc09d98` | Kardamom, Pfeffer, Moringa ausgebaut |
| `d2ad9e7` | neun weitere Arten ausgebaut (12/12) |

Der Durchbruch war `7b77c29`: `PlantTabs.tsx` erzeugte nur das aktive Panel.
Auf **allen 594 Pflanzenseiten** standen im ausgelieferten HTML nur
Beschreibung und Anwendung — Sicherheit, Sammeln, Wirkstoffe und Quellen
entstanden erst beim Klick im Browser und waren fuer Google unsichtbar.
Jetzt rendert Astro alle Panels, die inaktiven tragen `hidden`. Fuer Nutzer
aendert sich nichts.

Danach zwoelf textarme Arten inhaltlich ausgebaut, jede nach demselben
Muster: Beschreibung um Botanik/Herkunft/Verarbeitung erweitert, dritte
belegte Anwendung, voller Sicherheitsblock (Schwangerschaft, Stillzeit,
Kinder, Wechselwirkungen, Gegenanzeigen), Inhaltsstoffe aufgeschluesselt,
`harvest[]` mit Ernte/Trocknung/Lagerung.

```
Pflanzen-Detailseiten  Median  4574 -> 9352   Minimum  1144 -> 2505
Seiten unter 1500 Zeichen:        40 ->   18
```

Sachliche Korrektur nebenbei: Wermut stand auf
`evidence_level: ema_well_established`. Die EMA fuehrt Absinthii herba als
**traditional use** — korrigiert, dazu die EMA-Vorgaben ergaenzt (nur
Erwachsene, max. zwei Wochen, Gegenanzeigen Gallenwege/Leber/Korbbluetler).

Neue Quellen: LactMed (NIH-Stillzeit-Datenbank), Bundesamt fuer
Strahlenschutz (Cs-137 in Wildpilzen), LiverTox (Gruentee-Extrakte),
NCCIH (Ginseng), EMA-Monographien fuer Eukalyptus und Wermut nachgeprueft.

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

### Sitzung 36 (2026-08-22, Mac) — drei Wellen waehrend der Wartezeit

Maikels Auftrag: drei Wellen, direkt veroeffentlichen, Thema selbst waehlen,
gern auch ein kleines neues Feature. Der AdSense-Antrag laeuft weiter — diese
Arbeit greift nicht in ihn ein, sie verbessert nur, was Google beim naechsten
Crawl vorfindet.

| Commit | Inhalt |
|--------|--------|
| `214c0bf` | Zubereitungs-Ratgeber: zehn Methodenseiten DE/EN (neues Feature) |
| `8819f92` | Brotkrumen mit BreadcrumbList auf allen Unterseiten |
| `e3f6c0f` | fuenf duenne Arten ausgebaut + Sicherheitsluecke geschlossen |

**Welle 1 — Zubereitungs-Ratgeber** (`/de/zubereitung/`, `/en/preparation/`).
Auf den Pflanzenseiten stand bei jeder Anwendung nur das Etikett "Tee",
"Tinktur", "Umschlag", ohne dass irgendwo erklaert wird, wie das geht. Zehn
Methodenseiten je Sprache fuellen das: Einordnung, Arbeitsschritte mit Mengen,
wozu die Form taugt, ein Abschnitt "Wo Schluss ist", Aufbewahrung, dazu die
Liste der Pflanzen, die so verwendet werden. Die Form-Pille auf jeder
Pflanzenseite verlinkt jetzt dorthin. Nebenbei repariert: der Sprachumschalter
tauschte nur das erste Pfadsegment und erzeugte `/en/preparation/tee/`.

**Welle 2 — Brotkrumen.** Die 594 Pflanzenseiten hatten sie, alles andere
nicht. Neue Komponente `Breadcrumbs.astro` erzeugt sichtbare Leiste und
JSON-LD aus einer Quelle; ausgerollt auf 42 Seitenvorlagen. 718 von 729 Seiten
tragen jetzt eine — ohne bleiben die fuenf Startseiten, die Suchseiten und der
Formular-Schritt des Garten-Planers (alle drei noindex).

**Welle 3 — Inhalt und eine Sicherheitsluecke.** Bei der Sichtpruefung stand
der Abendlaendische Lebensbaum an erster Stelle der Teeseite: `caution`
eingestuft, Warntext "GIFTIG (Thujon-Gehalt)", Tee-Anwendung ein historischer
Bericht von 1535. Neue Regel `istFuerAnleitungGeeignet` (siehe § 4).
Danach fuenf viel gesuchte, textarme Arten ausgebaut — vier Heilpilze und
Ashwagandha. Ihnen fehlte der strukturierte Teil: der Reiter "Sammeln" war bei
allen fuenf leer, "Sicherheit" zeigte nur den Warntext.

```
Hericium erinaceus   de 3807 -> 5890   Inonotus obliquus   de 4491 -> 6431
Ganoderma lingzhi    de 4478 -> 6655   Lentinula edodes    en 4444 -> 6307
Withania somnifera   de 3732 -> 6373
```

Zwei Sachkorrekturen: Shiitake nannte "hitzeempfindliche Lektine" als Ursache
der Shiitake-Dermatitis, der Warntext derselben Datei dagegen Lentinan —
Lentinan ist ein Polysaccharid, kein Lektin. Bei Reishi fehlten die
Fallberichte ueber Leberschaeden, darunter ein toedlicher Verlauf.
Quellen: Memorial Sloan Kettering (About Herbs) und LiverTox, abgerufen
2026-08-22, in den Datensaetzen eingetragen.

```
Tests    376 -> 399      Seiten   707 -> 729      Sitemap  674 -> 696 URLs
```

Alles gebaut, deployed und am Produktions-Alias mit Cache-Umgehung geprueft.

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

5. **`toxicity_level: caution` ist kein Freibrief.** Der Abendlaendische
   Lebensbaum traegt diese Stufe, sein Warntext beginnt aber mit "GIFTIG".
   Wer aus den Daten eine Empfehlungsliste baut, muss zusaetzlich die einzelne
   Anwendung pruefen — `istFuerAnleitungGeeignet` in
   `src/lib/preparationPlants.ts` wirft bei Vorsichts-Pflanzen innerliche
   Anwendungen raus, die nur auf `folk`-Ueberlieferung beruhen, und haelt
   `external_only`-Pflanzen aus innerlichen Formen heraus.

6. **Die Startseite ist kein Gewichtsproblem.** Der alte TODO-Punkt "660 KB"
   misst die unkomprimierte Datei. Ueber die Leitung gehen 85 KB gzip — das
   ist unauffaellig. Bilder sind bereits lazy. Nicht anfassen.

---

## 5. NEXT STEPS

1. **Warten.** Der dritte AdSense-Antrag laeuft seit 2026-08-20. Bis eine
   Antwort da ist, gibt es an diesem Strang nichts zu tun. Wie es je nach
   Antwort weitergeht, steht in `ACTIVE_TASK.md`.

2. **Domain zurueckgestellt.** Maikels Festlegung 2026-08-20: erst diesen Weg
   zu Ende gehen, nach zwei bis drei weiteren Versuchen neu darueber
   sprechen. Nicht von sich aus vorschlagen.

3. **Linkaufbau** — bisher null Verweise von aussen. Ohne die wird die
   Seite auch mit eigener Domain nicht indexiert. Bleibt der eigentliche
   Nachteil, unabhaengig von AdSense.

4. **10 Pflanzen ohne Haustier-Angabe** bleiben bewusst leer (nicht auf der
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
scripts/heilpilze_ausbauen.py   Ernte- und Sicherheitsbloecke nachtragen
src/lib/preparationText.ts      Ratgebertexte der zehn Zubereitungsarten
src/lib/preparationPlants.ts    Pflanzen je Zubereitungsart + Anleitungs-Filter
src/components/Breadcrumbs.astro  Brotkrume + BreadcrumbList aus einer Quelle
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
