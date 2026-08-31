# Verweise von aussen — was sich lohnt und was schaden wuerde

Stand 2026-08-31. Ausgangslage: Die Seite hatte **keinen einzigen Verweis von
aussen**. Google findet Seiten, indem es Links folgt — ohne Link kein Besuch,
ohne Besuch kein Eintrag im Katalog, ohne Eintrag keine AdSense-Freigabe.

## Vorbemerkung: warum die Standardliste hier falsch waere

Das Marketing-Werkzeug im Workspace kennt rund 250 Verzeichnisse. Der
allergroesste Teil davon ist fuer Donum Dei **ungeeignet oder schaedlich**:

- Startup- und SaaS-Verzeichnisse (Product Hunt, G2, Capterra, AppSumo …)
  erwarten ein Produkt mit Preisseite und Kundenbewertungen. Donum Dei ist
  kostenlos und verkauft nichts.
- Massen-Profilseiten (Tumblr, LiveJournal, About.me, Weebly, HubPages …)
  liefern zwar Links, aber es sind genau die Links, die Google als kuenstlich
  erkennt. Bei einer Seite, die ohnehin schon als „minderwertig" eingestuft
  ist, waere das die schlechteste denkbare Idee.
- Bezahlte Eintragsdienste: nie. Alles Sinnvolle ist kostenlos.

**Regel fuer dieses Projekt: nur Verweise, die auch ohne Suchmaschine Sinn
ergaeben.** Wenn ein Eintrag einem Menschen nichts bringt, bringt er uns auch
bei Google nichts.

---

## Erledigt

| Quelle | Was | Stand |
|--------|-----|-------|
| github.com | Repo-Feld „Website" gesetzt, Beschreibung aktualisiert | 2026-08-31 ✅ |

Kontrolle: `curl -s https://github.com/jpeter00995-del/Donum_Dei | grep donum-dei.pages.dev`
→ drei Treffer. Der Link steht im ausgelieferten HTML.

---

## Lohnt sich — in dieser Reihenfolge

### 1. Astro-Showcase (astro.build/showcase)

Die Seite ist mit Astro gebaut. Astro fuehrt eine offizielle Galerie von
Seiten, die damit gebaut wurden. Eintrag laeuft ueber eine GitHub-Diskussion
im Repo `withastro/astro.build`; ein woechentlicher Ablauf zieht die
eingereichten Adressen und legt sie an.

Warum gut: redaktionell gepflegt, thematisch ehrlich (die Seite *ist* mit
Astro gebaut), starke Domain, und dort schauen echte Entwickler nach
Beispielen.

Aufwand: eine Nachricht. Braucht Maikels GitHub-Konto.

### 2. Wikidata-Eintrag

Wikidata ist die offene Datenbank hinter Wikipedia. Ein Eintrag als Projekt
mit Link auf die Seite ist zulaessig, wenn das Projekt einordbar ist.

Warum gut: Wikidata wird von Google, ChatGPT, Claude und Perplexity als
Grundlage benutzt. Das ist einer der wenigen Eintraege, der auch dafuer sorgt,
dass KI-Systeme die Seite ueberhaupt kennen.

Achtung: **Kein Eintrag in Wikipedia-Artikeln selbst.** Externe Links in
Artikel zu setzen gilt dort als Werbung und wird zurueckgesetzt.

### 3. Ein echter Fachartikel auf dev.to oder Hashnode

Nicht „schaut mal meine Seite an", sondern ein richtiger Werkstattbericht.
Material ist reichlich da:

- „297 Heilpflanzen mit Quellenpflicht — wie man eine Datenbank baut, in der
  jede Aussage belegt ist"
- „Warum meine Astro-Seite fuer Google leer aussah" — die Reiter-Geschichte
  aus Sitzung 35. Das ist ein echter, uebertragbarer Befund, den andere
  Entwickler brauchen koennen.

Warum gut: ein Artikel, den Menschen lesen wollen, ist die einzige Art von
Verweis, die dauerhaft traegt. Und der zweite Titel ist ehrlich interessant.

### 4. Fach-Linklisten Kraeuter/Heilpflanzen

Handverlesene Sammlungen, keine Kataloge. Kandidaten:

- Henriette's Herbal (henriettes-herb.com) — Linkliste, redaktionell gepflegt
- Plants For A Future (pfaf.org) — Community-Bereich
- deutschsprachige Kraeuter-Foren und Selbstversorger-Seiten mit Linklisten

Vorgehen: anschreiben, Seite vorstellen, um Aufnahme bitten. Kein
Automatismus, keine Massenmail. Zwei bis drei gut gewaehlte schlagen zwanzig
wahllose.

### 5. Awesome-Listen auf GitHub

Kuratierte Themenlisten, in die man per Pull Request eintraegt. Passend waeren
Listen zu Astro, zu PWAs und zu offenen Datensammlungen. Aufnahme nur, wenn
die Liste thematisch wirklich passt — sonst wird der PR zu Recht abgelehnt.

---

## Ausdruecklich nicht

- Links in Wikipedia-Artikel setzen
- Massen-Webkataloge und „Linktausch"
- bezahlte Eintragsdienste
- Kommentare unter fremden Blogartikeln mit Link
- Profile auf Plattformen, die mit dem Thema nichts zu tun haben, nur um einen
  Link zu bekommen

Das ist alles genau das Verhalten, das Google als „minderwertig" einstuft.
Bei einer Seite, die schon dreimal deshalb abgelehnt wurde, waere es
kontraproduktiv.

---

## Was Maikel selbst machen muss

Alles, was ein Konto oder eine Veroeffentlichung in seinem Namen braucht:
GitHub-Diskussion beim Astro-Showcase, Wikidata-Konto, dev.to-Artikel
veroeffentlichen, die Fach-Linklisten anschreiben. Ich kann die Texte
vorbereiten und die Stellen heraussuchen — abschicken tut er.

Kein YouTube-Kanal vorhanden (Stand 2026-08-31), deshalb faellt dieser Weg
vorerst weg.
