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

## 5. WAS OFFEN BLEIBT

- Die 149 unbelegten Angaben sind jetzt ehrlich gekennzeichnet, aber nach wie
  vor ungeprüft. Eine zweite Quelle (z. B. Giftzentrale Bonn) würde einen Teil
  davon belegen — Aufwand: eine Sitzung.
- 10 Pflanzen ohne jede Haustier-Angabe bleiben bewusst leer (Teestrauch,
  Kardamom, Roselle, Ginseng, Schwarzer Pfeffer, Moringa, Ashwagandha,
  Kratom, Peyote, Puppen-Kernkeule).
- Auf Detailseiten von Pflanzen ohne Zimmerpflanzen-Block steht die
  Haustier-Angabe nur im Fließtext der Warnung, nicht als eigene Zeile.
