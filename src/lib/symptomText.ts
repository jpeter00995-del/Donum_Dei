// === 1. ZWECK ===
// Eigener Einleitungstext je Symptomseite, deutsch und englisch.
// Vorher stand auf allen 40 Seiten derselbe Schablonensatz, nur mit
// ausgetauschtem Symptomnamen — dieselbe Schwaeche wie zuvor bei den
// Ernte-Monatsseiten.
//
// Die Texte ordnen ein, worum es bei der Beschwerde pflanzlich ueberhaupt
// geht, und sagen offen, wo die Pflanzenheilkunde aufhoert.
// Schluessel = symptom.id aus symptoms.json.

type Texte = Record<string, string>;

export const SYMPTOM_TEXT_DE: Texte = {
  erkaeltung:
    'Eine Erkältung heilt von selbst aus — die Pflanzenheilkunde setzt deshalb nicht am Virus an, sondern an den Beschwerden: Sie hält die Schleimhäute feucht, erleichtert das Abhusten und macht das Fieber erträglicher. Klassisch sind heiße Aufgüsse aus Holunder- oder Lindenblüten, die das Schwitzen anregen, sowie schleimhaltige Tees, die den gereizten Rachen überziehen.',
  husten:
    'Beim Husten kommt es darauf an, welcher gemeint ist. Trockener Reizhusten verlangt Schleimstoffe, die sich wie ein Film über die gereizte Schleimhaut legen — Eibisch, Malve, Spitzwegerich. Sitzt der Schleim dagegen fest, helfen Pflanzen mit ätherischen Ölen oder Saponinen, die ihn verflüssigen und das Abhusten erleichtern, etwa Thymian, Efeu oder Anis.',
  fieber:
    'Fieber ist keine Krankheit, sondern die Antwort des Körpers darauf. Die überlieferte Pflanzenheilkunde versucht deshalb selten, es zu unterdrücken, sondern begleitet es: schweißtreibende Blütentees, reichlich Flüssigkeit, Ruhe. Wichtig zu wissen, wann Schluss ist mit Hausmitteln — hohes oder anhaltendes Fieber, Fieber bei kleinen Kindern und Fieber mit steifem Nacken gehören umgehend in ärztliche Hand.',
  halsschmerzen:
    'Bei Halsschmerzen arbeitet die Pflanzenheilkunde vor allem örtlich: Gurgellösungen mit Gerbstoffen ziehen die gereizte Schleimhaut zusammen, Schleimstoffe legen sich schützend darüber. Beides wirkt nur dort, wo es hinkommt — deshalb gurgeln und langsam schlucken statt nur trinken. Eitrige Beläge, hohes Fieber oder Schluckbeschwerden über mehrere Tage gehören zum Arzt.',
  kopfschmerzen:
    'Bei Kopfschmerzen ist die Pflanzenheilkunde zurückhaltender, als viele Ratgeber vermuten lassen. Gut belegt ist wenig; überliefert sind vor allem Pfefferminzöl äußerlich auf Schläfen und Nacken sowie Weidenrinde als pflanzlicher Verwandter der Acetylsalicylsäure. Plötzliche, sehr starke oder neuartige Kopfschmerzen sind ein Fall für den Arzt, nicht für den Teeschrank.',
  verdauung:
    'Der größte Teil der klassischen Kräuterkunde dreht sich um die Verdauung. Zwei Gruppen tun das meiste: Bitterstoffe, die Speichel, Magensaft und Gallenfluss anregen und deshalb vor der Mahlzeit genommen werden, und krampflösende ätherische Öle aus den Doldenblütlern — Kümmel, Fenchel, Anis —, die danach helfen, wenn es drückt und bläht.',
  haut:
    'Bei Hautproblemen zählt die äußere Anwendung: Umschläge, Salben, Bäder. Gerbstoffreiche Pflanzen wirken zusammenziehend und trocknen nässende Stellen, Schleimstoffe beruhigen spannende Haut, und einige Öle pflegen rückfettend. Was auf die Haut kommt, sollte man vorher an einer kleinen Stelle testen — pflanzlich heißt nicht automatisch verträglich.',
  wunden:
    'Bei kleinen, oberflächlichen Wunden hat die Kräuterkunde eine lange Tradition: Gerbstoffe ziehen das Gewebe zusammen, Allantoin regt die Zellneubildung an, einige Pflanzen wirken zusätzlich leicht keimhemmend. Alles darüber hinaus gehört versorgt: tiefe, stark blutende oder verschmutzte Wunden, Bisse und alles, was sich entzündet, gehört zum Arzt.',
  schlaf:
    'Pflanzliche Schlafmittel wirken anders als synthetische: Sie erzwingen keinen Schlaf, sondern senken die innere Anspannung, aus der die Schlaflosigkeit entsteht. Deshalb setzt die Wirkung bei Baldrian erst nach zwei bis vier Wochen regelmäßiger Einnahme ein — eine einzelne Tasse am schlechten Abend leistet wenig. Melisse, Hopfen, Lavendel und Passionsblume gehören in dieselbe Gruppe.',
  stress:
    'Gegen Stress kann keine Pflanze etwas ausrichten — gegen die körperliche Anspannung, die er hinterlässt, schon. Überliefert sind vor allem beruhigende Lippenblütler wie Melisse und Lavendel sowie Passionsblume und Hopfen. Sie machen nicht müde, sondern nehmen die Schärfe aus Unruhe und Grübeln. Hält der Druck an, ist das ein Thema für ein Gespräch, nicht für einen Tee.',
  schmerzen:
    'Pflanzliche Schmerzmittel sind schwächer als die aus der Apotheke — das ist ihr Nachteil und zugleich ihr Vorteil. Weidenrinde enthält die Vorstufe der Acetylsalicylsäure, Teufelskralle und Weihrauch werden bei entzündlich bedingten Schmerzen eingesetzt. Alle wirken langsam und eignen sich für andauernde, nicht für akute starke Schmerzen.',
  gelenke:
    'Bei Gelenkbeschwerden arbeitet die Pflanzenheilkunde auf zwei Wegen: innerlich mit entzündungshemmenden Bitter- und Scharfstoffen, äußerlich mit durchblutungsfördernden Einreibungen und wärmenden Auflagen. Beides braucht Wochen, nicht Tage. Geschwollene, heiße oder plötzlich schmerzende Gelenke, besonders mit Fieber, gehören sofort ärztlich abgeklärt.',
  frauenleiden:
    'Rund um Menstruation und Wechseljahre hat die Kräuterkunde eigene Klassiker: krampflösende Pflanzen für die Tage, Gerbstoffe bei zu starker Blutung, dazu Frauenmantel und Schafgarbe aus der Volkstradition. Für die Wechseljahre ist die Traubensilberkerze am besten untersucht. Ungewöhnlich starke, sehr schmerzhafte oder unregelmäßige Blutungen gehören ärztlich abgeklärt.',
  augen:
    'Bei den Augen ist Vorsicht die wichtigste Regel. Selbst zubereitete Augenbäder sind nicht zu empfehlen, weil Aufgüsse rasch keimbelastet sind — was ins Auge kommt, muss steril sein. Überliefert ist der Augentrost, dessen Name aus der mittelalterlichen Signaturenlehre stammt. Anhaltende Rötung, Schmerz oder Sehstörungen gehören immer zum Augenarzt.',
  energie:
    'Bei Erschöpfung verspricht der Handel viel. Belastbar ist wenig: Adaptogene wie Ginseng und Rhodiola sind untersucht, die Ergebnisse fallen gemischt aus. Bitterstoffe und eisenreiche Wildkräuter gehören zur klassischen Frühjahrskur. Anhaltende Müdigkeit hat oft eine fassbare Ursache — Schilddrüse, Blutbild, Schlaf — und die findet man nur mit einer Untersuchung.',
  insektenstiche:
    'Beim frischen Stich zählt vor allem eines: kühlen. Pflanzlich ergänzt werden kann das durch zerquetschte Blätter mit Gerbstoffen, die den Juckreiz dämpfen — Spitzwegerich ist das bekannteste Beispiel und wächst meist genau dort, wo man gestochen wird. Ausgedehnte Schwellungen, Stiche im Mundraum und Atemnot sind ein Notfall.',
  kreislauf:
    'Herz und Kreislauf sind der Bereich, in dem Selbstbehandlung am wenigsten angebracht ist. Gut untersucht ist der Weißdorn zur Unterstützung, wirksam erst nach vier bis sechs Wochen. Alles andere — Rhythmusstörungen, Blutdruck, Herzschwäche — gehört in ärztliche Hand. Die stark herzwirksamen Pflanzen sind bewusst nicht in dieser Liste; sie sind Arzneimittelrohstoffe, keine Hausmittel.',
  allergien:
    'Gegen die Allergie selbst richtet die Pflanzenheilkunde wenig aus, gegen die Begleiterscheinungen einiges: Schleimstoffe beruhigen gereizte Nasen- und Rachenschleimhaut, adstringierende Aufgüsse lindern Juckreiz. Für die Pestwurz gibt es Studien bei Heuschnupfen, allerdings nur für standardisierte Fertigpräparate. Bei Atemnot oder Kreislaufproblemen sofort den Notruf wählen.',
  leber:
    'Für Leber und Galle hat die Kräuterkunde zwei bewährte Ansätze: Bitterstoffe, die den Gallenfluss anregen, und die Mariendistel mit ihrem Silymarin. Wichtig vorab: Bei Gallensteinen kann ein angeregter Gallenfluss eine Kolik auslösen — das gehört vor jeder Anwendung ärztlich abgeklärt. Gelbe Haut, heller Stuhl oder dunkler Urin sind keine Fälle für Tee.',
  blase:
    'Bei Blase und Nieren geht es meist um Durchspülung: Pflanzen mit harntreibender Wirkung, kombiniert mit reichlich Trinken — mindestens zwei Liter am Tag, sonst funktioniert das Prinzip nicht. Bärentraube und Kapuzinerkresse wirken zusätzlich keimhemmend im Harn. Fieber, Flankenschmerz, Blut im Urin oder Beschwerden in der Schwangerschaft gehören sofort zum Arzt.',
};

export const SYMPTOM_TEXT_EN: Texte = {
  erkaeltung:
    'A cold clears up on its own — herbal medicine therefore does not target the virus but the symptoms: keeping the mucous membranes moist, easing expectoration and making a fever more bearable. The classics are hot infusions of elderflower or lime blossom to encourage sweating, plus mucilage-rich teas that coat an irritated throat.',
  husten:
    'With cough, everything depends on which kind. A dry, tickly cough calls for mucilage that settles like a film over irritated membranes — marshmallow, mallow, ribwort plantain. When the mucus sits tight, plants with essential oils or saponins help thin it and ease it up: thyme, ivy or anise.',
  fieber:
    'Fever is not the illness but the body answering it. Traditional herbal practice therefore rarely tries to suppress it and instead accompanies it: diaphoretic flower teas, plenty of fluid, rest. What matters is knowing where home remedies stop — high or persistent fever, fever in small children and fever with a stiff neck need medical attention straight away.',
  halsschmerzen:
    'For a sore throat, herbal medicine works chiefly on the spot: gargles with tannins tighten the irritated lining while mucilage lays a protective film over it. Both act only where they reach, so gargle and swallow slowly rather than merely drinking. Purulent patches, high fever or difficulty swallowing over several days belong with a doctor.',
  kopfschmerzen:
    'With headache, herbal medicine is more restrained than many guides suggest. Little is well documented; tradition mainly offers peppermint oil applied to temples and neck, and willow bark as the plant relative of acetylsalicylic acid. Sudden, very severe or unfamiliar headaches are a matter for a doctor, not for the tea cupboard.',
  verdauung:
    'The larger part of classical herbal lore revolves around digestion. Two groups do most of the work: bitters, which stimulate saliva, gastric juice and bile flow and are therefore taken before a meal, and the antispasmodic essential oils of the carrot family — caraway, fennel, anise — which help afterwards, when things feel tight and bloated.',
  haut: 'With skin complaints, external use is what counts: compresses, ointments, baths. Tannin-rich plants act astringently and dry weeping patches, mucilage soothes tight skin, and some oils restore the lipid barrier. Whatever goes on the skin should be tested on a small area first — herbal does not automatically mean well tolerated.',
  wunden:
    'For small, superficial wounds herbal practice has a long tradition: tannins draw the tissue together, allantoin encourages new cell growth, and some plants are mildly antiseptic besides. Anything beyond that needs proper care: deep, heavily bleeding or dirty wounds, bites and anything that becomes inflamed belong with a doctor.',
  schlaf:
    'Herbal sleep remedies work differently from synthetic ones: they do not force sleep but lower the inner tension that sleeplessness grows from. That is why valerian only takes effect after two to four weeks of regular use — a single cup on a bad evening achieves little. Lemon balm, hops, lavender and passionflower belong to the same group.',
  stress:
    'No plant can do anything about stress itself — about the physical tension it leaves behind, quite a lot. Tradition mainly offers calming mint-family herbs such as lemon balm and lavender, along with passionflower and hops. They do not make you drowsy; they take the edge off restlessness and rumination. If the pressure persists, that calls for a conversation, not a tea.',
  schmerzen:
    'Herbal painkillers are weaker than those from the pharmacy — that is their drawback and their advantage at once. Willow bark contains the precursor of acetylsalicylic acid, while devil’s claw and frankincense are used for inflammatory pain. All of them act slowly and suit persistent rather than acute severe pain.',
  gelenke:
    'For joint complaints, herbal medicine works along two paths: internally with anti-inflammatory bitter and pungent compounds, externally with circulation-stimulating rubs and warming compresses. Both need weeks rather than days. Swollen, hot or suddenly painful joints, especially with fever, need medical assessment immediately.',
  frauenleiden:
    'Around menstruation and the menopause, herbal lore has its own classics: antispasmodic plants for the days themselves, tannins for excessive bleeding, plus lady’s mantle and yarrow from folk tradition. For the menopause, black cohosh is the best studied. Unusually heavy, very painful or irregular bleeding needs medical assessment.',
  augen:
    'With the eyes, caution is the first rule. Home-made eye baths are not advisable, because infusions quickly carry germs — whatever enters the eye must be sterile. Tradition offers eyebright, whose name comes from the medieval doctrine of signatures. Persistent redness, pain or disturbed vision always belong with an eye doctor.',
  energie:
    'Where exhaustion is concerned, the market promises a great deal. Little of it holds up: adaptogens such as ginseng and rhodiola have been studied, with mixed results. Bitters and iron-rich wild greens belong to the classic spring course. Lasting tiredness often has a findable cause — thyroid, blood count, sleep — and only an examination reveals it.',
  insektenstiche:
    'With a fresh sting, one thing matters most: cooling it. Herbally, that can be supported with crushed tannin-rich leaves that dampen the itch — ribwort plantain is the best-known example and usually grows exactly where you get stung. Extensive swelling, stings inside the mouth and breathing difficulty are an emergency.',
  kreislauf:
    'Heart and circulation are the area where self-treatment is least appropriate. Hawthorn is well studied as a support and takes four to six weeks to act. Everything else — rhythm disturbances, blood pressure, heart failure — belongs in medical hands. The strongly cardioactive plants are deliberately absent from this list; they are raw material for medicines, not household remedies.',
  allergien:
    'Against the allergy itself herbal medicine achieves little; against its accompanying effects, rather more: mucilage soothes irritated nasal and throat membranes, astringent infusions ease itching. Butterbur has been studied for hay fever, though only as standardised finished preparations. With breathing difficulty or circulatory symptoms, call the emergency number at once.',
  leber:
    'For liver and bile, herbal lore offers two established approaches: bitters that stimulate bile flow, and milk thistle with its silymarin. One point comes first: with gallstones, stimulated bile flow can trigger colic — that needs medical clarification before any use. Yellow skin, pale stools or dark urine are not cases for tea.',
  blase:
    'With bladder and kidneys it is usually about flushing: diuretic plants combined with drinking plenty — at least two litres a day, or the principle does not work at all. Bearberry and nasturtium additionally inhibit bacteria in the urine. Fever, flank pain, blood in the urine or symptoms during pregnancy need a doctor straight away.',
};
