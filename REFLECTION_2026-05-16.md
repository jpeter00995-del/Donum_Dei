# Reflection — Donum Dei Setup
**Date:** 2026-05-16 ~10:30 Sofia
**Author:** Claude (Opus 4.7) for MG
**Purpose:** Honest review of the project setup work done in Session 1, so the next session (post-Superpowers-install) can pick up with a clear view of what to keep, what to reconsider, and what was missed.

---

## ✅ Solid decisions (keep)

1. **Multi-source data schema with mandatory `source` attribution** — clean foundation, scales to hundreds of plants without restructure.
2. **Astro static-first** — defers hosting decision indefinitely without code changes.
3. **Bilingual DE/EN + Latin botanical name always visible** — distinctive UX, scientifically correct.
4. **Alphabetical seeding (A → Z)** — review-friendly, pauseable at letter boundaries.
5. **Public-domain rule for direct quotes** — legally safe (Hildegard, Künzle †1945, Madaus †1942 all PD in DE).
6. **CC-licensed images only** with author + URL stored — legally safe and morally right.
7. **Educational disclaimer** on every page — important guardrail for a medical-adjacent topic.
8. **Project location `75_Maikel/Donum_Dei/`** — fits Maikel's personal area, ACL inherits.
9. **ACL fallback file** when the central `00_meta/acl_requests.json` is read-only — pragmatic.

---

## ⚠️ Questionable decisions — re-examine with /brainstorm

| # | Decision | Concern | Suggested alternative |
|---|----------|---------|----------------------|
| 1 | 50 plants in v1 | A lot to scrape, structure, photograph, curate before anything ships | MVP with 5-10 plants (full loop scraper → JSON → UI → live), then expand to 50 |
| 2 | All four features in v1 (Cards + Map + Calendar + Quiz) | Classic scope trap. Each is a small product in itself. | Phase: v0.1 Cards-only, v0.2 +Map, v0.3 +Calendar, v0.4 +Quiz. Each phase ships. |
| 3 | Data-first build order (scrapers first, then UI) | UI-first with mock data gives faster motivational feedback ("ooh, that looks cool") | Mock 5 plants in JSON manually → build PlantCard + DetailPage → only then write scraper to bulk-fill |
| 4 | Scrape folk knowledge from forums | Legal + ethical grey zone. ToS varies, attribution is fragile. | v1: drop entirely. Only PD-classical + explicit-CC blog content with author permission. Folk knowledge later if at all. |
| 5 | PubMed studies linked per plant in v1 | Complex scraping/parsing for limited initial value | v2 — once cards + map are solid, then add evidence layer |
| 6 | Full DE+EN content for all 50 from day 1 | Doubles content workload, slows seeding | Toggle-infrastructure from day 1 (UI ready), but EN content allowed to lag DE — show "EN coming soon" badge when missing |

---

## 🕳️ Forgotten / not discussed

1. **`git init`** for the project — if Maikel wants to learn webdev properly, git is part of it. Local-only initially is fine.
2. **Node.js version check** — confirm Maikel's Mac has Node ≥ 20 LTS. If not, install via nvm or homebrew.
3. **Full-text search** — Maikel said "interaktiv" originally; we covered filter/quiz/map but never explicit search. Pagefind (Astro's official choice) is easy to add.
4. **About page explaining the name "Donum Dei"** — religious/personal framing deserves a dedicated, dignified About page so the name lands well for visitors.
5. **PWA from start** — offline outdoor use ("schau ich im Wald nach") is a strong fit. Astro PWA plugin exists. Decide now or face refactor later.
6. **Image optimization strategy** — 50 plants × multiple sizes (thumb / card / hero) = significant data. Astro `<Image>` handles it but must be used consistently.
7. **URL slug convention per plant** — `/plant/urtica-dioica` (Latin), `/plant/brennnessel` (DE), or both as aliases? Affects SEO + sharing.
8. **Quiz scoring + progress persistence** — localStorage only? Or eventually some backend? Decide before quiz dev.

---

## 🔄 Process reflection (how we worked)

- **Many Q&A rounds before any code** — appropriate for brand-new project, but Superpowers `/brainstorm` would compress this into a more structured pass.
- **CONVENTIONS.md written in detail before any line of code exists** — gives anchor, but some decisions will inevitably change once we start building. Treat it as v1.0, not gospel.
- **Recommended next moves with Superpowers loaded:**
  1. `/brainstorm` on "v1 scope cut" — agree on which features and how many plants ship in v0.1
  2. Update `CONVENTIONS.md` to v1.1 reflecting scope cuts
  3. `/write-plan` — convert spec into an action plan with check-points
  4. `/execute-plan` — work it disciplined, with verification-before-completion between steps

---

## Specific items I recommend deciding first thing next session

1. **v0.1 plant count:** 5? 10? all of A?
2. **v0.1 feature set:** only Cards (browse + detail)? Or Cards + simple filter?
3. **Data approach:** mock JSON for v0.1, scraper for v0.2?
4. **Git:** init local repo now? Add `.gitignore` for `node_modules/`, `dist/`, etc.?
5. **Node version:** check + decide nvm/homebrew if missing
6. **PWA in or out for v1?**

---

*End of reflection.*
