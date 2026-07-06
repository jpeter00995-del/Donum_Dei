// === Donum Dei — i18n / EN / common ===
// General UI strings: site, navigation, language switcher, footer, disclaimer, badges.

export const common = {
  'site.title': 'Donum ∞ Dei',
  'site.tagline': 'Interactive medicinal plants database',
  // Home hero: small stat line + calm subtitle. {count} = live plant count.
  'home.eyebrow': '{count} plants · bilingual · with verified sources',
  'home.subtitle': 'Healing herbs, houseplants and toxic plants — with profiles, a seasonal calendar, a distribution map and verifiable sources.',

  'nav.plants': 'Plants',
  'nav.map': 'Map',
  'nav.garden': 'My Garden',
  'nav.calendar': 'Calendar',
  'nav.companion': 'Companion Planting',
  'nav.quiz': 'Quiz',
  'nav.indoor': '🪴 Houseplants',
  'nav.mushrooms': '🍄 Mushrooms',
  'nav.controlled': '🌀 Psychoactive',
  'nav.packages': '📦 Planting Sets',
  'nav.permaculture': '🌱 Permaculture',
  'nav.symptoms': '🌿 Help with…',
  'nav.search': '🔍 Search',
  // Group titles for the header dropdown menus
  'nav.group_discover': 'Discover',
  'nav.group_garden': 'Plan garden',
  'nav.group_themes': 'Topics',
  'nav.group_learn': 'Learn',
  'nav.featured_badge': 'Featured',
  'nav.help': 'Info & legal',

  'search.title': 'Search',
  'search.placeholder': 'Plant, symptom, constituent…',
  'search.intro': 'Full-text search across all 297 entries, 637 pages and constituents. Type a keyword — results appear instantly.',
  'search.examples_title': 'Example searches',
  'search.examples': 'IBS · cough · PA toxic · Hildegard · permaculture · aromatic',

  'lang.switch_to': 'DE',
  'lang.current': 'EN',

  'common.weeks': 'weeks',
  'common.years': 'years',

  'badge.de_only': 'DE only',
  'badge.en_only': 'EN only',

  'footer.about': 'About',
  'footer.imprint': 'Imprint',
  'footer.privacy': 'Privacy',
  'footer.credits': 'Image Credits',
  'footer.separator': '·',

  'disclaimer.text': 'This application is for educational purposes only. It does not replace medical advice. Consult a physician or pharmacist for health concerns.',

  // === Photo identification (Pl@ntNet) ===
  'identify.title': 'Identify by photo',
  'identify.intro': 'Upload a photo of a leaf, flower or fruit — the recognizer suggests possible species. Matches in our database are linked directly.',
  'identify.choose': 'Choose or take a photo',
  'identify.change': 'Different photo',
  'identify.submit': 'Identify',
  'identify.analyzing': 'Identifying image …',
  'identify.preview_alt': 'Uploaded plant photo',
  'identify.results_title': 'Possible species',
  'identify.in_db': 'In our database →',
  'identify.not_in_db': 'Not in our database yet',
  'identify.match_high': 'High match',
  'identify.match_possible': 'Possible match',
  'identify.match_unsure': 'Uncertain — please use a sharper photo of a leaf/flower',
  'identify.no_results': 'No identification possible. Please try a sharper photo of a single plant part.',
  'identify.retry': 'Try again',
  'identify.err_unavailable': 'Photo identification is currently unavailable. The text search above still works.',
  'identify.err_rate_limit': 'Identification is at capacity today. Please try again later.',
  'identify.err_timeout': 'The image recognizer is not responding right now. Please try again.',
  'identify.err_generic': 'Something went wrong. Please try again.',
  'identify.disclaimer': 'Note: the photo is sent to Pl@ntNet (EU) for identification. The result is a suggestion, not medical advice.',
  'identify.attribution': 'Plant identification by Pl@ntNet · data under CC-BY',
};
