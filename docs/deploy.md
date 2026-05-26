# Deploy — Donum Dei

Donum Dei ist ein statisches Astro-Projekt: `npm run build` erzeugt `dist/` mit reinem HTML/CSS/JS. Das deployt überall hin, kostenlos.

## Optionen im Überblick

| Anbieter | Kosten | Setup | Custom Domain | CI/CD via git push |
|----------|--------|-------|---------------|---------------------|
| **Cloudflare Pages** | kostenlos (unbegrenzt) | 5 Min | ja, gratis | ja |
| **Vercel** | kostenlos (Hobby-Tier) | 3 Min | ja, gratis | ja |
| **Netlify** | kostenlos (100GB/Monat) | 3 Min | ja, gratis | ja |
| **GitHub Pages** | kostenlos | 10 Min | ja, gratis | ja |
| **Eigener Webspace** | je nach Provider | 5 Min | ja | nein (Drag-Drop) |

**Empfehlung:** Cloudflare Pages — keine Bandbreitenlimits, schnellstes CDN weltweit, kein Cold-Start.

---

## Cloudflare Pages (empfohlen)

### Variante A — direkt aus `dist/` (Drag & Drop)

1. `npm run build` lokal ausführen → `dist/` entsteht.
2. https://pages.cloudflare.com aufrufen, Account anlegen (kostenlos).
3. "Create Project" → "Upload Assets" → `dist/` Ordner reinziehen.
4. Projekt-Name vergeben (z.B. `donum-dei`).
5. Fertig — Live-URL nach ~30 Sek (z.B. `donum-dei.pages.dev`).

Re-deploy: nochmal `npm run build` + nochmal hochladen.

### Variante B — git-basiert (empfohlen für Updates)

1. Code zu einem git-Remote pushen (GitHub, GitLab, Bitbucket).
2. Cloudflare Pages → "Connect to Git" → Repository auswählen.
3. Build-Settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output: `dist`
   - Node version: **20** (via Environment Variable `NODE_VERSION=20`)
4. Save & Deploy.

Jeder `git push` löst automatisch ein Rebuild + Deploy aus.

### Custom Domain

In Cloudflare Pages → Project → Custom Domains → Domain anhängen. Cloudflare richtet DNS + SSL automatisch ein (falls Domain bereits bei Cloudflare; sonst CNAME setzen).

---

## Vercel

1. `npm install -g vercel` (einmalig).
2. Im Projekt-Ordner: `vercel` → Anweisungen folgen (erstes Mal: Account, danach git-verlinkt).
3. `vercel --prod` für Production-Deploy.

Alternativ: https://vercel.com/new → git-Repo verbinden → Astro wird auto-detected.

---

## Netlify

`https://app.netlify.com/drop` → `dist/` Ordner reinziehen → fertig.

---

## GitHub Pages

1. Code zu GitHub pushen.
2. Im Repo: `.github/workflows/deploy.yml` mit Astro-Action anlegen (Beispiel: https://docs.astro.build/en/guides/deploy/github/).
3. Repo Settings → Pages → Source: "GitHub Actions".

---

## Eigener Webspace (FTP/SFTP)

1. `npm run build` lokal.
2. Inhalt von `dist/` via FTP/SFTP in den Web-Root des Servers hochladen.
3. Wichtig: Apache/nginx muss `/de/` und `/en/` als Verzeichnisse mit `index.html` ausliefern. Standardmäßig kein Problem.

---

## Domain-Empfehlung

`donum-dei.de` oder `donum-dei.org` — bei Hetzner, INWX oder Namecheap ab ~10€/Jahr. Bei Cloudflare-Registrar ohne Aufschlag.

---

## Pre-Launch Checkliste

- [ ] `npm run build` läuft fehlerfrei
- [ ] `npm run preview` zeigt korrekte Seite lokal
- [ ] Auf Mobil getestet (Filter, Karte, Quiz)
- [ ] Disclaimer-Footer auf allen Seiten sichtbar
- [ ] Source-Attribution korrekt
- [ ] Bildlizenzen geprüft (alle CC oder PD)
- [ ] sitemap-index.xml in `dist/` vorhanden
- [ ] robots.txt entscheiden (initial: erlaubt all, oder disallow bis ready)
- [ ] Domain entschieden + registriert
- [ ] Datenschutzerklärung + Impressum (in DE Pflicht bei öffentlichen Sites!)

**Datenschutz/Impressum:** Wenn Donum Dei öffentlich + namentlich gehört, brauchst du laut TMG/DSGVO in DE ein Impressum und eine Datenschutzerklärung. Bei reiner statischer Seite ohne Cookies/Tracking ist beides minimal — aber rechtlich Pflicht. Generatoren: e-recht24.de oder datenschutz-generator.de.

---

## Nach dem Deploy

- Pflanze neue Daten lokal (Scraper oder hand-curate)
- `npm run build` + push (oder Drag-Drop) → live in Sekunden
- Optional: Lighthouse-Score checken (`npm run preview` + Chrome DevTools)
