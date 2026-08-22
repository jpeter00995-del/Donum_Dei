import type { UseForm } from './plantSchema';

// === 1. ZWECK ===
// Eigener Ratgebertext je Zubereitungsart, deutsch und englisch.
//
// Die Datenbank kennt zehn Anwendungsformen (`uses[].form`). Auf den
// Pflanzenseiten stand bisher nur das Etikett — "Tee", "Tinktur", "Umschlag" —
// ohne dass irgendwo erklaert wird, wie man das macht und wo die Grenzen
// liegen. Genau diese Luecke fuellen die Seiten unter /de/zubereitung/.
//
// Haltung wie ueberall im Projekt: erklaeren, was ueberliefert ist, die
// Mengen nennen, die in der Fachliteratur stehen, und offen sagen, wo die
// Selbstanwendung aufhoert. Keine Heilversprechen, keine erfundenen Zahlen.
//
// Schluessel = UseForm aus plantSchema.ts.

// === 2. TYPEN ===
export type Zubereitungstext = {
  /** Ueberschrift der Seite, z. B. "Tee und Aufguss". */
  titel: string;
  /** Ein Satz fuer die Uebersichtskarte. */
  kurz: string;
  /** Einordnung: was ist das, wofuer taugt es. */
  einleitung: string;
  /** Konkrete Arbeitsschritte in der Reihenfolge. */
  schritte: string[];
  /** Wozu die Methode passt — welche Inhaltsstoffe sie ueberhaupt herausloest. */
  passt: string;
  /** Wo Schluss ist. Steht auf jeder Seite, bewusst nicht kleingedruckt. */
  grenzen: string;
  /** Haltbarkeit und Aufbewahrung. Entfaellt, wo nichts aufbewahrt wird. */
  aufbewahren?: string;
};

/** Adress-Baustein je Form — deutsche und englische Seiten haben eigene Pfade. */
export const ZUBEREITUNG_SLUG_DE: Record<UseForm, string> = {
  tea: 'tee',
  tincture: 'tinktur',
  salve: 'salbe',
  bath: 'bad',
  raw: 'frisch',
  spice: 'gewuerz',
  essential_oil: 'aetherisches-oel',
  inhalation: 'inhalation',
  gargle: 'gurgeln',
  compress: 'umschlag',
};

export const ZUBEREITUNG_SLUG_EN: Record<UseForm, string> = {
  tea: 'tea',
  tincture: 'tincture',
  salve: 'salve',
  bath: 'bath',
  raw: 'fresh',
  spice: 'spice',
  essential_oil: 'essential-oil',
  inhalation: 'inhalation',
  gargle: 'gargle',
  compress: 'compress',
};

/** Reihenfolge auf der Uebersichtsseite: vom Alltaeglichen zum Speziellen. */
export const ZUBEREITUNG_REIHENFOLGE: UseForm[] = [
  'tea',
  'tincture',
  'compress',
  'gargle',
  'inhalation',
  'bath',
  'salve',
  'essential_oil',
  'raw',
  'spice',
];

// === 3. DEUTSCHE TEXTE ===
export const ZUBEREITUNG_DE: Record<UseForm, Zubereitungstext> = {
  tea: {
    titel: 'Tee und Aufguss',
    kurz: 'Die häufigste Zubereitung — und die, bei der die meisten Fehler passieren.',
    einleitung:
      'Der Tee ist die älteste und einfachste Art, einer Pflanze etwas abzugewinnen: Wasser löst heraus, was wasserlöslich ist. Genau darin liegt aber auch die Einschränkung — was sich nicht in Wasser löst, bleibt im Kraut. Entscheidend ist die Frage, welcher Pflanzenteil vor einem liegt. Zarte Blätter und Blüten werden übergossen (Aufguss), harte Wurzeln, Rinden und Samen müssen mitgekocht werden (Abkochung oder Dekokt), und schleimhaltige Drogen wie Eibischwurzel setzt man kalt an, weil Hitze den Schleim zerstört.',
    schritte: [
      'Ein bis zwei gehäufte Teelöffel getrocknetes Kraut (etwa 1,5 bis 2 Gramm) auf eine Tasse von 150 Millilitern rechnen. Frisches Kraut: die dreifache Menge, es besteht größtenteils aus Wasser.',
      'Blätter und Blüten mit kochendem Wasser übergießen und fünf bis zehn Minuten ziehen lassen.',
      'Wurzeln, Rinde und Samen stattdessen kalt aufsetzen, zum Kochen bringen und zehn bis fünfzehn Minuten leise köcheln lassen.',
      'Schleimhaltige Drogen wie Eibisch, Malve und Leinsamen ein bis zwei Stunden in kaltem Wasser ansetzen, gelegentlich umrühren, erst danach kurz erwärmen.',
      'Immer zudecken. Bei Pflanzen mit ätherischem Öl — Kamille, Pfefferminze, Thymian, Fenchel — zieht sonst der wirksame Teil als Dampf davon.',
      'Abseihen und langsam trinken. Bitterstoffe wie Wermut, Enzian und Tausendgüldenkraut etwa eine halbe Stunde vor dem Essen, weil sie über den Geschmackssinn wirken; krampflösende Doldenblütler eher danach.',
    ],
    passt:
      'Wasser löst Gerbstoffe, Bitterstoffe, Schleimstoffe, Flavonoide, Saponine und einen Teil der ätherischen Öle. Harze, fette Öle und viele Alkaloide bleiben weitgehend zurück — dafür gibt es die Tinktur.',
    grenzen:
      'Ein Heiltee ist nicht harmlos, nur weil er aus Pflanzen besteht. Für die meisten gilt eine Anwendungsdauer von wenigen Wochen, nicht von Monaten; gerbstoffreiche Zubereitungen können bei Dauergebrauch die Aufnahme von Eisen und von Arzneimitteln stören. Halten Beschwerden länger als eine Woche an, verschlimmern sie sich oder kommt Fieber dazu, gehört das ärztlich abgeklärt. In Schwangerschaft und Stillzeit sowie bei kleinen Kindern gelten für viele Pflanzen eigene Einschränkungen — sie stehen auf der jeweiligen Pflanzenseite.',
    aufbewahren:
      'Frisch zubereiteten Tee am selben Tag trinken. Getrocknetes Kraut dunkel, trocken und gut verschlossen lagern; Blüten und Blätter verlieren nach etwa einem Jahr merklich an Kraft, Wurzeln und Rinden halten länger.',
  },

  tincture: {
    titel: 'Tinktur',
    kurz: 'Alkoholischer Auszug — konzentriert, lange haltbar, tropfenweise dosiert.',
    einleitung:
      'Die Tinktur löst heraus, was Wasser liegen lässt: Harze, Bitterstoffe in hoher Konzentration, ätherische Öle, manche Alkaloide. Alkohol ist dabei Lösungsmittel und Konservierungsmittel zugleich, weshalb eine Tinktur jahrelang haltbar ist, während ein Tee einen Tag hält. Der Preis dafür ist der Alkohol selbst — er macht die Tinktur für einen Teil der Menschen ungeeignet.',
    schritte: [
      'Ein Teil zerkleinertes Pflanzenmaterial auf fünf Teile Alkohol rechnen (1:5). Bei frischem Kraut wegen des Wassergehalts eher 1:3.',
      'Die Alkoholstärke richtet sich nach dem Inhaltsstoff: 40 bis 45 Prozent für Bitter- und Gerbstoffe, 60 bis 70 Prozent für harz- und ölreiche Pflanzen wie Propolis, Myrrhe oder Johanniskraut.',
      'In ein sauberes Schraubglas füllen, so dass alles bedeckt ist, verschließen und dunkel bei Zimmertemperatur stehen lassen.',
      'Zwei bis vier Wochen ziehen lassen und täglich einmal schütteln.',
      'Durch ein Tuch abseihen, kräftig ausdrücken und in eine dunkle Tropfflasche füllen. Pflanze, Ansatzverhältnis und Datum aufschreiben — nach einem halben Jahr weiß das sonst niemand mehr.',
      'Üblich sind zehn bis dreißig Tropfen, ein- bis dreimal täglich, in etwas Wasser. Die genaue Menge steht bei der jeweiligen Anwendung auf der Pflanzenseite.',
    ],
    passt:
      'Harze, ätherische Öle, Bitterstoffe, Flavonoide und viele Alkaloide gehen in Alkohol über. Schleimstoffe dagegen fällt Alkohol aus — für Eibisch, Malve und Leinsamen ist die Tinktur die falsche Form.',
    grenzen:
      'Eine Tinktur enthält Trinkalkohol. Sie ist damit nichts für Kinder, für Schwangere und Stillende, für Menschen mit einer Alkoholerkrankung in der Vorgeschichte und für Leberkranke. Auch die kleinen Mengen zählen, wenn mehrmals täglich genommen wird. Weil die Tinktur um ein Vielfaches konzentrierter ist als ein Tee, sind Wechselwirkungen mit Arzneimitteln hier deutlich wahrscheinlicher — das gilt besonders für Johanniskraut, das den Abbau zahlreicher Medikamente beschleunigt und unter anderem hormonelle Verhütungsmittel unwirksam machen kann. Wer regelmäßig Medikamente nimmt, klärt eine Tinktur vorher in der Apotheke ab.',
    aufbewahren:
      'Dunkel und kühl in einer braunen Glasflasche. So bleibt eine Tinktur zwei bis drei Jahre brauchbar. Trübung, Bodensatz oder ein veränderter Geruch sind Grund, sie zu verwerfen.',
  },

  compress: {
    titel: 'Umschlag und Wickel',
    kurz: 'Äußere Anwendung mit Tuch und Aufguss — kalt oder warm, je nach Ziel.',
    einleitung:
      'Der Wickel bringt die Pflanze dorthin, wo es weh tut, ohne den Umweg über den Magen. Ein Teil der Wirkung kommt dabei gar nicht aus dem Kraut, sondern aus der Temperatur: Wärme entspannt und löst Krampf, Kälte dämpft Schwellung und Schmerz. Beides lässt sich nicht beliebig tauschen, und die Faustregel dazu ist alt und einfach.',
    schritte: [
      'Einen kräftigen Aufguss ansetzen — etwa zwei Esslöffel Kraut auf einen halben Liter Wasser, also deutlich stärker als Trinktee.',
      'Ein Innentuch aus Baumwolle oder Leinen darin tränken und ausdrücken, so dass es feucht ist und nicht tropft.',
      'Auf die Stelle legen, ein trockenes Zwischentuch darüber, außen ein Wolltuch zum Halten der Temperatur.',
      'Warme Wickel etwa zwanzig bis dreißig Minuten liegen lassen, danach eine halbe Stunde nachruhen.',
      'Kalte Wickel abnehmen, sobald sie sich körperwarm anfühlen — meist nach zehn bis zwanzig Minuten. Ein kalter Wickel, der liegen bleibt, wärmt am Ende.',
      'Ein- bis zweimal täglich wiederholen. Bei Umschlägen mit frischem Kraut die gewaschenen Blätter zerquetschen und direkt auflegen.',
    ],
    passt:
      'Gerbstoffe wie Eichenrinde, Schwarztee und Hamamelis ziehen nässende Haut zusammen, Schleimstoffe wie Leinsamen und Malve beruhigen und halten Feuchtigkeit, und entzündungshemmende Pflanzen wie Kamille und Ringelblume gehören zu den Klassikern der Auflage.',
    grenzen:
      'Kalte Wickel gehören nur auf einen Körper, der warm ist — wer friert oder kalte Füße hat, bekommt keinen kalten Wadenwickel. Auf offene, stark entzündete oder nässende Wunden gehört nichts Selbstgemachtes ohne ärztliche Rücksprache. Bei Menschen mit Nervenschäden, etwa nach langjährigem Diabetes, ist das Temperaturempfinden gestört; hier können warme Auflagen unbemerkt verbrennen. Nimmt die Rötung zu, breitet sich die Schwellung aus oder kommt Fieber dazu, ist der Wickel zu Ende und der Arzt an der Reihe.',
  },

  gargle: {
    titel: 'Gurgeln und Spülen',
    kurz: 'Wirkt nur dort, wo die Flüssigkeit hinkommt — und nur, wenn lange genug gegurgelt wird.',
    einleitung:
      'Gurgeln ist örtliche Behandlung: Der Aufguss legt sich für ein paar Sekunden auf die gereizte Schleimhaut und wird danach ausgespuckt. Weil nichts aufgenommen wird, ist die Anwendung vergleichsweise sicher — aber sie ist auch flach. Wer dreimal fünf Sekunden gurgelt, hat nichts getan; die klassische Empfehlung lautet dreißig Sekunden je Portion, mehrmals am Tag.',
    schritte: [
      'Einen Aufguss ansetzen, etwas stärker als Trinktee: ein bis zwei Teelöffel auf 150 Milliliter.',
      'Auf handwarm abkühlen lassen. Zu heiß reizt die ohnehin gereizte Schleimhaut zusätzlich.',
      'Einen Schluck nehmen, den Kopf in den Nacken legen und etwa dreißig Sekunden gurgeln, dann ausspucken.',
      'Mit der ganzen Portion so verfahren, insgesamt drei- bis fünfmal am Tag.',
      'Bei einer Mundspülung nicht gurgeln, sondern die Flüssigkeit durch die Zahnzwischenräume ziehen und ebenfalls ausspucken.',
    ],
    passt:
      'Gerbstoffreiche Pflanzen wie Salbei, Eichenrinde und Hamamelis ziehen die Schleimhaut zusammen und dämpfen die Reizung. Kamille und Ringelblume werden bei entzündetem Zahnfleisch verwendet, Thymian bei Halsschmerzen mit Husten.',
    grenzen:
      'Gurgellösungen werden ausgespuckt, nicht geschluckt — das gilt besonders für Eichenrinde und andere stark gerbstoffhaltige Aufgüsse. Gerbstoffreiche Zubereitungen sollten nicht länger als zwei bis drei Wochen am Stück angewendet werden. Kinder gurgeln erst, wenn sie es sicher können, sonst wird geschluckt. Eitrige Beläge auf den Mandeln, hohes Fieber, einseitige starke Halsschmerzen oder Schluckbeschwerden über mehrere Tage sind kein Fall zum Gurgeln, sondern für den Arzt.',
  },

  inhalation: {
    titel: 'Inhalation',
    kurz: 'Wasserdampf bringt ätherische Öle direkt an die Schleimhaut — mit klaren Ausnahmen.',
    einleitung:
      'Bei der Dampfinhalation trifft zweierlei zusammen: die feuchte Wärme, die festsitzenden Schleim löst, und das ätherische Öl, das mit dem Dampf aufsteigt. Der größere Teil der Wirkung kommt dabei vom Wasserdampf selbst — das erklärt, warum auch reines heißes Wasser hilft. Genau deshalb ist diese Anwendung bei kleinen Kindern und bei Asthma aber auch nicht harmlos.',
    schritte: [
      'Ein bis zwei Liter heißes Wasser in eine breite Schüssel geben. Nicht kochend: etwa 60 Grad reichen und verringern die Verbrühungsgefahr.',
      'Eine Handvoll Kraut hineingeben oder drei bis fünf Tropfen ätherisches Öl — mehr ist nicht besser, sondern reizt nur.',
      'Ein großes Handtuch über Kopf und Schüssel legen und mit geschlossenen Augen ruhig durch die Nase ein- und durch den Mund ausatmen.',
      'Fünf bis zehn Minuten, zwei- bis dreimal am Tag.',
      'Danach eine halbe Stunde im Warmen bleiben und nicht sofort nach draußen gehen.',
      'Für die Nase gibt es Inhalatoren aus der Apotheke; sie führen den Dampf gezielter und sind deutlich sicherer als die offene Schüssel.',
    ],
    passt:
      'Pflanzen mit ätherischem Öl: Kamille, Thymian, Salbei, Eukalyptus, Fichtennadeln, Pfefferminze. Bei allem, was hauptsächlich Schleim- oder Bitterstoffe enthält, bringt die Inhalation nichts — die steigen nicht mit dem Dampf auf.',
    grenzen:
      'Menthol, Kampfer und Eukalyptusöl dürfen bei Säuglingen und Kleinkindern nicht in Gesichtsnähe kommen: Sie können einen Stimmritzenkrampf mit Atemstillstand auslösen. Bei Asthma kann das Einatmen ätherischer Öle einen Anfall auslösen — hier vorher mit der behandelnden Praxis sprechen. Die offene Schüssel mit heißem Wasser ist eine der häufigsten Ursachen schwerer Verbrühungen bei Kindern; mit Kindern gehört sie nicht auf den Tisch. Bei akuter Nasennebenhöhlenentzündung mit starkem Druckgefühl kann Wärme die Beschwerden vorübergehend verstärken.',
  },

  bath: {
    titel: 'Bad',
    kurz: 'Voll- oder Teilbad mit einem starken Aufguss — Wirkung über Haut und Wärme.',
    einleitung:
      'Das Kräuterbad wirkt auf drei Wegen zugleich: über die Wärme, über die Inhaltsstoffe an der Haut und über den Duft. Für viele Zwecke ist ein Teilbad — Hand-, Fuß- oder Sitzbad — die bessere Wahl, weil es den Kreislauf kaum belastet und sich viel gezielter einsetzen lässt.',
    schritte: [
      'Für ein Vollbad einen kräftigen Aufguss ansetzen: 50 bis 100 Gramm getrocknetes Kraut auf ein bis zwei Liter Wasser, zugedeckt ziehen lassen, abseihen und ins Badewasser geben.',
      'Für ein Fuß- oder Sitzbad ein Viertel dieser Menge auf eine Schüssel rechnen.',
      'Badetemperatur um 37 Grad. Ein ansteigendes Fußbad beginnt bei etwa 33 Grad, dann wird über zehn Minuten heißes Wasser nachgegossen.',
      'Zehn bis zwanzig Minuten baden, nicht länger — die Haut quillt sonst auf und trocknet danach aus.',
      'Ätherische Öle nie unverdünnt ins Wasser geben; sie schwimmen sonst als Tropfen obenauf und reizen die Haut. Vorher in Sahne, Honig oder einem Emulgator aus der Apotheke auflösen.',
      'Nach dem Bad abtrocknen statt abduschen und eine halbe Stunde nachruhen.',
    ],
    passt:
      'Beruhigende Pflanzen wie Lavendel, Melisse und Hopfen; gerbstoffreiche wie Eichenrinde und Schwarztee bei nässenden Hautstellen; durchblutungsfördernde wie Rosmarin und Fichtennadel am Morgen. Haferstroh und Malve gelten als hautberuhigend.',
    grenzen:
      'Vollbäder belasten den Kreislauf. Bei Herzschwäche, schlecht eingestelltem Bluthochdruck, Krampfadern mit Beschwerden, offenen Wunden, Fieber und in der späten Schwangerschaft gehören sie besprochen, nicht ausprobiert. Anregende Bäder am Abend halten wach, beruhigende am Morgen machen müde. Rosmarinbäder gelten in der Schwangerschaft als nicht geeignet. Wer allein badet und kreislaufempfindlich ist, wählt das Fußbad.',
  },

  salve: {
    titel: 'Salbe und Ölauszug',
    kurz: 'Fett zieht heraus, was Wasser nicht löst — und bleibt auf der Haut, wo es hingehört.',
    einleitung:
      'Eine Salbe ist im Kern nichts anderes als ein Pflanzenauszug in Fett, mit Wachs so weit angedickt, dass er streichfähig bleibt. Der Umweg über das Öl hat einen Grund: Ein Teil der interessanten Stoffe — bei Johanniskraut das rote Hypericin, bei Ringelblume die Triterpene — ist fettlöslich und geht in Wasser gar nicht erst mit.',
    schritte: [
      'Ölauszug ansetzen: getrocknetes Kraut mit einem guten Pflanzenöl übergießen (Oliven-, Sonnenblumen- oder Mandelöl), bis es bedeckt ist.',
      'Kalt: drei bis vier Wochen ans Fensterbrett stellen, täglich schütteln. Warm: zwei Stunden im Wasserbad bei höchstens 60 Grad ziehen lassen.',
      'Durch ein Tuch abseihen und gut ausdrücken.',
      'Für die Salbe je nach gewünschter Festigkeit acht bis zehn Teile Ölauszug mit einem Teil Bienenwachs im Wasserbad schmelzen.',
      'Streichprobe: einen Tropfen auf einen kalten Teller geben. Zu weich — etwas Wachs nachgeben; zu fest — etwas Öl.',
      'In saubere, ausgekochte Tiegel abfüllen, offen abkühlen lassen und erst dann verschließen, sonst schlägt sich Kondenswasser nieder und die Salbe verdirbt.',
    ],
    passt:
      'Fettlösliche Inhaltsstoffe: Harze, Carotinoide, ätherische Öle, die Naphthodianthrone des Johanniskrauts. Ringelblume, Beinwell, Arnika, Johanniskraut und Kamille sind die klassischen Salbenpflanzen.',
    grenzen:
      'Nur getrocknetes Kraut verwenden. Frisches bringt Wasser in den Ölauszug, und Wasser im Fett bedeutet Schimmel und Bakterien. Selbstgemachte Salben sind nicht keimfrei und gehören nicht auf offene Wunden, frische Operationsnarben oder entzündete Haut. Vor der ersten Anwendung eine kleine Stelle in der Armbeuge testen — Ringelblume, Arnika und Kamille sind Korbblütler, und darauf reagiert ein Teil der Menschen allergisch. Arnika gehört nicht auf verletzte Haut. Johanniskrautöl macht die Haut lichtempfindlich; danach nicht in die Sonne.',
    aufbewahren:
      'Kühl und dunkel hält eine selbstgemachte Salbe etwa sechs bis zwölf Monate. Immer mit einem sauberen Spatel entnehmen, nicht mit dem Finger. Ranziger Geruch heißt wegwerfen.',
  },

  essential_oil: {
    titel: 'Ätherisches Öl',
    kurz: 'Das konzentrierteste, was aus einer Pflanze kommt — und das am häufigsten falsch benutzte.',
    einleitung:
      'Ein ätherisches Öl ist kein Pflanzenauszug, sondern ein Destillat: der flüchtige Anteil der Pflanze, um ein Vielfaches konzentriert. Für einen Liter Rosenöl braucht es mehrere Tonnen Blüten. Diese Konzentration ist der Grund für die Wirkung — und der Grund, warum ätherische Öle die Anwendungsform mit den meisten Zwischenfällen sind.',
    schritte: [
      'Nie unverdünnt auf die Haut. Für Erwachsene ein bis drei Prozent in einem Trägeröl: etwa ein bis sechs Tropfen auf zehn Milliliter Mandel-, Jojoba- oder Olivenöl.',
      'Für Kinder ab drei Jahren höchstens ein halbes bis ein Prozent, und nur mit milden Ölen wie Lavendel oder Römischer Kamille.',
      'Zur Raumbeduftung drei bis fünf Tropfen in einen Diffusor mit Wasser. Nicht dauerhaft laufen lassen — zwanzig Minuten reichen, danach lüften.',
      'Vor der ersten Anwendung eine Verträglichkeitsprobe in der Armbeuge machen und 24 Stunden abwarten.',
      'Beim Kauf auf die vollständige botanische Angabe achten: lateinischer Name, Pflanzenteil, Gewinnungsart. „Naturidentisch“ und „Duftöl“ sind keine ätherischen Öle.',
    ],
    passt:
      'Pfefferminze äußerlich bei Spannungskopfschmerz, Lavendel zur Beruhigung, Teebaum und Thymian als keimhemmende Zusätze, Eukalyptus und Fichte zum Inhalieren bei Erkältung.',
    grenzen:
      'Ätherische Öle gehören nicht in die Augen und nicht in deren Nähe. Menthol- und kampferhaltige Öle sowie Eukalyptusöl dürfen bei Säuglingen und Kleinkindern nicht ins Gesicht — sie können einen Stimmritzenkrampf auslösen. Kaltgepresste Zitrusöle machen die Haut lichtempfindlich; nach dem Auftragen mindestens zwölf Stunden keine Sonne. Die innerliche Einnahme ätherischer Öle ist kein Hausmittel: Schon wenige Milliliter mancher Öle sind giftig, bei Kindern noch weniger. Wer sie innerlich anwenden will, tut das nur nach Anweisung einer fachkundigen Praxis oder Apotheke; Menschen mit Asthma oder Epilepsie und Schwangere klären jede Anwendung vorher ab.',
    aufbewahren:
      'Dunkles Glas, kühl, fest verschlossen. Zitrusöle halten etwa ein Jahr, die meisten anderen zwei bis drei. Alt gewordene Öle reizen die Haut stärker als frische.',
  },

  raw: {
    titel: 'Frisch verwenden',
    kurz: 'Direkt aus dem Garten — die einfachste Anwendung, mit der wichtigsten Vorbedingung.',
    einleitung:
      'Vieles braucht gar keine Zubereitung: junge Blätter in den Salat, ein zerquetschtes Blatt auf den Insektenstich, ein Stück Wurzel gekaut. Frisches Material enthält Vitamine und flüchtige Stoffe, die beim Trocknen verloren gehen. Die Bedingung dafür ist allerdings absolut und nicht verhandelbar: Man muss die Pflanze sicher bestimmen können. Die schweren Vergiftungen mit Wildpflanzen entstehen fast alle durch Verwechslung, nicht durch falsche Zubereitung.',
    schritte: [
      'Nur sammeln, was zweifelsfrei bestimmt ist. Im Zweifel stehen lassen — Bärlauch und Herbstzeitlose, Wilde Möhre und Schierling wachsen nebeneinander.',
      'Abseits von vielbefahrenen Straßen, Hundewegen, konventionellen Feldrainen und Gleisanlagen sammeln.',
      'Am späten Vormittag ernten, wenn der Tau abgetrocknet ist.',
      'Gründlich in kaltem Wasser waschen, bei Wildkräutern lieber zweimal.',
      'Frisch verarbeiten. Wildkräuter welken innerhalb von Stunden; im feuchten Tuch im Kühlschrank halten sie ein bis zwei Tage.',
      'Für die Auflage auf die Haut die gewaschenen Blätter zwischen den Fingern zerreiben oder mit einem Nudelholz anquetschen, bis Saft austritt.',
    ],
    passt:
      'Vitaminreiche Wildkräuter wie Brennnessel, Giersch, Vogelmiere und Löwenzahn; Spitzwegerich als Soforthilfe bei Insektenstichen; frische Küchenkräuter, deren ätherisches Öl beim Trocknen weitgehend verfliegt.',
    grenzen:
      'Sichere Bestimmung geht allem voran. Rohe Pflanzenteile sind außerdem nicht automatisch bekömmlich: Holunderbeeren und Bohnen sind roh giftig und müssen erhitzt werden, Rhabarberblätter gehören gar nicht auf den Teller. Wer Wildpflanzen sammelt, wäscht sie wegen möglicher Verunreinigung durch Tierkot; das Risiko einer Fuchsbandwurm-Infektion gilt nach heutigem Kenntnisstand als gering, Waschen bleibt trotzdem Pflicht. In Naturschutzgebieten und für geschützte Arten gilt ein Sammelverbot, und auch sonst nimmt man nie mehr als ein Drittel eines Bestandes.',
  },

  spice: {
    titel: 'Als Gewürz',
    kurz: 'Küchenmenge und Heilmenge sind zwei verschiedene Dinge — das wird oft verwechselt.',
    einleitung:
      'Die Grenze zwischen Gewürz und Heilpflanze verlief historisch nie scharf: Kümmel, Fenchel, Ingwer, Zimt und Kurkuma stehen in beiden Traditionen. Der entscheidende Unterschied liegt in der Menge. Ein Teelöffel Kurkuma im Essen ist etwas anderes als eine standardisierte Kapsel, und was in Küchenmengen unbedenklich ist, kann in therapeutischer Dosierung Wechselwirkungen haben.',
    schritte: [
      'Ganze Gewürze kaufen und erst kurz vor dem Gebrauch mörsern. Gemahlenes verliert sein ätherisches Öl innerhalb weniger Monate.',
      'Samengewürze wie Kümmel, Koriander und Fenchel kurz trocken anrösten, bis sie duften — das öffnet die Ölzellen.',
      'Zarte Blattgewürze wie Basilikum, Petersilie und Dill erst am Ende zugeben, sonst verkochen sie.',
      'Fettlösliche Würzstoffe wie das Curcumin der Gelbwurz oder das Capsaicin der Chili brauchen Fett im Gericht, sonst bleiben sie weitgehend unaufgenommen.',
      'Verdauungsfördernde Gewürze gehören mit ins Gericht, nicht danach — Kümmel im Kohl ist der klassische Fall.',
    ],
    passt:
      'Doldenblütler-Samen wie Kümmel, Fenchel, Anis und Koriander bei Blähungen, Ingwer bei Übelkeit, Zimt und Kurkuma in der ayurvedischen wie in der europäischen Küche, Bitterstoffe wie Wermut in Kräuterlikören vor dem Essen.',
    grenzen:
      'Gewürzmengen sind für gesunde Erwachsene in der Regel unbedenklich. Sobald daraus tägliche Kapseln oder Extrakte werden, gelten andere Regeln: Kurkuma-Extrakte stehen in Verbindung mit einzelnen Leberschäden, Cassia-Zimt enthält Cumarin, das in größeren Mengen leberschädigend ist, und Ingwer in hoher Dosierung kann die Blutgerinnung beeinflussen. Wer blutverdünnende Mittel nimmt, schwanger ist oder eine Lebererkrankung hat, bespricht Gewürz-Präparate mit der Ärztin oder der Apotheke — das gilt nicht für das, was im Essen landet.',
  },
};

// === 4. ENGLISCHE TEXTE ===
export const ZUBEREITUNG_EN: Record<UseForm, Zubereitungstext> = {
  tea: {
    titel: 'Tea and infusion',
    kurz: 'The most common preparation — and the one most often got wrong.',
    einleitung:
      'Tea is the oldest and simplest way to get something out of a plant: water dissolves whatever is water-soluble. That is also its limit — anything that will not dissolve in water stays in the herb. What matters is which part of the plant is in front of you. Soft leaves and flowers are poured over (an infusion), hard roots, barks and seeds have to be simmered (a decoction), and mucilage-rich material such as marshmallow root is steeped cold, because heat destroys the mucilage.',
    schritte: [
      'Allow one to two heaped teaspoons of dried herb (roughly 1.5 to 2 grams) per 150 ml cup. For fresh herb use three times as much — it is mostly water.',
      'Pour boiling water over leaves and flowers and let them steep for five to ten minutes.',
      'Roots, bark and seeds instead go into cold water, are brought to the boil and simmered gently for ten to fifteen minutes.',
      'Steep mucilage-rich material such as marshmallow, mallow and linseed in cold water for one to two hours, stirring occasionally, and warm it only briefly afterwards.',
      'Always cover the cup. With plants that carry essential oil — chamomile, peppermint, thyme, fennel — the active part otherwise leaves as steam.',
      'Strain and drink slowly. Bitters such as wormwood, gentian and centaury about half an hour before a meal, because they work through the sense of taste; antispasmodic umbellifers rather afterwards.',
    ],
    passt:
      'Water dissolves tannins, bitters, mucilage, flavonoids, saponins and part of the essential oils. Resins, fatty oils and many alkaloids largely stay behind — that is what a tincture is for.',
    grenzen:
      'A medicinal tea is not harmless simply because it comes from a plant. Most are meant for a few weeks, not months; tannin-rich preparations can interfere with the absorption of iron and of medicines when taken continuously. If complaints last longer than a week, get worse, or come with a fever, that needs a doctor. In pregnancy, while breastfeeding and for small children many plants carry their own restrictions — they are listed on the individual plant page.',
    aufbewahren:
      'Drink freshly made tea the same day. Store dried herb dark, dry and well sealed; flowers and leaves lose noticeable strength after about a year, roots and barks keep longer.',
  },

  tincture: {
    titel: 'Tincture',
    kurz: 'An alcoholic extract — concentrated, long-lasting, dosed by the drop.',
    einleitung:
      'A tincture extracts what water leaves behind: resins, bitters in high concentration, essential oils, some alkaloids. Alcohol is solvent and preservative at once, which is why a tincture keeps for years where a tea keeps for a day. The price is the alcohol itself — it makes tinctures unsuitable for a good number of people.',
    schritte: [
      'Allow one part chopped plant material to five parts alcohol (1:5). For fresh herb, closer to 1:3 because of the water it contains.',
      'The strength depends on the constituent: 40 to 45 percent for bitters and tannins, 60 to 70 percent for resinous and oily plants such as propolis, myrrh or St John’s wort.',
      'Fill a clean screw-top jar so everything is covered, seal it and keep it dark at room temperature.',
      'Leave it for two to four weeks and shake it once a day.',
      'Strain through a cloth, press firmly, and decant into a dark dropper bottle. Write down plant, ratio and date — six months on, nobody remembers.',
      'Ten to thirty drops one to three times a day in a little water is the usual range. The exact amount is given with the individual use on the plant page.',
    ],
    passt:
      'Resins, essential oils, bitters, flavonoids and many alkaloids pass into alcohol. Mucilage, on the other hand, is precipitated by it — for marshmallow, mallow and linseed a tincture is the wrong form.',
    grenzen:
      'A tincture contains drinking alcohol. That rules it out for children, in pregnancy and while breastfeeding, for anyone with a history of alcohol dependence and for people with liver disease. Small amounts still add up when taken several times a day. Because a tincture is many times more concentrated than a tea, interactions with medicines are considerably more likely — particularly with St John’s wort, which speeds up the breakdown of numerous drugs and can render hormonal contraception ineffective. Anyone on regular medication should check a tincture with a pharmacist first.',
    aufbewahren:
      'Dark and cool, in a brown glass bottle. A tincture stays usable for two to three years. Cloudiness, sediment or a changed smell are reasons to discard it.',
  },

  compress: {
    titel: 'Compress and poultice',
    kurz: 'External application with cloth and infusion — cold or warm, depending on the aim.',
    einleitung:
      'A compress brings the plant to where it hurts without the detour through the stomach. Part of the effect does not come from the herb at all but from the temperature: warmth relaxes and releases cramp, cold dampens swelling and pain. The two are not interchangeable, and the rule of thumb is old and simple.',
    schritte: [
      'Make a strong infusion — about two tablespoons of herb to half a litre of water, noticeably stronger than drinking tea.',
      'Soak an inner cloth of cotton or linen in it and wring it out so it is damp, not dripping.',
      'Lay it on the spot, put a dry intermediate cloth over it and a woollen cloth outside to hold the temperature.',
      'Leave warm compresses on for twenty to thirty minutes, then rest for half an hour.',
      'Take cold compresses off as soon as they feel body-warm — usually after ten to twenty minutes. A cold compress left lying on the skin ends up warming it.',
      'Repeat once or twice a day. For poultices with fresh herb, crush the washed leaves and apply them directly.',
    ],
    passt:
      'Tannins such as oak bark, black tea and witch hazel draw weeping skin together, mucilage such as linseed and mallow soothes and holds moisture, and anti-inflammatory plants such as chamomile and calendula are the classics of the poultice.',
    grenzen:
      'Cold compresses belong only on a body that is warm — anyone shivering or with cold feet does not get a cold leg wrap. Nothing home-made belongs on open, badly inflamed or weeping wounds without medical advice. In people with nerve damage, for instance after years of diabetes, temperature perception is impaired and warm applications can burn unnoticed. If redness increases, swelling spreads or fever appears, the compress is over and the doctor is next.',
  },

  gargle: {
    titel: 'Gargles and rinses',
    kurz: 'Works only where the liquid reaches — and only if you gargle long enough.',
    einleitung:
      'Gargling is local treatment: the infusion sits on the irritated mucous membrane for a few seconds and is then spat out. Because nothing is absorbed, it is comparatively safe — but it is also shallow. Three five-second gargles achieve nothing; the classic recommendation is thirty seconds per mouthful, several times a day.',
    schritte: [
      'Make an infusion slightly stronger than drinking tea: one to two teaspoons per 150 ml.',
      'Let it cool to hand-warm. Too hot only adds to the irritation.',
      'Take a mouthful, tip the head back and gargle for about thirty seconds, then spit it out.',
      'Work through the whole portion this way, three to five times a day.',
      'For a mouth rinse, do not gargle — draw the liquid between the teeth and spit it out as well.',
    ],
    passt:
      'Tannin-rich plants such as sage, oak bark and witch hazel tighten the mucous membrane and dampen irritation. Chamomile and calendula are used for inflamed gums, thyme for a sore throat with cough.',
    grenzen:
      'Gargles are spat out, not swallowed — that goes especially for oak bark and other strongly tannin-rich infusions. Tannin-rich preparations should not be used for longer than two to three weeks at a stretch. Children gargle only once they can do it safely, otherwise they swallow. Pus on the tonsils, high fever, severe one-sided throat pain or difficulty swallowing over several days are not a case for gargling but for a doctor.',
  },

  inhalation: {
    titel: 'Steam inhalation',
    kurz: 'Steam carries essential oils straight to the mucous membrane — with clear exceptions.',
    einleitung:
      'Two things come together in a steam inhalation: the moist heat that loosens stubborn mucus, and the essential oil that rises with the steam. Most of the effect comes from the steam itself — which is why plain hot water also helps. It is exactly for that reason that this application is not harmless for small children or for people with asthma.',
    schritte: [
      'Put one to two litres of hot water in a wide bowl. Not boiling: around 60 degrees is enough and reduces the risk of scalding.',
      'Add a handful of herb or three to five drops of essential oil — more is not better, only more irritating.',
      'Drape a large towel over head and bowl and breathe calmly in through the nose and out through the mouth, eyes closed.',
      'Five to ten minutes, two or three times a day.',
      'Afterwards stay somewhere warm for half an hour and do not go straight outside.',
      'For the nose, pharmacies sell inhalers; they direct the steam more precisely and are far safer than an open bowl.',
    ],
    passt:
      'Plants carrying essential oil: chamomile, thyme, sage, eucalyptus, spruce needles, peppermint. For anything that mainly contains mucilage or bitters, inhalation achieves nothing — those do not rise with the steam.',
    grenzen:
      'Menthol, camphor and eucalyptus oil must not come near the face of infants and toddlers: they can trigger laryngospasm and arrest of breathing. In asthma, inhaling essential oils can set off an attack — check with the treating practice first. An open bowl of hot water is one of the commonest causes of severe scalds in children and does not belong on the table when children are around. In acute sinusitis with strong pressure, heat can make symptoms temporarily worse.',
  },

  bath: {
    titel: 'Baths',
    kurz: 'A full or partial bath with a strong infusion — working through skin and warmth.',
    einleitung:
      'A herbal bath works on three levels at once: through the heat, through the constituents at the skin, and through the scent. For many purposes a partial bath — hand, foot or sitz bath — is the better choice, because it barely burdens the circulation and can be aimed far more precisely.',
    schritte: [
      'For a full bath, make a strong infusion: 50 to 100 grams of dried herb to one or two litres of water, steeped covered, strained and added to the bathwater.',
      'For a foot or sitz bath, a quarter of that amount per bowl.',
      'Bath temperature around 37 degrees. A rising foot bath starts at about 33 degrees, with hot water added over ten minutes.',
      'Bathe for ten to twenty minutes, no longer — the skin swells and afterwards dries out.',
      'Never add essential oils undiluted; they float on top as droplets and irritate the skin. Dissolve them first in cream, honey or an emulsifier from the pharmacy.',
      'Afterwards pat dry rather than shower, and rest for half an hour.',
    ],
    passt:
      'Calming plants such as lavender, lemon balm and hops; tannin-rich ones such as oak bark and black tea for weeping skin; circulation-stimulating ones such as rosemary and spruce needle in the morning. Oat straw and mallow are considered skin-soothing.',
    grenzen:
      'Full baths put a load on the circulation. With heart failure, poorly controlled high blood pressure, symptomatic varicose veins, open wounds, fever and in late pregnancy they should be discussed rather than tried. Stimulating baths in the evening keep you awake, calming ones in the morning make you sleepy. Rosemary baths are regarded as unsuitable in pregnancy. Anyone bathing alone who is sensitive to circulatory changes should choose the foot bath.',
  },

  salve: {
    titel: 'Salve and infused oil',
    kurz: 'Fat draws out what water cannot — and stays on the skin, where it belongs.',
    einleitung:
      'A salve is essentially a plant extract in fat, thickened with wax just enough to stay spreadable. The detour through oil has a reason: part of what is interesting — the red hypericin of St John’s wort, the triterpenes of calendula — is fat-soluble and does not pass into water at all.',
    schritte: [
      'Make an infused oil: cover dried herb with a good plant oil (olive, sunflower or almond).',
      'Cold method: three to four weeks on a windowsill, shaken daily. Warm method: two hours in a water bath at no more than 60 degrees.',
      'Strain through a cloth and press well.',
      'For the salve, melt eight to ten parts infused oil with one part beeswax in a water bath, depending on the firmness you want.',
      'Test it: put a drop on a cold plate. Too soft — add wax; too firm — add oil.',
      'Pour into clean, scalded jars, let them cool open and only then close them, otherwise condensation collects and the salve spoils.',
    ],
    passt:
      'Fat-soluble constituents: resins, carotenoids, essential oils, the naphthodianthrones of St John’s wort. Calendula, comfrey, arnica, St John’s wort and chamomile are the classic salve plants.',
    grenzen:
      'Use dried herb only. Fresh material brings water into the infused oil, and water in fat means mould and bacteria. Home-made salves are not sterile and do not belong on open wounds, fresh surgical scars or inflamed skin. Test a small patch on the inner forearm before first use — calendula, arnica and chamomile are daisy-family plants, and a proportion of people react allergically. Arnica does not belong on broken skin. St John’s wort oil makes the skin light-sensitive; keep out of the sun afterwards.',
    aufbewahren:
      'Kept cool and dark, a home-made salve lasts about six to twelve months. Always take it out with a clean spatula, not a finger. A rancid smell means throw it away.',
  },

  essential_oil: {
    titel: 'Essential oils',
    kurz: 'The most concentrated thing a plant yields — and the most frequently misused.',
    einleitung:
      'An essential oil is not a plant extract but a distillate: the volatile fraction of the plant, concentrated many times over. A litre of rose oil takes several tonnes of blossom. That concentration is the reason for the effect — and the reason essential oils are the form of application with the most incidents.',
    schritte: [
      'Never undiluted on the skin. For adults, one to three percent in a carrier oil: roughly one to six drops per ten millilitres of almond, jojoba or olive oil.',
      'For children from three years, at most half to one percent, and only with mild oils such as lavender or Roman chamomile.',
      'To scent a room, three to five drops in a diffuser with water. Do not run it continuously — twenty minutes is enough, then air the room.',
      'Before first use, do a tolerance test on the inner forearm and wait 24 hours.',
      'When buying, look for the full botanical statement: Latin name, plant part, method of extraction. “Nature-identical” and “fragrance oil” are not essential oils.',
    ],
    passt:
      'Peppermint externally for tension headache, lavender for calming, tea tree and thyme as antimicrobial additions, eucalyptus and spruce for inhalation with a cold.',
    grenzen:
      'Essential oils do not belong in or near the eyes. Menthol- and camphor-containing oils and eucalyptus oil must not be applied to the face of infants and toddlers — they can trigger laryngospasm. Cold-pressed citrus oils make the skin light-sensitive; keep out of the sun for at least twelve hours after applying. Taking essential oils internally is not a home remedy: a few millilitres of some oils are toxic, and less than that in children. Anyone using them internally should do so only on the instruction of a qualified practice or pharmacy, and people with asthma or epilepsy, and anyone pregnant, should clear every application beforehand.',
    aufbewahren:
      'Dark glass, cool, tightly closed. Citrus oils keep about a year, most others two to three. Oils past their best irritate the skin more than fresh ones.',
  },

  raw: {
    titel: 'Fresh use',
    kurz: 'Straight from the garden — the simplest application, with the most important precondition.',
    einleitung:
      'A great deal needs no preparation at all: young leaves in a salad, a crushed leaf on an insect bite, a piece of root chewed. Fresh material holds vitamins and volatile substances that are lost in drying. The condition, however, is absolute and not negotiable: you must be able to identify the plant with certainty. Serious poisonings with wild plants almost all come from mistaken identity, not from wrong preparation.',
    schritte: [
      'Only gather what you have identified beyond doubt. When in doubt, leave it — wild garlic and autumn crocus, wild carrot and hemlock grow side by side.',
      'Gather away from busy roads, dog-walking paths, conventionally farmed field margins and railway lines.',
      'Harvest in the late morning, once the dew has dried.',
      'Wash thoroughly in cold water, wild herbs preferably twice.',
      'Use it fresh. Wild herbs wilt within hours; wrapped in a damp cloth in the fridge they keep a day or two.',
      'For a poultice, rub the washed leaves between your fingers or bruise them with a rolling pin until the sap comes out.',
    ],
    passt:
      'Vitamin-rich wild herbs such as nettle, ground elder, chickweed and dandelion; ribwort plantain as immediate help with insect bites; fresh culinary herbs whose essential oil largely disappears in drying.',
    grenzen:
      'Certain identification comes before everything else. Raw plant parts are also not automatically digestible: elderberries and beans are toxic raw and must be heated, and rhubarb leaves do not belong on the plate at all. Anyone gathering wild plants washes them because of possible contamination with animal droppings; the risk of fox tapeworm is considered low on current evidence, but washing remains obligatory. In nature reserves and for protected species gathering is prohibited, and even elsewhere you never take more than a third of a stand.',
  },

  spice: {
    titel: 'As a spice',
    kurz: 'Kitchen quantity and medicinal quantity are two different things — often confused.',
    einleitung:
      'The line between spice and medicinal plant was never sharp historically: caraway, fennel, ginger, cinnamon and turmeric stand in both traditions. The decisive difference is the amount. A teaspoon of turmeric in food is not the same as a standardised capsule, and what is harmless in kitchen quantities can interact in therapeutic doses.',
    schritte: [
      'Buy whole spices and grind them shortly before use. Ground spice loses its essential oil within a few months.',
      'Toast seed spices such as caraway, coriander and fennel briefly in a dry pan until they smell — that opens the oil cells.',
      'Add delicate leaf herbs such as basil, parsley and dill at the end, otherwise they cook away.',
      'Fat-soluble compounds such as the curcumin of turmeric or the capsaicin of chilli need fat in the dish, otherwise they are largely not taken up.',
      'Digestive spices go into the dish, not after it — caraway in cabbage is the classic case.',
    ],
    passt:
      'Umbellifer seeds such as caraway, fennel, anise and coriander for flatulence, ginger for nausea, cinnamon and turmeric across the Ayurvedic and the European kitchen, bitters such as wormwood in herbal aperitifs before a meal.',
    grenzen:
      'Spice quantities are generally unproblematic for healthy adults. As soon as they become daily capsules or extracts, other rules apply: turmeric extracts have been linked to individual cases of liver damage, cassia cinnamon contains coumarin, which harms the liver in larger amounts, and ginger in high doses can affect blood clotting. Anyone on blood thinners, pregnant, or with liver disease should discuss spice preparations with a doctor or pharmacist — that does not apply to what goes into the food.',
  },
};
