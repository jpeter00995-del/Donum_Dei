# Haustier-Angaben — Befund und Reparatur (2026-08-10, Sitzung 33)

Commit `5e3cb9c`, deployed und live geprüft.

Anlass: In `SESSION_STATE.md` standen zwei offene Entscheidungen — 6 Zimmer-
pflanzen und 170 Garten-/Wildpflanzen standen ohne Beleg auf der Seite
„Ungiftige Pflanzen für Katzen & Hunde". Statt zu entscheiden, ob man sie
löscht oder stehen lässt, wurde erst nachgeschlagen und dann getrennt.

---

## 1. WAS GEFUNDEN WURDE

### Zwei Felder, die sich widersprachen

Die Haustier-Angabe lag doppelt im Datensatz:

| Feld | gelesen von |
|------|-------------|
| `safety.pet_toxic` | Giftpflanzen-Listen, Symptomseiten, Warn-Kennzeichen |
| `indoor_growing.pet_safe` | Zimmerpflanzen-Filter, Pfoten-Symbol, Detail-Tabelle |

Bei **16 Pflanzen** sagten die beiden Felder das Gegenteil. Sichtbar zum
Beispiel beim Lavendel: die Pflege-Tabelle zeigte „🐾 Haustiere:
haustier-sicher", während dieselbe Seite ihn als haustiergiftig führte.

Ursache: Die Juli-Korrektur schrieb nur `safety.pet_toxic`. Das zweite Feld
kannte sie nicht — dieselbe Bauart von Fehler wie damals bei `teaser` und
`description`.

Betroffen: Zitronenstrauch, Zitronengras, Zyperngras, Lorbeer, Lavendel,
Pfefferminze, Grüne Minze, Kubanische Minze, Katzenminze, Oregano,
vier Pelargonien, Petersilie, Harfenstrauch, Studentenblume.

### 11 Pflanzen standen falsch auf der „sicher"-Liste

Die vollständige ASPCA-Liste (978 Einträge, der Giftnotruf für Tiere in den
USA) gegen alle 297 Pflanzen geprüft. Ergebnis:

```
Knoblauch        Allium sativum          ASPCA: giftig für Hunde und Katzen
Schafgarbe       Achillea millefolium    ASPCA: giftig
Estragon         Artemisia dracunculus   ASPCA: giftig
Borretsch        Borago officinalis      ASPCA: giftig
Kümmel           Carum carvi             ASPCA: giftig
Hopfen           Humulus lupulus         ASPCA: giftig
Johanniskraut    Hypericum perforatum    ASPCA: giftig
Liebstöckel      Levisticum officinale   ASPCA: giftig
Schlehe          Prunus spinosa          ASPCA: giftig (Gattung Prunus)
Tomate           Solanum lycopersicum    ASPCA: giftig (Kraut, nicht Frucht)
Aubergine        Solanum melongena       ASPCA: giftig (Gattung Solanum)
```

Alle elf standen bis heute als „ungiftig für Katzen und Hunde" auf der Seite.

### 149 Angaben ohne jeden Beleg

Von den 184 Pflanzen auf der „sicher"-Liste führte die ASPCA nur 24
ausdrücklich als ungiftig. Für 149 gibt es keinen Eintrag — weder so noch so.
Das war vorher nicht erkennbar: alle standen mit demselben grünen
„ungiftig"-Kennzeichen nebeneinander.

---

## 2. WAS GEÄNDERT WURDE

### Daten

- Vollständige ASPCA-Liste geholt und im Repo abgelegt
  (`scripts/daten/aspca_liste.json`, 978 Einträge, abgerufen 2026-08-10)
- 84 Pflanzen haben jetzt einen Beleg im Datensatz (`safety.pet_check`):
  51 auf Art-Ebene, 33 über die Gattung (die ASPCA stuft dort die ganze
  Gattung ein, z. B. „Mint (Mentha sp.)")
- 11 Einstufungen gedreht, Quelle und ein Satz im Warntext ergänzt
- 16 mal `indoor_growing.pet_safe` an `safety.pet_toxic` angeglichen

### Oberfläche

- Die Seite liest die Haustier-Angabe nur noch aus **einem** Feld
  (`safety.pet_toxic`, gekapselt in `src/lib/petSafety.ts`)
- Die „ungiftig"-Listen sind in zwei Abschnitte geteilt:
  **„Von der ASPCA als ungiftig geführt"** (24) und
  **„Ohne externe Prüfung"** (149), jeweils mit eigener Erklärung
- Die Blöcke „sichere Alternativen" auf den Giftpflanzen-Seiten zeigen nur
  noch belegte Pflanzen — eine Empfehlung darf nicht auf einer Annahme stehen
- Das Pfoten-Symbol im Zimmerpflanzen-Bereich erscheint nur noch bei
  belegten Angaben
- Detailseite sagt jetzt „ungiftig — von der ASPCA geprüft" oder
  „ungiftig — nicht extern geprüft" statt nur „haustier-sicher"

### Damit das nicht wiederkommt

`src/lib/petSafety.test.ts` läuft über alle echten Pflanzendaten und schlägt
fehl, sobald die beiden Felder wieder auseinanderlaufen oder ein Beleg nicht
zur Einstufung passt.

---

## 3. ZAHLEN

```
ASPCA-Liste geholt:                     978 Einträge
Treffer bei unseren 297 Pflanzen:        84 (51 Art, 33 Gattung)
Einstufung gedreht:                      11
Feld-Widersprüche behoben:               16
haustiergiftig:                    103 -> 114
haustiersicher:                    184 -> 173  (24 belegt, 149 unbelegt)
ohne Angabe:                             10  (unverändert, bewusst leer)
Tests:                             357 -> 368
astro check:                              0 Fehler
Build:                                  707 Seiten
```

Live nachgemessen (Cache-Umgehung `?x=`):

```
/de/ungiftige-pflanzen-haustiere/   Badge "ungiftig · ASPCA":      24
                                    Badge "nicht extern geprüft": 149
/en/pet-safe-plants/                "non-toxic · ASPCA":           24
                                    "not verified":               149
/de/plant/lavandula-angustifolia/   "für Haustiere giftig":         1
                                    altes "haustier-sicher":        0
/de/plant/ocimum-basilicum/         "von der ASPCA geprüft":        1
/de/plant/allium-sativum/           ASPCA-Satz + Quelle:            1
/de/giftige-pflanzen-katzen-hunde/  Anzahl im Text:               114
```

---

## 4. NEUE WERKZEUGE

```
scripts/aspca_liste_holen.py   holt die vollständige ASPCA-Liste (--neu lädt neu)
scripts/aspca_abgleich.py      vergleicht sie mit unseren Pflanzen, meldet Widersprüche
scripts/aspca_welle2.py        trägt Ergebnis ein (Vorschau; schreibt erst mit --schreiben)
src/lib/petSafety.ts           eine Wahrheit + Beleg-Prüfung für die Oberfläche
```

Der Abgleich ist wiederholbar: `python scripts/aspca_liste_holen.py --neu`,
dann `python scripts/aspca_abgleich.py`. Ändert die ASPCA etwas, wird es
sichtbar.

---

## 5. NACHTRAG — ZWEITE QUELLE UND NACHTSCHATTEN (Commit `24d6943`)

Zwei Aufträge von Maikel: den Nachtschatten-Hinweis präzisieren und eine
zweite Quelle für die unbelegten Angaben suchen.

### Tomate, Aubergine, Kartoffel

Die ASPCA-Einstufung „giftig für Hunde und Katzen" stimmt, klingt aber so, als
dürfe kein Hund je ein Stück Tomate sehen. Gemeint ist das Kraut. Der Warnsatz
sagt das jetzt — angehängt mit Gedankenstrich an denselben Satz, weil die
Giftpflanzen-Liste nur **einen** Satz als Begründung zeigt und ein zweiter dort
verloren ginge.

Dieselbe Liste nimmt jetzt außerdem den Satz, der wirklich von Hund und Katze
handelt, statt blind den ersten Satz des Warntextes (`petReason`). Vorher stand
unter „Giftige Pflanzen für Katzen & Hunde" oft eine Begründung über Menschen.

### Die zweite Quelle — und warum es nicht Bonn wurde

Die Giftinformationszentrale Bonn kam nicht in Frage: sie führt ausschließlich
Vergiftungen beim **Menschen**. Über Hund und Katze sagt sie nichts.

Genommen wurde **CliniTox**, die Giftpflanzen-Datenbank des Instituts für
Veterinärpharmakologie und -toxikologie der Universität Zürich
(`www.vetpharm.uzh.ch`). Die Bonner Liste läuft als drittes Netz mit.

**Die wichtigste Einsicht:** Außer der ASPCA hat keine dieser Quellen eine
Ungiftig-Liste. Ein fehlender Eintrag belegt also nichts. Und ein CliniTox-Grad
ist kein Hund/Katze-Urteil — es ist ein allgemeiner Pflanzen-Giftgrad, oft aus
der Nutztiermedizin. Der Beweis steht in den Daten selbst: **Salbei** führt
CliniTox als „schwach giftig (+)", während die ASPCA ihn ausdrücklich als
ungiftig für Hunde und Katzen führt.

Deshalb wird der Grad als Hinweis mit Quelle gezeigt (`safety.tox_note`,
gelbes Feld auf der Liste) und **nicht** in `pet_toxic` umgemünzt.

### Umgestuft wurde nur mit tierspezifischem Grund

| Pflanze | Grund |
|---------|-------|
| Bärlauch | Alle vier ASPCA-gelisteten Allium-Arten sind giftig; CliniTox „giftig +" und nennt ausdrücklich „andere Allium-Arten – giftig". Hämolyse |
| Eiche | Eichelvergiftung beim Hund ist ein Standardfall; CliniTox „giftig +", Bonn „gering giftig bis giftig" |
| Buschbohne, Stangenbohne | Phasin in rohen Bohnen; CliniTox „stark giftig ++" |
| Rhabarber | ASPCA-Treffer, den der Abgleich übersehen hatte: die ASPCA schreibt „Rheum rhabarbarium" statt „rhabarbarum" |

Der Tippfehler-Fund hat den Matcher verbessert (gleiche Gattung, fast gleicher
Artname). Damit kamen auch Dill und Cannabis als Treffer dazu.

**Nicht umgestuft**, obwohl CliniTox sie führt: Weißkohl, Brokkoli, Rote Bete,
Spitzwegerich, Salbei, Rotbuche, Kiefer, Leinsamen und 26 weitere. Ihr Grad
stammt aus Nutztier- oder Mensch-Zusammenhängen. Sie tragen jetzt den gelben
Hinweis, damit die Angabe nicht wie ein Freibrief aussieht.

### Zahlen nach dem Nachtrag

```
haustiergiftig:            114 -> 119
belegt ungiftig:            24 -> 25
ohne Beleg:                149 -> 143   (davon 30 mit Tiermedizin-Hinweis)
Tests:                     368 -> 376
astro check:                 0 Fehler
Build:                     707 Seiten
```

Live nachgemessen (Cache-Umgehung):

```
/de/ungiftige-pflanzen-haustiere/  ASPCA 25 | ungeprüft 143 | Tiermedizin 30
/en/pet-safe-plants/               ASPCA 25 | not verified 143 | Vet database 30
/de/giftige-pflanzen-katzen-hunde/ Anzahl 119
/de/plant/solanum-lycopersicum/    "gemeint ist das Kraut" 1
/de/plant/allium-ursinum/          Haustier-Satz 1
/de/plant/quercus-robur/           Haustier-Satz 1, CliniTox-Quelle verlinkt
/de/plant/salvia-officinalis/      bleibt haustiersicher, CliniTox als Hinweis
```

Hinweis zum Messen: Cloudflare liefert nach einem Deploy bis zu einige Minuten
die alte Fassung, auch mit `?x=`. Erst die Deploy-eigene Adresse
(`https://<id>.donum-dei.pages.dev`) zeigt sofort den neuen Stand.

### Neue Werkzeuge

```
scripts/clinitox_holen.py       CliniTox abfragen (Datei-Cache, --neu lädt neu)
scripts/clinitox_uebernehmen.py Hinweise eintragen, begründete Umstufungen
scripts/gizbonn_holen.py        Bonner Liste holen (221 Einträge)
scripts/quellen_abgleich.py     alle drei Quellen gegen unsere Daten
scripts/nachtschatten_hinweis.py Kraut-statt-Frucht-Zusatz
```

---

## 6. WAS OFFEN BLEIBT

- Die 143 unbelegten Angaben bleiben unbelegt. Es gibt schlicht keine weitere
  Liste, die „ungiftig für Hund und Katze" positiv feststellt. Wer mehr will,
  braucht Einzelrecherche je Pflanze.
- 10 Pflanzen ohne jede Haustier-Angabe bleiben bewusst leer (Teestrauch,
  Kardamom, Roselle, Ginseng, Schwarzer Pfeffer, Moringa, Ashwagandha,
  Kratom, Peyote, Puppen-Kernkeule).
- Auf Detailseiten von Pflanzen ohne Zimmerpflanzen-Block steht die
  Haustier-Angabe nur im Fließtext der Warnung, nicht als eigene Zeile.
- 5 Pflanzen, bei denen die ASPCA eine andere Art derselben Gattung als giftig
  führt, sind nicht entschieden: Beifuß, Walnuss, Wiesen-Schlüsselblume
  (ASPCA führt Primula vulgaris als giftig) — hier fehlt eine belastbare
  Aussage zur konkreten Art.
