# dev.to-Artikel — Entwurf

**Wo:** https://dev.to/new — Konto noetig, Anmeldung mit GitHub geht.
**Konto:** Maikels. Ich kann nicht veroeffentlichen.
**Tags:** `astro`, `react`, `seo`, `webdev`
**Canonical URL:** leer lassen (der Text erscheint nirgends sonst).
**Titelbild:** optional; ein Screenshot einer Pflanzenseite mit offener
Reiterleiste passt gut.

Hinweis: Der Artikel ist auf Englisch, weil dev.to englischsprachig ist. Alle
Zahlen darin sind gemessen, nicht geschaetzt — sie stammen aus
`scripts/textmenge.py` und den Commits `7b77c29`, `dc09d98`, `d2ad9e7`.

---

## Titel

**My Astro site looked empty to Google — and the tabs were the reason**

Alternativ, falls der erste zu reisserisch wirkt:
*Four fifths of my content never reached the crawler: a tabbed-island trap in Astro*

---

## Artikel zum Kopieren

---

Google rejected my site from AdSense three times with the same sentence:
*"Low value content."*

That was hard to accept, because the content was not the problem. It is a
database of 297 medicinal plants and fungi, bilingual, every single claim
carrying a real source — EMA monographs, NIH LactMed, ASPCA toxicity data,
clinical trials with DOIs. Hundreds of hours went into it.

So on the third rejection I stopped guessing what Google might dislike, and
measured instead.

## Measuring instead of guessing

I wrote a twenty-line script that walks the built `dist/` folder, strips
scripts, styles and tags from every `index.html`, and counts what is actually
left as visible text.

```python
def visible_text(path):
    html = open(path, encoding="utf-8").read()
    m = re.search(r"<main.*?</main>", html, re.S) or re.search(r"<body.*?</body>", html, re.S)
    s = re.sub(r"<script.*?</script>", "", m.group(0), flags=re.S)
    s = re.sub(r"<style.*?</style>", "", s, flags=re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    return len(re.sub(r"\s+", " ", s).strip())
```

The median plant detail page came out at 4574 characters. Not great, not
terrible. But when I actually read the extracted text of one page, something
was missing:

```
Plants > Green cardamom ... Description ... [full description text] ...
💊 Use  ⚠ Safety  🌾 Harvest  🧪 Constituents  📚 Sources
Spice  Seed  Internal  Traditional  [use text] ... More from this family
```

The tab *labels* were there. The content behind Safety, Harvest, Constituents
and Sources was not. Anywhere. On any of the 594 plant pages.

## The cause

The tab strip is a React island, mounted with `client:load`:

```astro
<PlantTabs plant={plant} locale={locale} client:load />
```

And inside it, the obvious React pattern:

```jsx
const [active, setActive] = useState('use')

return (
  <div id={`panel-${active}`} role="tabpanel" className="pt-4">
    {active === 'use' && <UseTab plant={plant} locale={locale} />}
    {active === 'safety' && <SafetyTab plant={plant} locale={locale} />}
    {active === 'harvest' && <HarvestTab plant={plant} locale={locale} />}
    {active === 'constituents' && <ConstituentsTab plant={plant} locale={locale} />}
    {active === 'sources' && <SourcesTab plant={plant} locale={locale} />}
  </div>
)
```

This is correct React. It is also, for a static site, a quiet disaster.

Astro server-renders islands at build time. It renders them **once**, in their
initial state. `active` is `'use'`, so the server renders the Use panel — and
nothing else. The other four panels do not exist in the HTML that leaves the
server. They come into being only when a human clicks, in a browser, after
hydration.

A crawler does not click. Four fifths of my carefully sourced content —
safety warnings, drug interactions, active constituents, the entire source
list — was invisible to every search engine on earth.

The `useState` default that seems like a rendering detail is, on a static
site, a decision about what gets published.

## The fix

Render every panel, hide the inactive ones with the plain HTML `hidden`
attribute:

```jsx
{visibleTabs.map(tab => (
  <div
    key={tab}
    id={`panel-${tab}`}
    role="tabpanel"
    aria-labelledby={`tab-${tab}`}
    hidden={tab !== active}
    className="pt-4"
  >
    {tab === 'use' && <UseTab plant={plant} locale={locale} />}
    {tab === 'safety' && <SafetyTab plant={plant} locale={locale} />}
    {tab === 'harvest' && <HarvestTab plant={plant} locale={locale} />}
    {tab === 'constituents' && <ConstituentsTab plant={plant} locale={locale} />}
    {tab === 'sources' && <SourcesTab plant={plant} locale={locale} />}
  </div>
))}
```

Nothing changes for the user: exactly one panel is visible, clicking still
switches, and `hidden` keeps the others out of the accessibility tree, which
is what a tabpanel wants anyway.

Everything changes for the crawler. Same build, this one change:

```
plant pages under 1500 characters:   22  ->   0
site pages under 1500 characters:    40  ->  18
median plant page:                 4574  -> 9352 characters
thinnest plant page:               1144  -> 2081 characters
```

The content had been sitting in the JSON files the whole time. It was simply
never delivered.

## How to check your own site

You do not need my script. One line, against your built output or your live
site:

```bash
curl -s https://your-site.example/some-page/ | grep -o 'role="tabpanel"' | wc -l
```

If you have five tabs and this prints `1`, you have the same problem.

A warning on that command: use `grep -o ... | wc -l`, not `grep -c`. `grep -c`
counts matching *lines*, and minified HTML is one line. It will happily print
`1` for a page with five panels and send you chasing a bug that is not there.
Ask me how I know.

Then look at the extracted text, not the rendered page. The browser shows you
the hydrated result. The crawler sees what came off the server. Those are two
different documents, and only one of them gets indexed.

## Where this applies

Not just Astro, and not just tabs. Any framework that server-renders an
interactive component once, in its initial state, ships only that state. The
pattern to look for is a conditional render keyed on component state:

- tab panels: `{active === x && <Panel />}`
- accordions where closed sections are not rendered at all
- "show more" blocks that mount content on click
- carousels that render only the current slide
- modals holding real content

Anything guarded by `useState` is a publishing decision on a static site.

The general rule: **hide with CSS or `hidden`, do not gate with a conditional
render** — unless you actively want that content unpublished.

## The honest ending

Did fixing this get me into AdSense?

No. The fix went live, I asked for another review, and the answer came back as
the same sentence a third time.

Because the thin content was never the real problem either. My site sits on a
free `*.pages.dev` subdomain, it has no visitors, and — until this week — it
had exactly zero inbound links. No link means no crawl path, no crawl means no
index, and an unindexed site with no traffic reliably gets that same
boilerplate rejection no matter how good the writing is.

So this fix did not solve my actual problem. I am telling it anyway, because
the bug is real, it silently affected 594 pages, it would have kept hurting
after the real problem was solved, and I have not seen it written up anywhere.

Measure your delivered HTML. Do not trust the browser, and do not trust your
own good intentions about the content. Only the bytes that leave the server
count.

---

*Donum Dei is a free bilingual medicinal plant database — 297 species, every
claim sourced, offline-capable. Built with Astro. The code is on
[GitHub](https://github.com/jpeter00995-del/Donum_Dei).*
