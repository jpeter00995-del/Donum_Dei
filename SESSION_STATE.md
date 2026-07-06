# SESSION STATE — Donum Dei

> ✅ **SEO-FIX LIVE (2026-07-06, BUL-06, Session 27):** Google-Search-Console-Meldung „Duplikat – Google
> hat eine andere Seite als der Nutzer als kanonische Seite bestimmt" (betroffen: `/de/`) behoben.
> hreflang für Startseiten `/de/`↔`/en/` + einheitlicher x-default (Commit `ed64e03`). Zusätzlich
> Vorsorge: dünne Light-Sprachseiten `/fr//es//bg/` auf `noindex,follow` (Commit `802a2dc`). Beide
> committet + gepusht + deployed + live-verifiziert. Nebenbei: Sync-Konflikt (PC hing hinter GitHub)
> sauber per Fast-Forward gelöst.

## META
- last_updated: 2026-07-06 10:40 (BUL-06) — Session 27: SEO-Canonical/hreflang-Fix + noindex Light-Sprachen, LIVE
- save_type: SAVE (Session 27 — BUL-06 Windows)
- device: BUL-06 (Windows 11)
- hostname: BUL-06
- tool: Claude Code (Opus 4.8)
- session_uid: mba-mg-claude-code-session10 (durable, beibehalten)
- run_uid: run-20260706-bul06-claude-code-session27
- project: Donum_Dei
- actor: MG
- current_version: **v1.11.2** Inhalt + SEO-Fixes (commits ed64e03 + 802a2dc) — **deployed (2026-07-06 BUL-06), LIVE**
- live_url: https://donum-dei.pages.dev/ (**LIVE**: 281 Pflanzen / 297 Einträge / 637 Seiten / 1.707 Quellen)
- github_remote: https://github.com/jpeter00995-del/Donum_Dei (main = origin/main = **802a2dc**, synchron)
- git_initialized: true
- last_conventions_check: 2026-07-06
- einträge_total: **297** (281 Pflanzen + 16 Pilze)
- cortex_session_status: n/a (MG-Projekt, non-PERSEUS)

## 1. KONTEXT
Session 27 (BUL-06 Windows, Opus 4.8): Resume auf Donum Dei. Maikel meldete eine Google-Search-Console-
E-Mail: „Duplikat – Google hat eine andere Seite als der Nutzer als kanonische Seite bestimmt". Betroffene
URL laut GSC-Screenshot: `https://donum-dei.pages.dev/de/`. Ursache diagnostiziert (Live-Abruf + Code):
Startseiten `/de/` und `/en/` zeigen dasselbe Pflanzen-Raster, hatten aber keine hreflang-Verknüpfung →
Google hielt sie für Doppelgänger. Fix + Vorsorge umgesetzt, getestet, deployed, live-verifiziert.

## 2. ZUSAMMENFASSUNG (Session 27)

### Fix 1 — hreflang für Startseiten (Commit ed64e03)
- `src/pages/de/index.astro` + `en/index.astro`: `altPath` ergänzt → beide Startseiten geben jetzt
  reziprokes hreflang de↔en aus.
- `src/layouts/BaseLayout.astro`: x-default zeigt jetzt von BEIDEN Sprachversionen einheitlich auf die
  deutsche (Default-)URL (`xDefaultURL`). Vorher: self-referencing = widersprüchlich.
- Beweis: Live-Abruf `/de/` + `/en/` zeigt korrektes canonical + hreflang de/en/x-default→/de/.

### Fix 2 — noindex für dünne Light-Sprachseiten (Commit 802a2dc)
- `BaseLayout.astro`: neue optionale Prop `noindex?: boolean` → gibt `<meta name="robots" content="noindex, follow">` aus.
- `src/pages/{fr,es,bg}/index.astro`: `noindex` gesetzt (reine Sprach-Shells, CTAs zeigen nach `/en/`).
- Beweis: Live-Abruf `/fr//es//bg/` = noindex; `/de//en/` = KEIN robots-Tag (korrekt).

### Sync-Konflikt gelöst (wichtig, siehe §5)
- Lokaler HEAD hing auf `4e2e3a5` (vor Session 26), Session-26-Inhalte lagen nur als nicht-committete
  NC-Sync-Dateien im Ordner. origin/main war bereits `506bb06`.
- Geprüft: lokal ist sauberer Vorfahr; alle uncommitted-Dateien schon in origin/main oder identisch.
- Gelöst per `git checkout -- <files>` + `git merge --ff-only origin/main` (KEIN reset --hard — vom
  Safety-Hook blockiert und nicht nötig). Kollidierende untracked Pflanzen-Dateien vorher gesichert + entfernt.
- Meine 3 hreflang-Dateien aus Backup wieder aufgesetzt → sauber auf 506bb06 committet.

## 3. AKTUELLER DATENSTAND

| Metrik | Wert |
|--------|------|
| Einträge total | **297** (281 Pflanzen + 16 Pilze) |
| Tests | 324/324 grün |
| Build-Seiten | 637 clean |
| origin/main | **802a2dc** (synchron, LIVE) |
| Live SEO | `/de/`+`/en/` mit hreflang; `/fr//es//bg/` noindex |

## 4. OFFENE TODOS / NÄCHSTE SCHRITTE
1. **Google Search Console beobachten:** Fix für `/de/` ist live; Google braucht Tage–Wochen zum
   Neu-Crawlen. Laufende Prüfung ggf. neu starten („Fehlerbehebung überprüfen"); alternativ URL-Prüftool
   → „Indexierung beantragen".
2. **„sect."-Matching glätten** (aus Session 25/26 offen): `sect.`/`ser.` wie `subsp.` in `src/lib/plantMatch.ts` behandeln (+ Test).
3. **State-Docs vs NC-Sync** (aus Session 25/26): SESSION_STATE/CHAT_CONTEXT/… sind git-getrackt UND NC-gesynct
   → kollidieren (genau das verursachte diese Session den Sync-Konflikt; die git-committeten State-Docs sind
   teils uralt = Session 11). Grundsätzlich lösen (committen ODER aus NC-Sync/Git nehmen).
4. Optional weitere Content-Wellen (Grindelia, Salvia sclarea, Foeniculum-Varianten).
5. Optional: Homepage-Perf-Feinschliff; große Fotos nachkomprimieren.

## 5. WICHTIGE WARNUNGEN / ENTSCHEIDUNGEN
- **GitHub = einzige Wahrheit. `.git` NIE über Nextcloud syncen.** Pro Session `git fetch` + HEAD-Vergleich.
  Diese Session zeigte erneut: lokaler PC-Stand kann per NC-Sync „scheinbar" neuer wirken, ist aber git-technisch alt.
- **`git reset --hard` ist per Safety-Hook blockiert** (BUL-06). Ersatz für „auf origin setzen": `git checkout -- <files>` +
  `git merge --ff-only origin/main`. Kollidierende untracked Dateien vorher wegsichern + entfernen.
- **`rm -rf` ist ebenfalls Hook-blockiert** → einzelne Dateien / frische Zielordner statt Löschen.
- **Deploy nur aus Ordner AUSSERHALB Nextcloud** (NC-`.~`-Temp-Falle). Kein `rsync` in Git Bash auf BUL-06 →
  `cp -r "$SRC/." "$DST/"` in frischen Scratchpad-Ordner, dann `npx wrangler pages deploy <kopie> --project-name=donum-dei --commit-dirty=true` (eingeloggt jpeter00995@gmail.com).
- **Windows-Rollup-Falle** nach NC-Sync vom Mac: `npm i --no-save --legacy-peer-deps @rollup/rollup-win32-x64-msvc@<version>` (hier 4.60.4; package.json unberührt).
- **SEO-Regeln jetzt im Layout:** hreflang nur wenn `altPath` gesetzt; x-default IMMER auf DE-URL; `noindex`-Prop für dünne Shell-Seiten.

## 6. ARTEFAKTE (Session 27)
- `src/layouts/BaseLayout.astro` — x-default-Fix + neue `noindex`-Prop + robots-Tag.
- `src/pages/{de/index,en/index}.astro` — `altPath` für hreflang.
- `src/pages/{fr/index,es/index,bg/index}.astro` — `noindex`.
- Commits: `ed64e03` (hreflang), `802a2dc` (noindex). origin/main = 802a2dc.
- Backups dieser Session: Scratchpad `donum_backup_20260706_094906/` (hreflang-Dateien, state-docs, untracked plants).

## 7. NÄCHSTER SCHRITT
Saubere Pause möglich — alles live + synchron auf `802a2dc`. Nächste Arbeit: GSC-Ergebnis beobachten,
`sect.`-Matching-Fix (§4.2), oder das State-Docs-vs-NC-Thema (§4.3) grundsätzlich lösen.

---
*2026-07-06 10:40 Sofia. Session 27 BUL-06 (Opus 4.8) — SEO: Duplikat-/Canonical-Fix (hreflang Startseiten +
x-default) + noindex Light-Sprachen. Beide LIVE. Sync-Konflikt sauber gelöst. 297 Einträge. 🌿*
