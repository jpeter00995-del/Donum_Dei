# Notiz: companion_planting — Bestandsaufnahme

**Datum:** 2026-08-20
**Anlass:** Prüfung, ob GraphRAG (KI-Wissensnetz) für Donum Dei sinnvoll wäre
**Status:** Nur Bestandsaufnahme — nichts geändert, keine Daten angefasst
**Datenstand:** `C:\Dev\DonumDei_git\src\data\plants\` (297 Dateien)

---

## 1. Warum diese Notiz entstanden ist

Beim Prüfen von GraphRAG kam heraus: Donum Dei braucht kein KI-Wissensnetz,
weil das Netz bereits von Hand gepflegt ist (family, symptoms, permaculture_functions,
companion_planting, climate_zones).

Dabei fiel `companion_planting` auf — das einzige Feld, das Pflanzen **untereinander**
verknüpft. Alle anderen Felder beschreiben eine Pflanze für sich.

Das ist der Unterschied zwischen einer Pflanzen-*Liste* und einer Pflanzen-*Datenbank*.

---

## 2. Der gemessene Bestand

### Abdeckung

| | Anzahl |
|---|---|
| Pflanzen gesamt | 297 |
| mit `companion_planting` | 71 |
| ohne | 226 |

### Unterfelder der 71 gepflegten Einträge

| Unterfeld | vorhanden in |
|---|---|
| `good_partners` | 71 |
| `bad_partners` | 71 |
| `source` | 71 |
| `notes_de` / `notes_en` | 47 |
| `reasons` | 43 |
| `neutral` | 4 |

Bei `bad_partners` sind 39 der 71 tatsächlich gefüllt, 32 sind leere Listen.
Eine leere Liste heißt hier: geprüft, nichts gefunden — nicht: ungeprüft.

### Beispielstruktur

```json
"companion_planting": {
  "good_partners": ["lavandula-angustifolia", "matricaria-chamomilla", "origanum-vulgare"],
  "bad_partners": [],
  "source": "Helga und Margarete Langerhorst, Mein gesunder Naturgarten (eigene Kuration)"
}
```

Partner werden per `slug` referenziert, nicht per Klartext-Name.
Das ist gut — dadurch sind es echte Verweise und keine Textschnipsel.

---

## 3. Wichtigste Erkenntnis: die Lücke ist viel kleiner als sie aussieht

Die 226 fehlenden Einträge sind **keine** 226 offenen Aufgaben.

`companion_planting` existiert bei **genau** den 71 Pflanzen, die auch `garden_meta`
haben. Von den 226 anderen hat **keine einzige** ein `garden_meta`-Feld.

Das ist kein Zufall, sondern eine bewusste Abgrenzung: gepflegt wurde der
Garten-Teilbereich. Alles andere sind Wildkräuter, Heilpflanzen, Pilze und
Zimmerpflanzen, die nie als Gartenpflanzen erfasst wurden.

### Aufschlüsselung der 226

| Gruppe | Anzahl | Relevant? |
|---|---|---|
| Pilze (`kingdom: fungus`) | 16 | nein — Beetnachbarschaft gibt es nicht |
| Zimmerpflanzen (`indoor_growing`) | 29 | nein — kein Beet |
| mit `permaculture_functions` | **37** | **ja — echte Kandidaten** |
| Rest (reine Heil-/Arzneipflanzen, oft tropisch oder Importdroge) | 144 | nein |

**Realistischer offener Umfang: rund 37 Pflanzen, nicht 226.**

### Die 37 Kandidaten

```
actaea-racemosa, aegopodium-podagraria, angelica-archangelica, boswellia-serrata,
centaurium-erythraea, centella-asiatica, cetraria-islandica, commiphora-myrrha,
eleutherococcus-senticosus, elymus-repens, eschscholzia-californica, frangula-alnus,
fumaria-officinalis, galeopsis-segetum, geranium-robertianum, glycyrrhiza-glabra,
harpagophytum-procumbens, krameria-lappacea, lamium-album, leonurus-cardiaca,
linum-usitatissimum, orthosiphon-aristatus, passiflora-incarnata, pelargonium-sidoides,
peumus-boldus, plantago-major, plantago-ovata, potentilla-erecta, rhodiola-rosea,
ruscus-aculeatus, senna-alexandrina, stellaria-media, symphytum-officinale,
vaccinium-macrocarpon, verbascum-thapsus, vitex-agnus-castus, vitis-vinifera
```

Auch diese Liste ist noch nicht endgültig. Darin stecken Arten, bei denen
Beetnachbarschaft fachlich zweifelhaft ist (`boswellia-serrata` und
`commiphora-myrrha` sind Weihrauch und Myrrhe — Bäume aus Trockengebieten,
`harpagophytum-procumbens` ist Teufelskralle aus der Kalahari).

Vor dem Befüllen also erst durchgehen, welche davon in einem mitteleuropäischen
Garten überhaupt vorkommen.

---

## 4. Warnung zur Datenqualität

Companion Planting ist ein Feld mit **viel Überlieferung und wenig Studienlage**.
Der Großteil dessen, was online steht, ist voneinander abgeschrieben und geht
auf dieselben zwei, drei Gartenbücher zurück.

Belastbar ist im Grunde nur:

- Stickstoffbindung durch Schmetterlingsblütler
- Duftpflanzen als Ablenkung/Störung für bestimmte Schädlinge
- Wurzelkonkurrenz und Wuchshöhe (Licht)
- allelopathische Effekte bei wenigen Arten (z. B. Walnuss/Juglon)

Fast alles andere ist Tradition. Das ist nicht wertlos, aber es ist keine Evidenz.

**Konsequenz:** Wenn befüllt wird, dann mit derselben Trennung, die bei den
Haustier-Angaben schon gilt — belegt und ungeprüft dürfen nicht vermischt werden.
Das bestehende `source`-Feld leistet das bereits, es muss nur konsequent
genutzt und ehrlich benannt werden ("eigene Kuration" ist eine ehrliche Angabe).

Eine KI-generierte Befüllung ohne Quellenprüfung wäre der schlechteste Weg —
sie würde genau die abgeschriebene Online-Überlieferung reproduzieren und
ihr durch das Datenformat einen Anschein von Belegtheit geben.

---

## 5. Kein Handlungsbedarf, nur Optionen

Nichts hiervon ist dringend. Zur Auswahl, wenn das Thema wieder hochkommt:

- **A** — Die 37 Kandidaten erst auf Gartentauglichkeit durchsehen, dann
  nur die verbleibenden befüllen. Kleiner, sauberer Schritt.
- **B** — `bad_partners` bei den 32 leeren Einträgen nachprüfen. Noch kleiner,
  und "keine schlechten Nachbarn bekannt" ist für Nutzer eine echte Aussage.
- **C** — Nichts befüllen, stattdessen die 71 gepflegten Einträge im Frontend
  besser sichtbar machen (Nachbarschafts-Ansicht, Verweise in beide Richtungen).
  Der Datenbestand ist da — die Frage ist, ob er auf der Website ankommt.

Option C bringt vermutlich am meisten pro Aufwand, weil sie nichts an den
Daten riskiert.

---

## 6. Nebenbefund GraphRAG

Für Donum Dei nicht sinnvoll. Begründung kurz:

GraphRAG lässt eine KI aus Fließtext erraten, welche Dinge wie zusammenhängen.
Bei Donum Dei sind diese Zusammenhänge bereits als gepflegte Felder vorhanden.
Die KI würde also ein schlechteres Netz über ein besseres legen und dabei die
Trennung zwischen belegt und ungeprüft einebnen.

Fragen wie "welche Pflanzen sind bienenfreundlich, katzengiftig und Zone 7"
sind Filterabfragen über JSON — schnell, kostenlos, immer korrekt.

---

*Erstellt von Claude Code, 2026-08-20. Reine Analyse, keine Datenänderung.*
