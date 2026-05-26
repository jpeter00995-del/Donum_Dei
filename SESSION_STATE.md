# SESSION STATE — Donum Dei

## META
- last_updated: 2026-05-24 13:13
- save_type: SAVE (Session 11 auf Mac — Welle XII–XV, session-save)
- device: MacBook-Air-von-maikel.local (macOS, Claude Code)
- tool: Claude Code (Opus 4.7, 1M context)
- session_uid: mba-mg-claude-code-session10  (durable, beibehalten aus Session 10)
- run_uid: run-20260524-1041-mba-mg-claude-code-session11
- project: Donum_Dei
- actor: MG
- current_version: v1.10.41 (LIVE — Welle XV)
- live_url: https://donum-dei.pages.dev/
- last_deploy_preview: https://7d7e2177.donum-dei.pages.dev (v1.10.41 LIVE)
- git_initialized: true (kein GitHub-Remote)
- last_conventions_check: 2026-05-22

## 1. KONTEXT
Session 11 (Mac, Resume von Session 10 am 22.05.). Vier Tiefen-Anreicherungs-
Wellen in Folge: XII (10 Heil + Gemüse), XIII (14 Indoor-Profil), XIV (10
Giftpflanzen, Safety-Profil), XV (5 Mix). Insgesamt 39 Pflanzen vertieft.
DB-Tiefe von 63,7 % auf 78,5 % gesteigert (+33 voll erreicht, 6 Indoor
metrisch hängend wegen uses<4 — kein Daten-Fudging).

## 2. ZUSAMMENFASSUNG (Session 11)

- **Welle XII (v1.10.38, `4435696`)** — 10 Pflanzen, Mix Heilpflanzen + Gemüse:
  tropaeolum-majus, apium-graveolens-rapaceum, ocimum-tenuiflorum,
  brassica-oleracea-capitata-rubra, plectranthus-barbatus,
  brassica-oleracea-gemmifera, houttuynia-cordata,
  petroselinum-crispum-tuberosum, pulmonaria-officinalis (PA-Warnungen!),
  raphanus-sativus-niger. **67/67 DOIs CrossRef-verifiziert**, ~40
  erfundene DOI-Kandidaten durch H1-Bot-Preflight verworfen.

- **Welle XIII (v1.10.39, `9b5c253`)** — 14 Indoor-Pflanzen (Indoor-Profil
  mit angepasstem Brief): aglaonema-commutatum, chlorophytum-comosum,
  cyclamen-persicum (Hildegard PD, Cochrane-2014 clinical_trial),
  dieffenbachia-seguine (highly-toxic-Workaround: toxic + Atemwegs-Warn),
  dracaena-fragrans, dracaena-trifasciata, dypsis-lutescens (pet_safe!),
  euphorbia-pulcherrima (Mythos-Korrektur), ficus-elastica,
  nephrolepis-exaltata (pet_safe!), phalaenopsis-spp (pet_safe!),
  philodendron-hederaceum, spathiphyllum-wallisii, zamioculcas-zamiifolia.
  **13/13 DOIs verifiziert**, NASA-Wolverton-1989 als Hauptquelle.

- **Welle XIV (v1.10.40, `cfb8537`)** — 10 Giftpflanzen (Safety-Profil):
  atropa-belladonna, papaver-rhoeas, convallaria-majalis, pulsatilla-vulgaris,
  taxus-baccata, dipsacus-fullonum, colchicum-autumnale (4 clinical_trial-
  DOIs: Terkeltaub, Levy/Peters, Tardif COLCORONA, Yurdakul),
  populus-tremula (Phytodolor 2× DOI), carpinus-betulus, rheum-rhabarbarum.
  **20/20 DOIs verifiziert** (1 Tippfehler korrigiert: jf000035p →
  jf9909196 Vastano 2000). 22 drug_interactions, ~40 contraindications.
  Schema-Fix: `internal_external` ist Pflichtfeld, `highly_toxic` existiert
  NICHT (Max ist `toxic`).

- **Welle XV (v1.10.41, `8d34466`)** — 5 Mix-Pflanzen: hyoscyamus-niger
  (Solanaceae, mittelalterl. Brauerei), helleborus-niger (Dioskurides PD,
  Hildegard), mentha-villosa, sempervivum-tectorum (Hildegard PD),
  ulmus-minor (Bachblüte Nr. 11 + U.-rubra-EMA-Monographie korrekt NICHT
  übertragen). **21/21 DOIs verifiziert**.

- **Agent-Brief v1.11** funktioniert ausgezeichnet: H1 (CrossRef-Preflight)
  hat in dieser Session ~70+ erfundene DOI-Kandidaten abgefangen. 0 EMA-
  Überzüge in 39 Pflanzen.

## 3. AKTUELLER DATENSTAND

| Metrik | Wert |
|--------|------|
| Pflanzen total | 223 |
| **Volle Tiefe Standard** (constituents≥5, harvest≥1, uses≥4) | 175 / 223 = 78,5 % |
| **Indoor-Sonderregel** (uses≥3 statt ≥4) | +6 Pflanzen |
| **Volle Tiefe gesamt** | **181 / 223 = 81,2 %** |
| Voll vertieft dieser Session | +33 (XII: 10, XIII: 8, XIV: 10, XV: 5) |
| validate:zod / validate:data | 223/223 / 223/223 |
| Tests | 285/285 grün |
| Build-Seiten | 477 clean |
| Live-Version | **v1.10.41** (`8d34466`), Deploy noch laufend |
| Session-Bilanz DOI-Verifikation | 121/121 CrossRef-OK, ~70 erfunden verworfen |

### Indoor-Sonderregel (eingeführt 2026-05-26, Session 12)

Sechs Pflanzen mit reinem Indoor-Profil (Targets: `air_quality`, `humidity`, `ornamental`, `formaldehyde`, `benzene`, `xylene`, `toluene`, `low_maintenance`, `wellbeing`, `ethnobotany` — keine genuinen Heilpflanzen-Anwendungen) gelten als **voll vertieft bei `uses ≥ 3`** (statt `≥ 4`):

- aglaonema-commutatum
- dieffenbachia-seguine
- dracaena-fragrans
- dypsis-lutescens
- philodendron-hederaceum
- zamioculcas-zamiifolia

Alle 6 erfüllen `constituents ≥ 5` und `harvest ≥ 1` (Welle XIII NASA-Wolverton-Recherche vollständig). Sie hängen einzig am uses-Schwellwert, der für reine Zier-/Luftqualität-Pflanzen naturgemäß enger ausfällt als für Heilpflanzen. Begründung: kein Daten-Fudging, ehrliche Profil-Differenzierung. Keine anderen Pflanzen der DB sind von dieser Regel betroffen (per `grep` 2026-05-26).

## 4. OFFENE TODOS / NÄCHSTE SCHRITTE

1. **Welle XVI** Richtung 85–90 % (Pool ~42 noch shallow): Mögliche Kandidaten:
   weitere Giftpflanzen (datura-stramonium, conium-maculatum, nerium-oleander,
   ricinus-communis, mandragora-officinarum, veratrum-album),
   Heilbäume/Sträucher (ilex-aquifolium, ligustrum-vulgare,
   robinia-pseudoacacia, prunus-laurocerasus, daphne-mezereum,
   symphoricarpos-albus), Garten-Zwiebelblumen (narcissus-pseudonarcissus,
   tulipa-gesneriana, hyacinthus-orientalis, hippeastrum-vittatum),
   sanfte Heilpflanzen (aerva-lanata, pelargonium-graveolens,
   plectranthus-caninus, salvia-elegans, tagetes-patula).
2. ~~6 Indoor-Metrik-Hänger nachschärfen~~ — **erledigt 2026-05-26** via
   Indoor-Sonderregel (siehe § 3, kein Daten-Touch).
3. 16 alte `ema_well_established` mini-auditieren (Punkt 2 aus Session 10).
4. Aufräumen: `_tmp/welle*/` (jetzt XII+XIII+XIV+XV dazu), `_tmp/audit/`,
   `_recovery_backup_2026-05-20/`.
5. Offen aus früheren Sessions: GitHub-Setup (Codex P20),
   ~~i18n.ts-Split (Codex P4)~~ — **erledigt 2026-05-26** (Session 12,
   Commit `8905ce7`): 827-LoC monolith → 14 Domain-Files unter
   `src/lib/i18n/{de,en}/{common,plant,indoor,plan,permaculture,
   symptoms,feedback}.ts` + Aggregator `i18n/{de,en}.ts`. Hub
   `i18n.ts` (28 LoC) re-exportiert `t()` + `otherLocale()`.
   Konsumenten unverändert. 285/285 Tests grün, 477 Build clean.
   Maikels Browser-Tests (iPad-Drag, Quiz, Plant-Tabs).
   ~~`git add --renormalize`-Commit~~ — **erledigt 2026-05-26** (Session 12):
   EOL-Drift war bereits gelöst (alle Files `i/lf w/lf` clean durch Welle-IX-XV-
   Commits), das wahre Issue war `core.filemode`-Drift Win↔Mac. Fix: `git config
   core.filemode false` lokal auf BUL-06 + Cleanup-Commit `ff1aedf`
   (`_tmp/welleO2/merge.py`-Deletion bestätigt). **Auf Mac auch nötig:**
   `git config core.filemode false` setzen, sonst kommt der Mode-Drift zurück.

## 5. WICHTIGE WARNUNGEN

- **Git-in-Nextcloud:** Beim Resume IMMER Working-Tree-Konsistenz prüfen
  (`git status` + `git log -1`).
- **Schema-Pitfalls in dieser Session entdeckt:**
  - `internal_external` ist Pflichtfeld für jeden use (Atropa+Papaver
    nachgepatcht). In Welle-XV+-Briefs prominent erwähnt.
  - `toxicity_level` Max ist `toxic` — `highly_toxic` existiert NICHT.
  - Schema-`form`-enum hat KEINE `decorative` Option — Indoor-Workaround
    ist `form="raw" + target=["air_quality"] + internal_external="external"`.
- **EMA-Monographien NICHT übertragen** auf Cultivars/Verwandte (Welle XII:
  apium-graveolens-fructus → -rapaceum; Welle XIV: rheum-palmatum → -rhabarbarum;
  Welle XV: ulmus-rubra → -minor). H2-strict in allen Briefs.
- **node_modules cross-platform:** Bricht bei jedem Windows↔Mac-Handoff.
  Sollte aus Nextcloud-Sync ausgeschlossen werden (offen).
- **Welle-Agenten:** Prompt explizit `merge.py`/`npm` NICHT selbst ausführen
  lassen — alle Welle-XII-XV-Briefs hatten den Hinweis, keine Verletzung.
- **Commits `4435696`/`9b5c253`/`cfb8537`/`8d34466`** enthalten nur
  Pflanzen-JSONs. Session-/State-Dateien separat (Konvention).
- **Handoff:** dasselbe Projekt nicht gleichzeitig auf 2 Geräten öffnen.
- **Kein GitHub-Remote** — Deploy via
  `npx wrangler pages deploy dist --project-name=donum-dei --commit-dirty=true`.

## 6. ARTEFAKTE

- `_tmp/welleXII/` — 10 Snippets, merge.py, _h3_dois.txt (67 DOIs verified).
- `_tmp/welleXIII/` — 14 Snippets, merge.py, _h3_dois.txt (13 DOIs verified).
  Spezial: cyclamen-persicum + euphorbia-pulcherrima sind Volksmed.-tief.
- `_tmp/welleXIV/` — 10 Snippets, merge.py, _h3_dois.txt (20 DOIs verified).
- `_tmp/welleXV/` — 5 Snippets, merge.py, _h3_dois.txt (21 DOIs verified).
- `src/data/plants/*.backup_2026-05-24_pre_welle{XII,XIII,XIV,XV}` —
  P10-Backups vor Merge je Welle (insgesamt 39 Backups in dieser Session).
- Session-Datei-Backups `.backup_2026-05-24_1313_pre_save_session11`.

---

*Letzte Aktualisierung: 2026-05-24 13:13 — v1.10.41 LIVE. Session 11
auf Mac: Welle XII–XV (39 Pflanzen vertieft), Tiefe 175/223 = 78,5 %,
121/121 DOIs CrossRef-verifiziert, ~70 erfunden abgefangen, 0 EMA-
Überzüge. https://donum-dei.pages.dev/* 🌿
