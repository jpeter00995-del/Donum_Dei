// === 1. ZWECK ===
// Serverseitig gerenderter Einleitungstext fuer die Werkzeug-Seiten.
//
// Hintergrund (2026-08-10, zweite AdSense-Ablehnung „Minderwertige Inhalte"):
// Die interaktiven Seiten waren reine React-Einhaengepunkte. Im ausgelieferten
// HTML stand dort fast nichts — `/de/mein-garten/` enthielt EIN Zeichen
// sichtbaren Text, `/de/mischkultur/` 400. Alle diese Seiten standen
// gleichzeitig in der Sitemap. Ein Crawler wurde also eingeladen, leere
// Seiten zu indexieren.
//
// Die Texte hier sind kein Fuellmaterial: Sie erklaeren, was das Werkzeug
// tut, geben Sachwissen zum Thema und sagen, wo die Grenzen liegen. Sie
// stehen VOR der Komponente und sind auch ohne JavaScript lesbar.

type Texte = { de: string[]; en: string[] };

export const SEITEN_TEXT: Record<string, Texte> = {
  // === 2. GARTEN-PLANER ===
  meinGarten: {
    de: [
      'Der Garten-Planer stellt aus deinen Angaben einen Pflanzvorschlag zusammen: Klimazone, Art der Fläche — Balkon, Hochbeet, Freiland — und wie viel Platz du hast. Daraus entsteht eine Auswahl aus der Datenbank, dazu ein Aussaat- und Erntekalender über das Jahr und Hinweise, welche Pflanzen nebeneinander gut zurechtkommen.',
      'Alles bleibt in deinem Browser. Es gibt kein Konto, keine Anmeldung und keinen Server, der mitschreibt. Wenn du den Browserspeicher löschst, ist der Plan weg — dafür verlässt er auch nie dein Gerät. Zum Aufbewahren gibt es den Druck- und Export-Knopf.',
      'Zwei Dinge, die mehr bringen als jede Sortenwahl: Beobachte zuerst eine Woche lang, wie lange die Sonne wirklich auf die Fläche fällt — die meisten Fehlschläge sind Standortfehler, keine Pflegefehler. Und fang kleiner an, als du möchtest. Vier Töpfe, die du wirklich gießt, tragen mehr als zwanzig, die im Juli vertrocknen.',
    ],
    en: [
      'The garden planner turns your answers into a planting proposal: climate zone, the kind of space — balcony, raised bed, open ground — and how much room you have. From that it selects plants from the database, adds a sowing and harvest calendar across the year, and shows which plants get along side by side.',
      'Everything stays in your browser. There is no account, no sign-in and no server taking notes. Clear your browser storage and the plan is gone — but in exchange it never leaves your device. Use the print and export button to keep a copy.',
      'Two things matter more than any choice of variety: first watch for a week how long the sun actually reaches the spot — most failures are the wrong location, not poor care. And start smaller than you would like. Four pots you actually water will give you more than twenty that dry out in July.',
    ],
  },

  // === 3. MISCHKULTUR ===
  mischkultur: {
    de: [
      'Mischkultur heißt, verschiedene Arten bewusst nebeneinander zu setzen, statt jedes Beet mit einer einzigen zu belegen. Der Gedanke ist alt und einfach: Pflanzen, die unterschiedlich tief wurzeln, nehmen sich das Wasser nicht weg. Pflanzen mit kräftigem Duft können Schädlinge irritieren, die ihre Wirtspflanze am Geruch finden. Und Hülsenfrüchtler sammeln über Knöllchenbakterien Stickstoff aus der Luft, von dem die Nachbarn mitprofitieren.',
      'Die bekannteste Kombination ist Möhre und Zwiebel: Der Zwiebelgeruch stört die Möhrenfliege, der Möhrengeruch die Zwiebelfliege. Klassisch sind außerdem Bohne mit Bohnenkraut, Tomate mit Basilikum und Kohl mit Sellerie. Umgekehrt gelten enge Verwandte als schlechte Nachbarn, weil sie dieselben Nährstoffe ziehen und dieselben Krankheiten teilen — Kartoffel und Tomate etwa gehören beide zu den Nachtschattengewächsen.',
      'Ehrlich bleiben muss man bei der Beweislage. Ein Teil dieser Regeln ist gut untersucht, etwa die Wirkung von Tagetes-Wurzeln gegen Wurzelälchen. Vieles andere stammt aus Erfahrung und Überlieferung und ist nie kontrolliert geprüft worden. Mischkultur ersetzt weder guten Boden noch die Fruchtfolge — sie ist ein Werkzeug unter mehreren, kein Ersatz für die Grundlagen.',
    ],
    en: [
      'Companion planting means deliberately putting different species next to one another instead of filling a bed with just one. The idea is old and simple: plants that root at different depths do not compete for the same water. Strongly scented plants can confuse pests that find their host by smell. And legumes gather nitrogen from the air through root nodule bacteria, which their neighbours also benefit from.',
      'The best-known pairing is carrot and onion: the onion scent disturbs the carrot fly, the carrot scent the onion fly. Other classics are beans with summer savory, tomato with basil, and cabbage with celery. Close relatives, by contrast, count as poor neighbours because they draw the same nutrients and share the same diseases — potato and tomato, for instance, both belong to the nightshade family.',
      'It pays to stay honest about the evidence. Some of these rules are well studied, such as the effect of marigold roots against root nematodes. Much of the rest comes from experience and tradition and has never been tested under controlled conditions. Companion planting replaces neither good soil nor crop rotation — it is one tool among several, not a substitute for the basics.',
    ],
  },

  // === 4. QUIZ ===
  quiz: {
    de: [
      'Das Quiz hat zwei Betriebsarten. Beim Bilder-Quiz siehst du ein Foto und ordnest die Art zu — das trainiert genau das, worauf es beim Bestimmen ankommt: Blattform, Blütenstand, Wuchs. Beim Beschwerde-Quiz wird gefragt, welche Pflanze traditionell wobei eingesetzt wird; die Antworten stammen aus derselben Datenbank wie die Steckbriefe.',
      'Der Punktestand liegt in deinem Browser, nicht auf einem Server. Es gibt keine Anmeldung und keine Bestenliste.',
      'Ein Quiz ist ein Gedächtnistraining, keine Bestimmungshilfe. Wer draußen sammelt, braucht mehr als ein Foto: die Verwechslungsgefahr steht auf jeder Pflanzenseite unter „Sicherheit", und die wichtigsten Doppelgänger — Bärlauch und Maiglöckchen, Wiesenkerbel und Schierling — unterscheidet man an Merkmalen, die auf einem Bild oft nicht zu sehen sind. Iss nie etwas, das du nur aus einem Quiz kennst.',
    ],
    en: [
      'The quiz has two modes. In the picture quiz you see a photograph and name the species — training exactly what matters when identifying plants: leaf shape, flower head, habit. In the complaint quiz you are asked which plant is traditionally used for what; the answers come from the same database as the plant profiles.',
      'Your score stays in your browser, not on a server. There is no sign-in and no leaderboard.',
      'A quiz trains memory; it is not an identification guide. Anyone foraging needs more than a photograph: the risk of confusion is listed on every plant page under "Safety", and the most important look-alikes — wild garlic and lily of the valley, cow parsley and hemlock — are told apart by features a picture often does not show. Never eat anything you know only from a quiz.',
    ],
  },

  // === 5. KARTE ===
  karte: {
    de: [
      'Die Karte zeigt, wo die Arten aus dieser Datenbank tatsächlich gefunden wurden. Die Punkte stammen aus der GBIF, der Global Biodiversity Information Facility — einem offenen Verbund, in dem Museen, Herbarien, Forschungseinrichtungen und geprüfte Meldungen aus der Bevölkerung ihre Fundnachweise zusammenlegen.',
      'Wichtig für die Deutung: Ein Punkt ist ein einzelner Fund zu einem bestimmten Zeitpunkt, kein Verbreitungsgebiet. Dichte Punktwolken entstehen auch dort, wo besonders viele Menschen sammeln und melden — in der Nähe von Universitäten, Naturschutzgebieten und Städten. Leere Flächen bedeuten deshalb oft nur, dass dort niemand nachgesehen hat.',
      'Bulgarische Fundorte sind orange hervorgehoben, weil die Datenbank aus Varna heraus gepflegt wird und die Frage „wächst das hier eigentlich?" für die Umgebung am häufigsten aufkommt.',
    ],
    en: [
      'The map shows where the species in this database have actually been recorded. The dots come from GBIF, the Global Biodiversity Information Facility — an open network in which museums, herbaria, research institutions and verified public records pool their occurrence data.',
      'One point matters for reading it: a dot is a single record at a single moment, not a distribution range. Dense clusters also appear simply where many people collect and report — near universities, nature reserves and cities. Empty areas therefore often mean only that nobody has looked there.',
      'Bulgarian records are highlighted in orange, because the database is maintained from Varna and the question "does this actually grow here?" comes up most often for the surrounding region.',
    ],
  },

  // === 6a. PERMAKULTUR ===
  permakultur: {
    de: [
      'Der Begriff stammt von Bill Mollison und David Holmgren, die ihn in den 1970er Jahren aus „permanent agriculture" bildeten. Gemeint ist eine Anbauweise, die nicht jedes Jahr bei null anfängt, sondern ein System aufbaut, das sich zunehmend selbst trägt: mehrjährige Pflanzen statt jährlicher Neuanlage, Bodendeckung statt offener Erde, geschlossene Kreisläufe statt zugekaufter Betriebsmittel.',
      'Für eine Heilpflanzen-Datenbank ist das mehr als eine Randnotiz. Ein großer Teil der klassischen Heilkräuter ist mehrjährig oder versamt sich selbst — Melisse, Beinwell, Schafgarbe, Frauenmantel, Salbei. Sie passen in Randbereiche, unter Obstbäume und an Beeteinfassungen, wo einjähriges Gemüse nicht funktioniert, und liefern dort jahrelang ohne viel Zutun.',
      'Die Übersicht unten ordnet die Pflanzen dieser Datenbank nach ihrer Funktion im System: Stickstoffsammler, Bodendecker, Bienenweide, Mulchlieferant, Schädlingsabwehr. Eine Pflanze kann mehrere Aufgaben zugleich übernehmen — genau darauf zielt die Bauweise ab.',
    ],
    en: [
      'The term goes back to Bill Mollison and David Holmgren, who coined it in the 1970s from "permanent agriculture". It describes a way of growing that does not start from scratch every year but builds a system that increasingly carries itself: perennials instead of annual replanting, covered soil instead of bare ground, closed cycles instead of bought-in inputs.',
      'For a medicinal plant database this is more than a footnote. A large share of the classic medicinal herbs are perennial or self-seeding — lemon balm, comfrey, yarrow, lady’s mantle, sage. They fit into edges, beneath fruit trees and along bed borders where annual vegetables do not work, and keep yielding there for years with little attention.',
      'The overview below sorts the plants in this database by their function in the system: nitrogen fixers, ground cover, bee forage, mulch producers, pest deterrents. One plant can take on several roles at once — which is exactly what the design aims at.',
    ],
  },

  // === 6. HILFE BEI ===
  hilfeBei: {
    de: [
      'Diese Übersicht dreht die übliche Suche um: Statt eine Pflanze zu suchen und zu lesen, wofür sie verwendet wird, gehst du von der Beschwerde aus und bekommst die Pflanzen, die traditionell damit verbunden sind. Jeder Treffer nennt die konkrete Anwendung, aus der die Zuordnung stammt.',
      '„Traditionell verwendet" heißt nicht „wirksam". Ein Teil der Anwendungen ist von der Kommission E oder der europäischen Arzneimittelbehörde EMA bewertet und auf den Pflanzenseiten entsprechend gekennzeichnet; ein anderer Teil ist reine Überlieferung. Beides steht in der Datenbank nebeneinander, aber unterscheidbar.',
      'Giftige und rechtlich kontrollierte Arten erscheinen in diesen Listen bewusst nicht, auch wenn sie historisch bei einer Beschwerde eingesetzt wurden. Sie bleiben über die Suche und das Pflanzenregister erreichbar — dort mit der Einordnung, die dazugehört.',
    ],
    en: [
      'This overview turns the usual search around: instead of looking up a plant and reading what it is used for, you start from the complaint and get the plants traditionally associated with it. Each result names the specific use the match came from.',
      '"Traditionally used" does not mean "effective". Some of these uses have been assessed by the German Commission E or the European Medicines Agency and are marked accordingly on the plant pages; others are pure tradition. The database holds both side by side, but keeps them distinguishable.',
      'Poisonous and legally controlled species deliberately do not appear in these lists, even where they were historically used for a complaint. They remain reachable through the search and the plant index — there with the context that belongs to them.',
    ],
  },
};
