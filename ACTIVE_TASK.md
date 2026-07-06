# Active Task

**Task:** None — Design-Akzent-Pass abgeschlossen, LIVE auf 94e548b
**Started:** —
**Status:** DONE
**Current Step:** —

## Was in Session 28 (BUL-06) erledigt wurde

- Zurückhaltender Design-Akzent-Pass (frontend-design-Skill), kein Umbau:
  - Feine grüne Akzentlinie oben (BaseLayout).
  - Warmes Off-White `--color-paper: #faf9f6` als Seitengrund.
  - Startseiten-Hero DE/EN: Live-Kennzahl (`home.eyebrow`, echte Pflanzenzahl) + Untertitel + grüner Schimmer.
  - Blatt-Marker (`.leaf-heading`, maskiertes emerald-Blatt) an 5 Detail-Überschriften.
  - Pflanzen-Karten feiner: rounded-xl, sanfter Schatten, Titel-Hover-Akzent.
- AdSense nur noch in Produktion (`import.meta.env.PROD`) — Dev sauber.
- Commit `5458054` → gepusht → Cloudflare-deployed → live-verifiziert (curl Prod: Hero/bg-paper/Akzentlinie/leaf-heading da).
- Build 637 Seiten grün, 324 Tests grün.
- State-Docs von Session 27 nachträglich committet (`94e548b`).
- Context7 fürs Projekt aktiviert (Astro `/withastro/docs`) — heute nicht gebraucht, steht bereit.

## Next session

1. Hero-Kennzahl-Wording: „297 Pflanzen" zählt 16 Pilze mit → ggf. „Einträge" oder nur Pflanzen.
2. GSC-Duplikat-Fix (Session 27) beobachten.
3. Phase B (AdSense/Affiliate) wenn echte Besucher da.
4. Optional weitere Design-Feinschliffe; `sect.`-Matching in plantMatch.ts.
