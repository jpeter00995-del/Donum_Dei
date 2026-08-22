#!/usr/bin/env python3
"""Baut die fuenf duennsten nicht-kontrollierten Arten aus.

=== 1. WARUM ===
Nach der Messung aus Sitzung 36 sind die duennsten Pflanzenseiten der
Datenbank fast alle rechtlich kontrolliert (und stehen ohnehin auf noindex)
oder giftig. Uebrig bleiben fuenf Arten, die viel gesucht werden und trotzdem
kaum Text tragen: vier Heilpilze und Ashwagandha.

Ihnen fehlt nicht die Beschreibung — die ist ordentlich —, sondern der
strukturierte Teil, den die Pflanzenseite in eigenen Reitern zeigt:

  * `harvest[]`         -> Reiter "Sammeln" war bei allen fuenf komplett leer
  * `safety.pregnancy`  \\
  * `safety.lactation`   > Reiter "Sicherheit" zeigte nur den Warntext
  * `safety.children`   /
  * `safety.drug_interactions`

=== 2. QUELLEN ===
Die Sicherheitsangaben stammen aus den Monographien von Memorial Sloan
Kettering (About Herbs) und aus LiverTox, jeweils am 2026-08-22 abgerufen und
als Quelle in der Datei eingetragen. Nichts davon ist aus dem Gedaechtnis
geschrieben.

=== 3. BENUTZUNG ===
    python3 scripts/heilpilze_ausbauen.py              # Vorschau (Standard)
    python3 scripts/heilpilze_ausbauen.py --schreiben  # schreibt wirklich
"""

import json
import sys
from pathlib import Path

# === 1. KONSTANTEN ===
DATEN = Path(__file__).resolve().parent.parent / 'src' / 'data' / 'plants'
ABGERUFEN = '2026-08-22'

MSK = 'https://www.mskcc.org/cancer-care/integrative-medicine/herbs'


def msk_quelle(pfad: str, titel: str) -> dict:
    return {
        'id': 'src_msk',
        'type': 'monograph',
        'title': f'{titel} — About Herbs, Memorial Sloan Kettering Cancer Center',
        'url': f'{MSK}/{pfad}',
        'accessed': ABGERUFEN,
    }


# === 2. ERGAENZUNGEN JE ART ===
# Aufbau je Eintrag:
#   quellen   – neue Quellen (werden nur ergaenzt, nie ersetzt)
#   safety    – neue Schluessel im safety-Block
#   harvest   – der komplette harvest-Block (vorher gab es keinen)
#   ersetze   – woertliche Textkorrekturen (alt -> neu), fuer Sachfehler

PATCHES: dict[str, dict] = {

    # --- 2.1 Igel-Stachelbart / Loewenmaehne -------------------------------
    'hericium-erinaceus': {
        'quellen': [msk_quelle('lions-mane-mushroom', "Lion's Mane Mushroom")],
        'harvest': [{
            'plant_part': 'whole_plant',
            'best_months': [8, 9, 10, 11],
            'time_of_day': {
                'de': 'Wildvorkommen sind in Deutschland stark gefährdet und stehen unter '
                      'Schutz — sie werden nicht gesammelt. Aus eigener Zucht wird geerntet, '
                      'solange die Stacheln rein weiß sind und noch keine Sporen fallen; '
                      'gilbende oder bräunliche Fruchtkörper schmecken bitter.',
                'en': 'Wild populations are highly endangered and protected in Germany — they '
                      'are not gathered. From your own cultivation, harvest while the spines '
                      'are pure white and no spores are dropping yet; yellowing or browning '
                      'fruiting bodies taste bitter.',
            },
            'drying': {
                'de': 'In etwa ein Zentimeter dicke Scheiben schneiden und bei 40 bis 50 Grad '
                      'trocknen, bis sie hart brechen. Der Pilz besteht zu über neunzig Prozent '
                      'aus Wasser und schrumpft dabei erheblich.',
                'en': 'Cut into slices about a centimetre thick and dry at 40 to 50 degrees '
                      'until they snap. The mushroom is over ninety percent water and shrinks '
                      'considerably.',
            },
            'storage_months': 12,
            'storage_condition': {
                'de': 'Getrocknet luftdicht, dunkel und trocken. Frisch hält er im Kühlschrank '
                      'in einer Papiertüte nur drei bis fünf Tage.',
                'en': 'Dried, keep airtight, dark and dry. Fresh, it keeps only three to five '
                      'days in a paper bag in the fridge.',
            },
        }],
        'safety': {
            'pregnancy': {
                'status': 'unknown',
                'note': {
                    'de': 'Als Speisepilz in üblichen Essensmengen gibt es keine Hinweise auf ein '
                          'Problem. Für die konzentrierten Extrakte und Kapseln fehlen '
                          'Untersuchungen an Schwangeren vollständig — daher in der '
                          'Schwangerschaft nicht als Nahrungsergänzung verwenden.',
                    'en': 'As an edible mushroom in ordinary food amounts there is no indication '
                          'of a problem. For the concentrated extracts and capsules there are no '
                          'studies in pregnant women at all — so do not use it as a supplement '
                          'during pregnancy.',
                },
            },
            'lactation': {
                'status': 'unknown',
                'note': {
                    'de': 'Es liegen keine Daten zu Übergang in die Muttermilch oder zu Wirkungen '
                          'auf gestillte Kinder vor.',
                    'en': 'There are no data on passage into breast milk or on effects in '
                          'breastfed infants.',
                },
            },
            'children': {
                'status': 'unknown',
                'note': {
                    'de': 'Als Speisepilz unbedenklich, sofern er gut durchgegart ist. Extrakte '
                          'und Kapseln sind bei Kindern nicht untersucht.',
                    'en': 'Harmless as an edible mushroom provided it is cooked through. Extracts '
                          'and capsules have not been studied in children.',
                },
            },
            'drug_interactions': [
                {
                    'drug_class': 'Gerinnungshemmer und Thrombozytenhemmer',
                    'severity': 'monitor',
                    'source_id': 'src_msk',
                    'mechanism': {
                        'de': 'In Laborversuchen hemmten Inhaltsstoffe des Pilzes die '
                              'Blutplättchen-Verklumpung. Ob das beim Menschen eine Rolle spielt, '
                              'ist nicht geklärt; bei gerinnungshemmender Behandlung und vor '
                              'Operationen ist Zurückhaltung angebracht.',
                        'en': 'In laboratory studies constituents of the mushroom inhibited '
                              'platelet aggregation. Whether this matters in humans is unclear; '
                              'caution is warranted with anticoagulant treatment and before '
                              'surgery.',
                    },
                },
                {
                    'drug_class': 'Blutzuckersenkende Mittel (Antidiabetika)',
                    'severity': 'monitor',
                    'source_id': 'src_msk',
                    'mechanism': {
                        'de': 'Im Tierversuch senkte der Pilz den Blutzucker. Bei laufender '
                              'Diabetesbehandlung und regelmäßiger Einnahme von Extrakten den '
                              'Blutzucker im Auge behalten.',
                        'en': 'In animal studies the mushroom lowered blood sugar. With ongoing '
                              'diabetes treatment and regular use of extracts, keep an eye on '
                              'blood glucose.',
                    },
                },
            ],
        },
    },

    # --- 2.2 Schiefer Schillerporling / Chaga ------------------------------
    'inonotus-obliquus': {
        'quellen': [msk_quelle('chaga-mushroom', 'Chaga Mushroom')],
        'harvest': [{
            'plant_part': 'whole_plant',
            'best_months': [10, 11, 12, 1, 2, 3, 4],
            'time_of_day': {
                'de': 'Geerntet wird im Winter an lebenden Birken, wenn der Saft steht. Der '
                      'schwarze Auswuchs wird nicht vollständig abgetragen — ein Rest bleibt am '
                      'Baum, damit er nachwachsen kann, und die Rinde darunter darf nicht '
                      'verletzt werden. Chaga wächst über Jahre; ein sauber abgeernteter Stamm '
                      'trägt frühestens nach einem Jahrzehnt wieder. Auf fremdem Grund ist die '
                      'Ernte ohne Erlaubnis des Waldbesitzers nicht zulässig.',
                'en': 'Harvest in winter from living birches, while the sap is up. The black '
                      'growth is not taken off completely — a remnant stays on the tree so it '
                      'can regrow, and the bark underneath must not be damaged. Chaga grows over '
                      'years; a cleanly stripped trunk bears again after a decade at the '
                      'earliest. On land you do not own, harvesting requires the owner’s '
                      'permission.',
            },
            'drying': {
                'de': 'Noch feucht in walnussgroße Stücke schlagen — durchgetrocknet ist das '
                      'Sklerotium so hart, dass es kaum zu zerkleinern ist. Danach bei höchstens '
                      '50 Grad oder luftig im Warmen trocknen, bis es bricht statt sich zu biegen.',
                'en': 'Break it into walnut-sized pieces while still moist — once dried through, '
                      'the sclerotium is so hard it is barely possible to break up. Then dry at '
                      'no more than 50 degrees, or airy in a warm place, until it snaps rather '
                      'than bends.',
            },
            'storage_months': 24,
            'storage_condition': {
                'de': 'Trocken, luftig und dunkel. Nicht luftdicht verpacken, solange noch '
                      'Restfeuchte im Kern sitzt — dann schimmelt es von innen.',
                'en': 'Dry, airy and dark. Do not seal it airtight while residual moisture is '
                      'still in the core — it will mould from the inside.',
            },
        }],
        'safety': {
            'pregnancy': {
                'status': 'caution',
                'note': {
                    'de': 'Es gibt keine Untersuchungen an Schwangeren. Angesichts der sehr hohen '
                          'Oxalatmenge und der beschriebenen Nierenschäden ist Chaga in der '
                          'Schwangerschaft nicht angebracht.',
                    'en': 'There are no studies in pregnant women. Given the very high oxalate '
                          'load and the reported kidney damage, chaga is not appropriate during '
                          'pregnancy.',
                },
            },
            'lactation': {
                'status': 'unknown',
                'note': {
                    'de': 'Keine Daten zu Übergang in die Muttermilch. Ohne solche Daten und bei '
                          'der bekannten Nierenbelastung ist von der Anwendung abzuraten.',
                    'en': 'No data on passage into breast milk. Without such data, and given the '
                          'known burden on the kidneys, use is not advisable.',
                },
            },
            'children': {
                'status': 'caution',
                'note': {
                    'de': 'Nicht untersucht. Die Oxalatmenge ist bezogen auf das Körpergewicht bei '
                          'Kindern noch bedeutsamer als bei Erwachsenen.',
                    'en': 'Not studied. Relative to body weight, the oxalate load matters even '
                          'more in children than in adults.',
                },
            },
            'drug_interactions': [
                {
                    'drug_class': 'Gerinnungshemmer und Thrombozytenhemmer',
                    'severity': 'caution',
                    'source_id': 'src_msk',
                    'mechanism': {
                        'de': 'Chaga-Extrakt hemmte im Tiermodell die Blutplättchen-Verklumpung. '
                              'Ein zusätzlicher Effekt zu gerinnungshemmenden Medikamenten ist '
                              'denkbar; die klinische Bedeutung ist nicht bekannt.',
                        'en': 'Chaga extract inhibited platelet aggregation in an animal model. '
                              'An additive effect with anticoagulant medication is conceivable; '
                              'the clinical relevance is not known.',
                    },
                },
                {
                    'drug_class': 'Blutzuckersenkende Mittel (Antidiabetika)',
                    'severity': 'monitor',
                    'source_id': 'src_msk',
                    'mechanism': {
                        'de': 'Im Laborversuch senkte Chaga den Blutzucker zusätzlich zu '
                              'blutzuckersenkenden Wirkstoffen. Ob das im Menschen zutrifft, ist '
                              'offen — bei Diabetesbehandlung den Blutzucker im Auge behalten.',
                        'en': 'In vitro, chaga lowered blood sugar in addition to hypoglycaemic '
                              'agents. Whether this holds in humans is open — with diabetes '
                              'treatment, keep an eye on blood glucose.',
                    },
                },
            ],
        },
    },

    # --- 2.3 Reishi / Glaenzender Lackporling ------------------------------
    'ganoderma-lingzhi': {
        'quellen': [],
        'harvest': [{
            'plant_part': 'whole_plant',
            'best_months': [9, 10, 11],
            'time_of_day': {
                'de': 'Geerntet wird, sobald der weiße Zuwachsrand am Hutrand verschwunden und '
                      'die Oberseite gleichmäßig lackrot ist — dann ist der Fruchtkörper reif. '
                      'Wartet man länger, verholzt er weiter und der Sporenstaub überzieht alles '
                      'rundherum. Abgeschnitten wird dicht am Substrat.',
                'en': 'Harvest once the white growing margin at the cap edge has gone and the '
                      'upper surface is an even lacquer red — the fruiting body is then mature. '
                      'Wait longer and it lignifies further, and the spore dust coats everything '
                      'around it. Cut close to the substrate.',
            },
            'drying': {
                'de': 'Der Fruchtkörper ist von vornherein hart und holzig. In dünne Scheiben '
                      'sägen oder schneiden, solange er frisch ist, danach bei 40 bis 50 Grad '
                      'durchtrocknen. Am Stück getrocknet ist er später kaum noch zu teilen.',
                'en': 'The fruiting body is hard and woody from the start. Saw or cut it into '
                      'thin slices while fresh, then dry through at 40 to 50 degrees. Dried '
                      'whole, it is afterwards barely possible to divide.',
            },
            'storage_months': 24,
            'storage_condition': {
                'de': 'Trocken und dunkel, luftdicht verschlossen. Reishi ist wegen seiner harten '
                      'Struktur lange haltbar, zieht aber Feuchtigkeit.',
                'en': 'Dry and dark, airtight. Reishi keeps for a long time thanks to its hard '
                      'structure, but it draws moisture.',
            },
        }],
        'safety': {
            'pregnancy': {
                'status': 'unknown',
                'note': {
                    'de': 'Keine Untersuchungen an Schwangeren. Reishi ist kein Speisepilz, '
                          'sondern wird als Extrakt oder Aufguss eingenommen — ohne Datenlage in '
                          'der Schwangerschaft nicht anzuwenden.',
                    'en': 'No studies in pregnant women. Reishi is not an edible mushroom but is '
                          'taken as an extract or infusion — with no data, it should not be used '
                          'in pregnancy.',
                },
            },
            'lactation': {
                'status': 'unknown',
                'note': {
                    'de': 'Keine Daten zu Übergang in die Muttermilch oder zu Wirkungen auf '
                          'gestillte Kinder.',
                    'en': 'No data on passage into breast milk or on effects in breastfed '
                          'infants.',
                },
            },
            'children': {
                'status': 'unknown',
                'note': {
                    'de': 'Bei Kindern nicht untersucht.',
                    'en': 'Not studied in children.',
                },
            },
            'drug_interactions': [
                {
                    'drug_class': 'Gerinnungshemmer und Thrombozytenhemmer',
                    'severity': 'caution',
                    'source_id': 'src_msk',
                    'mechanism': {
                        'de': 'Reishi kann das Blutungsrisiko erhöhen; Extrakte verlängerten in '
                              'Untersuchungen die Gerinnungswerte (INR, Quick, aPTT). Bei '
                              'gerinnungshemmender Behandlung und vor Operationen ärztlich '
                              'abklären.',
                        'en': 'Reishi can increase the risk of bleeding; extracts prolonged '
                              'clotting values (INR, PT, aPTT) in studies. Clear it medically '
                              'with anticoagulant treatment and before surgery.',
                    },
                },
                {
                    'drug_class': 'Immunsuppressiva',
                    'severity': 'caution',
                    'source_id': 'src_msk',
                    'mechanism': {
                        'de': 'Reishi verstärkt die Immunantwort und wirkt damit einer gewollten '
                              'Unterdrückung des Immunsystems entgegen — etwa nach '
                              'Organtransplantation oder bei Autoimmunerkrankungen.',
                        'en': 'Reishi enhances the immune response and thus works against a '
                              'deliberate suppression of the immune system — for instance after '
                              'organ transplantation or in autoimmune disease.',
                    },
                },
                {
                    'drug_class': 'Arzneimittel mit Abbau über Cytochrom P450',
                    'severity': 'monitor',
                    'source_id': 'src_msk',
                    'mechanism': {
                        'de': 'Reishi-Polysaccharide hemmten im Laborversuch die Enzyme CYP2E1, '
                              'CYP1A2 und CYP3A und könnten damit den Spiegel entsprechender '
                              'Medikamente verändern. Die klinische Bedeutung ist nicht bekannt.',
                        'en': 'In vitro, reishi polysaccharides inhibited the enzymes CYP2E1, '
                              'CYP1A2 and CYP3A and could thus alter the levels of drugs handled '
                              'by them. The clinical relevance is not known.',
                    },
                },
            ],
        },
        'ersetze': [
            # Fallberichte zu Leberschaeden fehlten im Warntext, obwohl sie der
            # ernsteste dokumentierte Befund zu diesem Pilz sind.
            ('warnings', 'de',
             'Allgemein gut verträglich.',
             'Allgemein gut verträglich; berichtet werden Übelkeit, Mundtrockenheit, '
             'Schlaflosigkeit, Juckreiz und Schwindel. Zu pulverisiertem Reishi gibt es '
             'Fallberichte über Leberschäden, in einem Fall mit tödlichem Ausgang — bei '
             'Lebererkrankung ist davon abzuraten.'),
            ('warnings', 'en',
             'Generally well tolerated.',
             'Generally well tolerated; nausea, dry mouth, insomnia, itching and vertigo have '
             'been reported. For powdered reishi there are case reports of liver damage, in one '
             'instance fatal — it is not advisable with liver disease.'),
        ],
    },

    # --- 2.4 Shiitake ------------------------------------------------------
    'lentinula-edodes': {
        'quellen': [msk_quelle('shiitake-mushroom', 'Shiitake Mushroom')],
        'harvest': [{
            'plant_part': 'whole_plant',
            'best_months': [1, 2, 3, 4, 9, 10, 11, 12],
            'time_of_day': {
                'de': 'Geerntet wird, wenn der Hut sich geöffnet hat, der Rand aber noch leicht '
                      'eingerollt ist — dann ist das Fleisch fest und das Aroma am stärksten. '
                      'Ganz flach aufgeschirmte Hüte haben bereits Sporen abgeworfen. Mit einer '
                      'Drehbewegung am Stielansatz lösen, nicht abreißen.',
                'en': 'Harvest when the cap has opened but the edge is still slightly curled '
                      'under — the flesh is then firm and the flavour strongest. Fully flat caps '
                      'have already dropped their spores. Twist them off at the base of the '
                      'stem rather than tearing.',
            },
            'drying': {
                'de': 'Mit den Lamellen nach oben bei 45 bis 50 Grad trocknen. Wer sie vorher ein '
                      'bis zwei Stunden mit den Lamellen nach oben in die Sonne legt, erhöht den '
                      'Vitamin-D2-Gehalt deutlich: Das enthaltene Ergosterol wird durch '
                      'UV-B-Licht umgewandelt. Getrocknete Shiitake schmecken kräftiger als '
                      'frische — das Einweichwasser mitverwenden.',
                'en': 'Dry gills upwards at 45 to 50 degrees. Laying them in the sun gills '
                      'upwards for an hour or two beforehand markedly increases the vitamin D2 '
                      'content: the ergosterol they contain is converted by UV-B light. Dried '
                      'shiitake taste stronger than fresh — use the soaking water too.',
            },
            'storage_months': 24,
            'storage_condition': {
                'de': 'Getrocknet luftdicht, dunkel und trocken. Frisch halten sie im Kühlschrank '
                      'in einer Papiertüte etwa eine Woche; in Plastik werden sie schmierig.',
                'en': 'Dried, keep airtight, dark and dry. Fresh, they keep about a week in a '
                      'paper bag in the fridge; in plastic they turn slimy.',
            },
        }],
        'safety': {
            'pregnancy': {
                'status': 'caution',
                'note': {
                    'de': 'Als gut durchgegarter Speisepilz in Essensmengen unproblematisch. '
                          'Konzentrierte Extrakte und Lentinan-Präparate sind bei Schwangeren '
                          'nicht untersucht und gehören dort nicht hin.',
                    'en': 'Unproblematic as a thoroughly cooked edible mushroom in food amounts. '
                          'Concentrated extracts and lentinan preparations have not been studied '
                          'in pregnant women and do not belong there.',
                },
            },
            'lactation': {
                'status': 'caution',
                'note': {
                    'de': 'Als Lebensmittel üblich. Zu Extrakten in der Stillzeit gibt es keine '
                          'Daten.',
                    'en': 'Customary as a food. There are no data on extracts during '
                          'breastfeeding.',
                },
            },
            'children': {
                'status': 'caution',
                'note': {
                    'de': 'Gut durchgegart als Speisepilz unbedenklich — roh ausdrücklich nicht, '
                          'wegen der Shiitake-Dermatitis. Extrakte sind bei Kindern nicht '
                          'untersucht.',
                    'en': 'Harmless as a thoroughly cooked edible mushroom — expressly not raw, '
                          'because of shiitake dermatitis. Extracts have not been studied in '
                          'children.',
                },
            },
            'drug_interactions': [
                {
                    'drug_class': 'Immunsuppressiva',
                    'severity': 'caution',
                    'source_id': 'src_msk',
                    'mechanism': {
                        'de': 'Das Polysaccharid Lentinan wirkt immunstimulierend und kann einer '
                              'gewollten Unterdrückung des Immunsystems entgegenwirken. Das '
                              'betrifft Extrakte, nicht den Pilz im Essen.',
                        'en': 'The polysaccharide lentinan stimulates the immune system and can '
                              'counteract a deliberate suppression of it. This concerns extracts, '
                              'not the mushroom in food.',
                    },
                },
                {
                    'drug_class': 'Gerinnungshemmer und Thrombozytenhemmer',
                    'severity': 'monitor',
                    'source_id': 'src_msk',
                    'mechanism': {
                        'de': 'Für Shiitake-Extrakte wird ein zusätzlicher Effekt auf die '
                              'Blutgerinnung diskutiert. Bei entsprechender Medikation und '
                              'regelmäßiger Einnahme von Präparaten ärztlich abklären.',
                        'en': 'An additive effect on blood clotting is discussed for shiitake '
                              'extracts. With such medication and regular use of preparations, '
                              'clear it medically.',
                    },
                },
            ],
        },
        'ersetze': [
            # Sachfehler: Lentinan ist ein Polysaccharid, kein Lektin. Die
            # Beschreibung nannte "hitzeempfindliche Lektine", der Warntext im
            # selben Datensatz dagegen Lentinan — beides ging nicht zusammen.
            ('description', 'de',
             'da hitzeempfindliche Lektine erst beim Kochen zerstört werden',
             'da der hitzeempfindliche Bestandteil Lentinan erst beim Durchgaren zerfällt'),
            ('description', 'en',
             'since heat-sensitive lectins are only destroyed by cooking',
             'since the heat-sensitive constituent lentinan only breaks down on thorough cooking'),
            # Zweiter dokumentierter Befund, der bisher fehlte: die
            # Ueberempfindlichkeits-Pneumonitis durch eingeatmete Sporen.
            ('warnings', 'de',
             'gut durchgaren.',
             'gut durchgaren. Beim Einatmen größerer Sporenmengen — ein Thema für Züchter, '
             'nicht für die Küche — sind Fälle einer Überempfindlichkeits-Pneumonitis '
             'beschrieben.'),
            ('warnings', 'en',
             'cook thoroughly.',
             'cook thoroughly. Inhaling larger amounts of spores — an issue for growers, not '
             'for the kitchen — has been linked to cases of hypersensitivity pneumonitis.'),
        ],
    },

    # --- 2.5 Ashwagandha ---------------------------------------------------
    'withania-somnifera': {
        'quellen': [{
            'id': 'msk',
            'type': 'monograph',
            'title': 'Ashwagandha — About Herbs, Memorial Sloan Kettering Cancer Center',
            'url': f'{MSK}/ashwagandha',
            'accessed': ABGERUFEN,
        }],
        'harvest': [{
            'plant_part': 'root',
            'best_months': [10, 11],
            'time_of_day': {
                'de': 'Die Wurzel wird im Herbst ausgegraben, wenn das Kraut abstirbt und die '
                      'Beeren rot sind — in den Anbaugebieten etwa 150 bis 180 Tage nach der '
                      'Aussaat. Zu diesem Zeitpunkt ist der Withanolid-Gehalt am höchsten. Die '
                      'Pflanze wird dazu vollständig entnommen; sie ist einjährig kultiviert.',
                'en': 'The root is dug in autumn, as the top growth dies back and the berries '
                      'turn red — in the growing regions roughly 150 to 180 days after sowing. '
                      'The withanolide content is highest at that point. The whole plant is '
                      'lifted; it is grown as an annual.',
            },
            'drying': {
                'de': 'Wurzeln waschen, die feinen Seitenwurzeln entfernen und in Stücke von zwei '
                      'bis drei Zentimetern schneiden. Im Schatten trocknen, nicht in der Sonne — '
                      'die Withanolide sind lichtempfindlich.',
                'en': 'Wash the roots, remove the fine side roots and cut into pieces of two to '
                      'three centimetres. Dry in the shade, not in the sun — the withanolides '
                      'are light-sensitive.',
            },
            'storage_months': 24,
            'storage_condition': {
                'de': 'Trocken, dunkel und luftdicht. Erst kurz vor Gebrauch pulverisieren.',
                'en': 'Dry, dark and airtight. Grind to powder only shortly before use.',
            },
        }],
        'safety': {
            'pregnancy': {
                'status': 'contraindicated',
                'note': {
                    'de': 'In der Schwangerschaft zu meiden. In höheren Mengen wird ein erhöhtes '
                          'Fehlgeburtsrisiko beschrieben; in der ayurvedischen Überlieferung galt '
                          'die Wurzel als abtreibend.',
                    'en': 'To be avoided in pregnancy. At higher doses an increased risk of '
                          'miscarriage is described; in Ayurvedic tradition the root was regarded '
                          'as abortifacient.',
                },
            },
            'lactation': {
                'status': 'unknown',
                'note': {
                    'de': 'Es gibt keine Daten zu Übergang in die Muttermilch oder zu Wirkungen '
                          'auf gestillte Kinder.',
                    'en': 'There are no data on passage into breast milk or on effects in '
                          'breastfed infants.',
                },
            },
            'children': {
                'status': 'unknown',
                'note': {
                    'de': 'Bei Kindern und Jugendlichen nicht ausreichend untersucht.',
                    'en': 'Not sufficiently studied in children and adolescents.',
                },
            },
            'drug_interactions': [
                {
                    'drug_class': 'Beruhigungs- und Schlafmittel, Antiepileptika (Benzodiazepine, '
                                  'Barbiturate)',
                    'severity': 'avoid',
                    'source_id': 'msk',
                    'mechanism': {
                        'de': 'Ashwagandha wirkt in vorklinischen Untersuchungen beruhigend und '
                              'greift am GABA-System an. Zusammen mit solchen Medikamenten sind '
                              'sich verstärkende Effekte zu erwarten; wer sie einnimmt, sollte '
                              'Ashwagandha meiden.',
                        'en': 'In preclinical studies ashwagandha has sedative properties and acts '
                              'on the GABA system. Additive effects are to be expected together '
                              'with such medicines; anyone taking them should avoid ashwagandha.',
                    },
                },
                {
                    'drug_class': 'Schilddrüsenhormone',
                    'severity': 'caution',
                    'source_id': 'msk',
                    'mechanism': {
                        'de': 'Nach Einnahme von Ashwagandha-Präparaten sind Fälle einer '
                              'Schilddrüsenüberfunktion beschrieben; die Beschwerden bildeten sich '
                              'nach dem Absetzen zurück. Bei Schilddrüsenerkrankung oder laufender '
                              'Hormonbehandlung ärztlich abklären.',
                        'en': 'Cases of thyrotoxicosis have been described after taking '
                              'ashwagandha preparations; symptoms resolved after stopping. With '
                              'thyroid disease or ongoing hormone treatment, clear it medically.',
                    },
                },
                {
                    'drug_class': 'Immunsuppressiva',
                    'severity': 'caution',
                    'source_id': 'msk',
                    'mechanism': {
                        'de': 'Ashwagandha wird eine immunstimulierende Wirkung zugeschrieben und '
                              'kann damit einer gewollten Unterdrückung des Immunsystems '
                              'entgegenwirken.',
                        'en': 'Ashwagandha is credited with immune-stimulating activity and can '
                              'thus counteract a deliberate suppression of the immune system.',
                    },
                },
                {
                    'drug_class': 'Arzneimittel mit Abbau über Cytochrom P450 (CYP3A4, CYP2B6)',
                    'severity': 'monitor',
                    'source_id': 'msk',
                    'mechanism': {
                        'de': 'Im Laborversuch wirkte Ashwagandha als mäßiger Induktor von CYP3A4 '
                              'und hemmte CYP2B6. Der Spiegel entsprechender Medikamente könnte '
                              'sich dadurch verändern; die klinische Bedeutung ist nicht geklärt.',
                        'en': 'In vitro, ashwagandha acted as a moderate inducer of CYP3A4 and '
                              'inhibited CYP2B6. The levels of drugs handled by these enzymes '
                              'could change; the clinical relevance is unclear.',
                    },
                },
            ],
        },
        'ersetze': [
            ('warnings', 'de',
             'Kein Heilmittel.',
             'Kein Heilmittel. Bei hormonabhängigem Prostatakrebs zu meiden, weil Ashwagandha den '
             'Testosteronspiegel anheben kann. Häufigste Nebenwirkungen sind vorübergehende '
             'Schläfrigkeit, Magendrücken und weicher Stuhl.'),
            ('warnings', 'en',
             'Not a cure.',
             'Not a cure. To be avoided in hormone-sensitive prostate cancer, because ashwagandha '
             'can raise testosterone levels. The commonest side effects are transient '
             'drowsiness, upper abdominal discomfort and loose stools.'),
        ],
    },
}


# === 3. ANWENDEN ===
def anwenden(schreiben: bool) -> int:
    fehler = 0
    for slug, patch in PATCHES.items():
        pfad = DATEN / f'{slug}.json'
        if not pfad.exists():
            print(f'FEHLT: {pfad}')
            fehler += 1
            continue
        d = json.loads(pfad.read_text(encoding='utf-8'))
        aenderungen: list[str] = []

        # 3.1 Quellen ergaenzen (nie ersetzen).
        vorhanden = {q['id'] for q in d.get('sources', [])}
        for q in patch.get('quellen', []):
            if q['id'] not in vorhanden:
                d.setdefault('sources', []).append(q)
                aenderungen.append(f"Quelle +{q['id']}")

        # 3.2 Woertliche Korrekturen — jede muss greifen, sonst Abbruch.
        for feld, sprache, alt, neu in patch.get('ersetze', []):
            ziel = d['safety']['warnings'] if feld == 'warnings' else d[feld]
            if alt not in ziel[sprache]:
                print(f'  ! {slug}: Textstelle nicht gefunden ({feld}/{sprache}): {alt[:50]!r}')
                fehler += 1
                continue
            ziel[sprache] = ziel[sprache].replace(alt, neu, 1)
            aenderungen.append(f'Text {feld}/{sprache}')

        # 3.3 Sicherheitsbloecke — nur setzen, wo noch nichts steht.
        for schluessel, wert in patch.get('safety', {}).items():
            if schluessel in d['safety']:
                print(f'  = {slug}: safety.{schluessel} existiert bereits, uebersprungen')
                continue
            d['safety'][schluessel] = wert
            aenderungen.append(f'safety.{schluessel}')

        # 3.4 Ernte-Block.
        if 'harvest' in patch:
            if d.get('harvest'):
                print(f'  = {slug}: harvest existiert bereits, uebersprungen')
            else:
                d['harvest'] = patch['harvest']
                aenderungen.append('harvest')

        print(f'{slug}: {", ".join(aenderungen) if aenderungen else "nichts zu tun"}')

        if schreiben and aenderungen:
            pfad.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    if not schreiben:
        print('\nVORSCHAU — nichts geschrieben. Mit --schreiben ausfuehren.')
    return fehler


if __name__ == '__main__':
    sys.exit(1 if anwenden('--schreiben' in sys.argv) else 0)
