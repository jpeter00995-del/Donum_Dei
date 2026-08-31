# Search Console — Indexierung anfordern

Google bietet **keine** Schnittstelle, um die Indexierung normaler Seiten
automatisch anzufordern. Die Indexing API ist offiziell auf `JobPosting` und
`BroadcastEvent` beschraenkt; alles andere wird ignoriert. Die Browser-Werkzeuge
kommen ausserdem an `search.google.com` nicht heran (Script-Injection-Timeouts,
geprueft 2026-08-31). Es bleibt der Knopf von Hand.

Kontingent: rund **zehn Seiten pro Tag**.

## So geht es

1. `search.google.com/search-console` oeffnen
2. oben rechts pruefen: angemeldet als **jpeter00995**? Sonst Konto wechseln
3. Property `https://donum-dei.pages.dev/` waehlen
4. URL oben in die Leiste einfuegen -> Enter
5. **Indexierung beantragen** -> warten bis bestaetigt
6. naechste URL

## Reihenfolge

Erst die Einstiegs- und Themenseiten, weil dort die internen Links haengen —
findet Google die, findet es von dort aus weiter. Danach die textstaerksten
Pflanzenseiten. Pflichtseiten (Impressum, Datenschutz, Bildnachweis) stehen
bewusst nicht drin; die werden ueber den Footer ohnehin mitgenommen.

Abgehakt wird hier.

## Tag 1

- [ ] `https://donum-dei.pages.dev/de/`  (50631 Zeichen)
- [ ] `https://donum-dei.pages.dev/en/`  (48393 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/zubereitung/tee/`  (24613 Zeichen)
- [ ] `https://donum-dei.pages.dev/en/preparation/tea/`  (23231 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/zubereitung/tinktur/`  (19801 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/zubereitung/umschlag/`  (19157 Zeichen)
- [ ] `https://donum-dei.pages.dev/en/preparation/tincture/`  (18755 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/giftige-pflanzen-katzen-hunde/`  (18055 Zeichen)
- [ ] `https://donum-dei.pages.dev/en/preparation/compress/`  (17971 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/zubereitung/frisch/`  (17203 Zeichen)

## Tag 2

- [ ] `https://donum-dei.pages.dev/en/toxic-plants-cats-dogs/`  (17076 Zeichen)
- [ ] `https://donum-dei.pages.dev/en/preparation/fresh/`  (16609 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/heilpflanzen-ernten/september/`  (12526 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/ungiftige-pflanzen-haustiere/`  (12000 Zeichen)
- [ ] `https://donum-dei.pages.dev/en/harvest-calendar/september/`  (11991 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/heilpflanzen-ernten/august/`  (11897 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/heilpflanzen-ernten/juli/`  (11845 Zeichen)
- [ ] `https://donum-dei.pages.dev/en/harvest-calendar/august/`  (11382 Zeichen)
- [ ] `https://donum-dei.pages.dev/en/harvest-calendar/july/`  (11364 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/heilpflanzen-ernten/juni/`  (11133 Zeichen)

## Tag 3

- [ ] `https://donum-dei.pages.dev/de/plant/euonymus-europaeus/`  (23377 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/hippeastrum-vittatum/`  (23316 Zeichen)
- [ ] `https://donum-dei.pages.dev/en/plant/euonymus-europaeus/`  (23091 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/ginkgo-biloba/`  (21972 Zeichen)
- [ ] `https://donum-dei.pages.dev/en/plant/hippeastrum-vittatum/`  (21943 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/filipendula-ulmaria/`  (21807 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/silybum-marianum/`  (21130 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/mentha-piperita/`  (20922 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/levisticum-officinale/`  (20880 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/trigonella-foenum-graecum/`  (20816 Zeichen)

## Tag 4

- [ ] `https://donum-dei.pages.dev/de/plant/gentiana-lutea/`  (20724 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/inula-helenium/`  (20673 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/marrubium-vulgare/`  (20344 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/zingiber-officinale/`  (20332 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/echinacea-purpurea/`  (20242 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/hedera-helix/`  (20194 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/tanacetum-parthenium/`  (20162 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/aesculus-hippocastanum/`  (20087 Zeichen)
- [ ] `https://donum-dei.pages.dev/en/plant/ginkgo-biloba/`  (20054 Zeichen)
- [ ] `https://donum-dei.pages.dev/en/plant/filipendula-ulmaria/`  (19829 Zeichen)

## Tag 5

- [ ] `https://donum-dei.pages.dev/de/plant/capsicum-chinense/`  (19618 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/avena-sativa/`  (19595 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/sambucus-nigra/`  (19467 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/juglans-regia/`  (19416 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/matricaria-chamomilla/`  (19340 Zeichen)
- [ ] `https://donum-dei.pages.dev/en/plant/levisticum-officinale/`  (19212 Zeichen)
- [ ] `https://donum-dei.pages.dev/en/plant/inula-helenium/`  (19142 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/narcissus-pseudonarcissus/`  (19138 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/aristolochia-clematitis/`  (19082 Zeichen)
- [ ] `https://donum-dei.pages.dev/de/plant/datura-stramonium/`  (19077 Zeichen)

---

Erstellt 2026-08-31 aus dem aktuellen Build. Zahlen in Klammern = sichtbarer
Text der Seite, gemessen wie in `scripts/textmenge.py`.
