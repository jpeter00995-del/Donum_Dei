# Active Task

**Task:** None — SEO-Duplikat-Fix (hreflang + noindex) abgeschlossen, LIVE auf 802a2dc
**Started:** —
**Status:** DONE
**Current Step:** —

## Was in Session 27 (BUL-06) erledigt wurde

- Google-Search-Console-Meldung „Duplikat – Google hat eine andere Seite als der Nutzer als
  kanonische Seite bestimmt" (betroffen: /de/) diagnostiziert + behoben.
- Fix 1 (ed64e03): hreflang de↔en für Startseiten /de/ /en/ (altPath) + BaseLayout x-default
  einheitlich auf DE-URL (war widersprüchlich self-referencing).
- Fix 2 (802a2dc): dünne Light-Sprachseiten /fr/ /es/ /bg/ auf robots noindex,follow (neue
  BaseLayout-Prop `noindex`).
- Beide committet + gepusht + deployed + LIVE-verifiziert (Produktions-curl).
- Sync-Konflikt (lokaler HEAD hing auf 4e2e3a5 hinter origin 506bb06) sauber per checkout + ff-merge
  gelöst; nichts verloren, Backups im Scratchpad.
- Build 637 Seiten grün, Tests 324/324 grün.

## Next session

1. GSC-Ergebnis für /de/ beobachten (Neu-Crawl dauert Tage–Wochen; ggf. Prüfung neu starten /
   Indexierung beantragen).
2. State-Docs-vs-NC-Sync grundsätzlich lösen (git-committete State-Docs teils uralt = Session 11).
3. Optional: sect.-Matching-Fix in plantMatch.ts; weitere Content-Wellen.
