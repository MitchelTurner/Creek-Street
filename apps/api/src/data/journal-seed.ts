/**
 * Peer historic-district case-study topics for the Creek Street Journal.
 * Embed images are attributed remote assets (Wikimedia / linked articles) — we do not host them.
 * Independent teaching content — not borough policy.
 */

export type JournalEmbed = {
  kind: 'photo' | 'article';
  sourceUrl: string;
  sourceTitle: string;
  imageUrl?: string;
  caption: string;
  credit: string;
};

export type JournalTopic = {
  id: string;
  place: string;
  region: string;
  title: string;
  angle: string;
  takeaways: string[];
  pillars: Array<'CULTURE' | 'BUSINESS' | 'REVENUE'>;
  tags: string[];
  embeds: JournalEmbed[];
};

export const journalTopics: JournalTopic[] = [
  {
    id: 'skagway-boardwalk-tourism',
    place: 'Skagway Historic District',
    region: 'Alaska',
    title: 'How Skagway paces cruise days without hollowing Main Street',
    angle:
      'Skagway’s National Historic Landmark district shows how interpretation and temporary retail can share a narrow historic street without permanent façade rewrites.',
    takeaways: [
      'Keep seasonal kiosks reversible and off primary contributing façades.',
      'Pair visitor storytelling with local maker hours after the last tender.',
      'Publish a clear temporary-use checklist before the season starts.',
    ],
    pillars: ['CULTURE', 'BUSINESS'],
    tags: ['cruise', 'boardwalk', 'temporary-use'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Skagway,_Alaska',
        sourceTitle: 'Skagway, Alaska (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Broadway_Skagway_Alaska.jpg/1280px-Broadway_Skagway_Alaska.jpg',
        caption: 'Broadway in Skagway’s historic commercial core.',
        credit: 'Wikimedia Commons · via Wikipedia article on Skagway',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/klgo/index.htm',
        sourceTitle: 'Klondike Gold Rush National Historical Park (NPS)',
        caption: 'NPS context for Skagway’s gold-rush streetscape and visitor interpretation.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'sitka-russian-block',
    place: 'Sitka Historic District',
    region: 'Alaska',
    title: 'Sitka’s layered history as a living downtown, not a museum street',
    angle:
      'Sitka braids Tlingit continuity, Russian-American landmarks, and working harbor commerce — a model for culture-first interpretation that still supports shops.',
    takeaways: [
      'Center Indigenous place names beside pioneer narratives.',
      'Protect contributing buildings while allowing interior reuse.',
      'Use harbor adjacency for food and marine trades, not only souvenir volume.',
    ],
    pillars: ['CULTURE', 'BUSINESS'],
    tags: ['indigenous', 'harbor', 'interpretation'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Sitka,_Alaska',
        sourceTitle: 'Sitka, Alaska (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Sitka_Alaska_waterfront.jpg/1280px-Sitka_Alaska_waterfront.jpg',
        caption: 'Sitka waterfront and historic shoreline context.',
        credit: 'Wikimedia Commons · via Wikipedia article on Sitka',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/sitk/index.htm',
        sourceTitle: 'Sitka National Historical Park (NPS)',
        caption: 'Federal interpretation of Sitka’s cultural landscape.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'port-townsend-main-street',
    place: 'Port Townsend Historic District',
    region: 'Washington',
    title: 'Port Townsend’s Victorian storefronts and year-round maker economy',
    angle:
      'A classic Main Street program: design review protects cornices and window rhythms while galleries and marine trades fill the shoulder seasons.',
    takeaways: [
      'Pre-vetted sign/awning kits speed tenant openings.',
      'Arts calendars keep downtown alive between festival peaks.',
      'Maritime trades stay visible as authentic economy, not stagecraft.',
    ],
    pillars: ['BUSINESS', 'CULTURE'],
    tags: ['main-street', 'makers', 'signage'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Port_Townsend,_Washington',
        sourceTitle: 'Port Townsend, Washington (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Port_Townsend_WA_waterfront.jpg/1280px-Port_Townsend_WA_waterfront.jpg',
        caption: 'Port Townsend waterfront commercial frontage.',
        credit: 'Wikimedia Commons · via Wikipedia article on Port Townsend',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/articles/port-townsend.htm',
        sourceTitle: 'Port Townsend — NPS article',
        caption: 'National Register / NPS framing for the Victorian seaport district.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'astoria-cannery-reuse',
    place: 'Astoria Downtown Historic District',
    region: 'Oregon',
    title: 'Astoria’s cannery and downtown reuse playbook',
    angle:
      'Working-waterfront buildings converted for lodging, food, and interpretation without erasing industrial honesty — useful for Creek Street’s over-water stock.',
    takeaways: [
      'Keep material honesty when adapting industrial shells.',
      'Food + heritage lodging extends overnight stays past cruise hours.',
      'Interpret cannery labor history as culture, not décor.',
    ],
    pillars: ['BUSINESS', 'CULTURE', 'REVENUE'],
    tags: ['adaptive-reuse', 'waterfront', 'hospitality'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Astoria,_Oregon',
        sourceTitle: 'Astoria, Oregon (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Astoria_Oregon_from_column.jpg/1280px-Astoria_Oregon_from_column.jpg',
        caption: 'Astoria’s hillside and downtown waterfront from the Column.',
        credit: 'Wikimedia Commons · via Wikipedia article on Astoria',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.oregonencyclopedia.org/articles/astoria/',
        sourceTitle: 'Astoria — Oregon Encyclopedia',
        caption: 'Regional encyclopedia context for Astoria’s port economy and built fabric.',
        credit: 'Oregon Encyclopedia',
      },
    ],
  },
  {
    id: 'eureka-old-town',
    place: 'Eureka Old Town Historic District',
    region: 'California',
    title: 'Eureka Old Town: Victorian commercial blocks and visitor pacing',
    angle:
      'Old Town Eureka shows how a dense Victorian commercial grid can host galleries and dining while design review holds cornice lines and storefront glass.',
    takeaways: [
      'Night lighting programs can be temporary and code-friendly.',
      'Gallery crawls fill midweek inventory for small retailers.',
      'District branding should not become façade advertising.',
    ],
    pillars: ['BUSINESS', 'CULTURE'],
    tags: ['victorian', 'galleries', 'lighting'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Eureka,_California',
        sourceTitle: 'Eureka, California (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Carson_Mansion_Eureka_CA.jpg/1280px-Carson_Mansion_Eureka_CA.jpg',
        caption: 'Carson Mansion — Eureka’s iconic Victorian landmark near Old Town.',
        credit: 'Wikimedia Commons · via Wikipedia article on Eureka',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/nr/travel/eureka/index.htm',
        sourceTitle: 'Eureka — NPS travel itinerary',
        caption: 'NPS travel framing for Eureka’s historic resources.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'juneau-downtown-hd',
    place: 'Juneau Downtown Historic District',
    region: 'Alaska',
    title: 'Juneau’s capital-city district and cruise-day street management',
    angle:
      'Another Alaska capital waterfront balancing government offices, tourism, and contributing commercial buildings under seasonal passenger spikes.',
    takeaways: [
      'Coordinate street closures with temporary retail rules.',
      'Invest interpretation in side streets locals still use.',
      'Fee packages for special events can fund cleanup and staffing.',
    ],
    pillars: ['REVENUE', 'BUSINESS'],
    tags: ['cruise', 'capital-city', 'events'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Juneau,_Alaska',
        sourceTitle: 'Juneau, Alaska (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Downtown_Juneau_Alaska.jpg/1280px-Downtown_Juneau_Alaska.jpg',
        caption: 'Downtown Juneau from the channel side.',
        credit: 'Wikimedia Commons · via Wikipedia article on Juneau',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/articles/juneau.htm',
        sourceTitle: 'Juneau — NPS article',
        caption: 'NPS overview of Juneau’s historic resources.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'seward-harbor-district',
    place: 'Seward Historic District',
    region: 'Alaska',
    title: 'Seward’s harbor edge: fishing culture meeting visitor retail',
    angle:
      'Seward keeps marine trades and railroad heritage visible while welcoming Kenai Fjords visitors — a template for authentic waterfront commerce.',
    takeaways: [
      'Showcase working boats and gear as interpretation, not props.',
      'Shoulder-season festivals extend lodging and dining revenue.',
      'Protect small-scale massing along the water’s edge.',
    ],
    pillars: ['CULTURE', 'BUSINESS', 'REVENUE'],
    tags: ['harbor', 'fishing', 'shoulder-season'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Seward,_Alaska',
        sourceTitle: 'Seward, Alaska (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Seward_Alaska_boat_harbor.jpg/1280px-Seward_Alaska_boat_harbor.jpg',
        caption: 'Seward small-boat harbor.',
        credit: 'Wikimedia Commons · via Wikipedia article on Seward',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/kefj/index.htm',
        sourceTitle: 'Kenai Fjords National Park (NPS)',
        caption: 'Visitor-economy context tied to Seward’s harbor gateway.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'cordova-main-street',
    place: 'Cordova',
    region: 'Alaska',
    title: 'Cordova’s Main Street resilience after boom-and-bust cycles',
    angle:
      'A smaller Alaska coastal town where local ownership and cultural programming matter more than peak-day throughput.',
    takeaways: [
      'Local ownership keeps storefront character through tourism swings.',
      'Arts and Copper River salmon culture are the brand — not generic retail.',
      'Invest in winter programming before chasing summer volume.',
    ],
    pillars: ['CULTURE', 'BUSINESS'],
    tags: ['main-street', 'local-ownership', 'winter'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Cordova,_Alaska',
        sourceTitle: 'Cordova, Alaska (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Cordova_Alaska.jpg/1280px-Cordova_Alaska.jpg',
        caption: 'Cordova from the air — coastal town form.',
        credit: 'Wikimedia Commons · via Wikipedia article on Cordova',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/wrst/index.htm',
        sourceTitle: 'Wrangell–St. Elias (NPS)',
        caption: 'Regional park gateway context for Cordova’s visitor story.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'leadville-mining-main',
    place: 'Leadville Historic District',
    region: 'Colorado',
    title: 'Leadville: mining-era Main Street as year-round destination',
    angle:
      'High-country mining towns prove that authentic industrial heritage can sell lodging and tours without inventing faux façades.',
    takeaways: [
      'Honest materials beat theme-park cladding every time.',
      'Guided tours monetize accurate history.',
      'Winter events stabilize municipal sales-tax receipts.',
    ],
    pillars: ['CULTURE', 'REVENUE'],
    tags: ['mining', 'tours', 'winter'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Leadville,_Colorado',
        sourceTitle: 'Leadville, Colorado (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Leadville_Colorado_main_street.jpg/1280px-Leadville_Colorado_main_street.jpg',
        caption: 'Leadville’s historic Main Street corridor.',
        credit: 'Wikimedia Commons · via Wikipedia article on Leadville',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/nr/travel/american_latino_heritage/leadville.htm',
        sourceTitle: 'Leadville — NPS travel',
        caption: 'NPS framing for Leadville’s historic resources.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'galena-illinois',
    place: 'Galena Historic District',
    region: 'Illinois',
    title: 'Galena’s Main Street: tourism without erasing residential fabric',
    angle:
      'One of the Midwest’s densest historic commercial streets — lessons in parking, shoulder events, and keeping residential districts intact behind the storefronts.',
    takeaways: [
      'Visitor parking strategy is a revenue + livability tool.',
      'B&B lodging spreads economic benefit beyond retail hours.',
      'Protect the residential rim; don’t let commercial spill erase it.',
    ],
    pillars: ['BUSINESS', 'REVENUE'],
    tags: ['main-street', 'lodging', 'parking'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Galena,_Illinois',
        sourceTitle: 'Galena, Illinois (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Galena_Illinois_Main_Street.jpg/1280px-Galena_Illinois_Main_Street.jpg',
        caption: 'Galena Main Street commercial blocks.',
        credit: 'Wikimedia Commons · via Wikipedia article on Galena',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/nr/travel/galena/index.htm',
        sourceTitle: 'Galena — NPS travel itinerary',
        caption: 'NPS itinerary covering Galena’s historic core.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'new-bedford-whaling',
    place: 'New Bedford Historic District',
    region: 'Massachusetts',
    title: 'New Bedford: whaling heritage funding a working waterfront',
    angle:
      'A National Historical Park downtown that still fishes — culture interpretation and working piers share space, with fee and grant structures that fund public realm.',
    takeaways: [
      'National park partnership can amplify local storytelling budgets.',
      'Keep working waterfront uses visible beside visitor retail.',
      'Grants + park fees can underwrite public interpretation staff.',
    ],
    pillars: ['CULTURE', 'REVENUE'],
    tags: ['whaling', 'nps', 'waterfront'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/New_Bedford,_Massachusetts',
        sourceTitle: 'New Bedford, Massachusetts (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/New_Bedford_MA_Custom_House.jpg/1280px-New_Bedford_MA_Custom_House.jpg',
        caption: 'New Bedford Custom House in the historic waterfront district.',
        credit: 'Wikimedia Commons · via Wikipedia article on New Bedford',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/nebe/index.htm',
        sourceTitle: 'New Bedford Whaling National Historical Park (NPS)',
        caption: 'Park partnership model for downtown interpretation.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'savannah-squares',
    place: 'Savannah Historic District',
    region: 'Georgia',
    title: 'Savannah’s squares: public realm that earns its keep',
    angle:
      'A caution-and-inspiration pair: world-famous historic tourism with lessons on carrying capacity, fee structures, and protecting residential livability.',
    takeaways: [
      'Tour bus and walking-tour rules protect sidewalk capacity.',
      'Public squares are infrastructure — budget for their upkeep.',
      'Residential quiet hours matter as much as storefront polish.',
    ],
    pillars: ['REVENUE', 'CULTURE'],
    tags: ['carrying-capacity', 'tours', 'public-realm'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Savannah_Historic_District',
        sourceTitle: 'Savannah Historic District (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Forsyth_Park_fountain_Savannah.jpg/1280px-Forsyth_Park_fountain_Savannah.jpg',
        caption: 'Forsyth Park — Savannah’s public-realm anchor.',
        credit: 'Wikimedia Commons · via Wikipedia (Savannah Historic District)',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/nr/travel/savannah/index.htm',
        sourceTitle: 'Savannah — NPS travel itinerary',
        caption: 'NPS itinerary for Savannah’s historic resources.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'deadwood-gaming-balance',
    place: 'Deadwood Historic District',
    region: 'South Dakota',
    title: 'Deadwood: gaming revenue funding historic fabric',
    angle:
      'A rare case where a dedicated revenue stream was explicitly tied to historic preservation — useful when talking municipal capacity, not when copying gaming.',
    takeaways: [
      'Dedicated fees can fund preservation if legally ring-fenced.',
      'Authenticity still requires design review on façades.',
      'Night economy needs lighting rules that respect contributing buildings.',
    ],
    pillars: ['REVENUE', 'CULTURE'],
    tags: ['fees', 'preservation-funding', 'night-economy'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Deadwood,_South_Dakota',
        sourceTitle: 'Deadwood, South Dakota (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Deadwood_South_Dakota_main_street.jpg/1280px-Deadwood_South_Dakota_main_street.jpg',
        caption: 'Deadwood’s historic Main Street.',
        credit: 'Wikimedia Commons · via Wikipedia article on Deadwood',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/nr/travel/deadwood/index.htm',
        sourceTitle: 'Deadwood — NPS travel',
        caption: 'NPS travel overview of Deadwood’s landmark district.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'telluride-festival-town',
    place: 'Telluride Historic District',
    region: 'Colorado',
    title: 'Telluride: festival calendar as shoulder-season engine',
    angle:
      'A compact mining-era box of a town that uses festivals and film culture to fill beds when ski season softens — without rewriting the Victorian street wall.',
    takeaways: [
      'A published culture calendar is an economic development tool.',
      'Temporary stages and banners need clear HD rules.',
      'Lodging taxes can fund both arts and street maintenance.',
    ],
    pillars: ['BUSINESS', 'REVENUE', 'CULTURE'],
    tags: ['festivals', 'lodging-tax', 'shoulder-season'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Telluride,_Colorado',
        sourceTitle: 'Telluride, Colorado (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Telluride_Colorado_main_street.jpg/1280px-Telluride_Colorado_main_street.jpg',
        caption: 'Telluride’s boxed-in Main Street against the box canyon.',
        credit: 'Wikimedia Commons · via Wikipedia article on Telluride',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/nr/travel/colorado/telluride.htm',
        sourceTitle: 'Telluride — NPS / Colorado travel',
        caption: 'Historic context for Telluride’s commercial core.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'annapolis-harbor',
    place: 'Annapolis Historic District',
    region: 'Maryland',
    title: 'Annapolis: capital harbor, maritime trades, and visitor fees',
    angle:
      'A colonial capital that still sails — harbor fees, maritime museums, and strict design review keep the waterfront productive and photogenic.',
    takeaways: [
      'Harbor enterprise funds can support public docks and interpretation.',
      'Design review protects brick rhythms that define the brand.',
      'School groups and day visitors need different fee products than overnight guests.',
    ],
    pillars: ['REVENUE', 'CULTURE'],
    tags: ['harbor', 'fees', 'maritime'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Annapolis,_Maryland',
        sourceTitle: 'Annapolis, Maryland (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Annapolis_Maryland_city_dock.jpg/1280px-Annapolis_Maryland_city_dock.jpg',
        caption: 'Annapolis City Dock and historic harbor edge.',
        credit: 'Wikimedia Commons · via Wikipedia article on Annapolis',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/nr/travel/annapolis/index.htm',
        sourceTitle: 'Annapolis — NPS travel itinerary',
        caption: 'NPS itinerary for Annapolis historic resources.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'santa-fe-plaza',
    place: 'Santa Fe Historic District',
    region: 'New Mexico',
    title: 'Santa Fe Plaza: culture markets with strict design language',
    angle:
      'Strong design standards around adobe and portal forms — plus Indigenous and Hispanic market traditions that keep the plaza economically alive.',
    takeaways: [
      'A consistent design language is a tourism asset.',
      'Vendor markets need fair rules that privilege local makers.',
      'Interpretation should credit living cultures, not frozen myth.',
    ],
    pillars: ['CULTURE', 'BUSINESS'],
    tags: ['plaza', 'markets', 'design-standards'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Santa_Fe,_New_Mexico',
        sourceTitle: 'Santa Fe, New Mexico (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Santa_Fe_Plaza.jpg/1280px-Santa_Fe_Plaza.jpg',
        caption: 'Santa Fe Plaza — civic and market heart.',
        credit: 'Wikimedia Commons · via Wikipedia article on Santa Fe',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/nr/travel/santafetraces/index.htm',
        sourceTitle: 'Santa Fe — NPS travel',
        caption: 'NPS travel framing for Santa Fe’s historic resources.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'charleston-battery',
    place: 'Charleston Historic District',
    region: 'South Carolina',
    title: 'Charleston: tourism pressure, design review, and fee capacity',
    angle:
      'A high-pressure historic city with mature review boards, carriage rules, and lodging taxes — study the governance tools, not only the postcard streets.',
    takeaways: [
      'Tourism management ordinances are part of preservation.',
      'Lodging and tour fees can fund sidewalk and drainage repair.',
      'Resident amenity hours protect the district after peak visitation.',
    ],
    pillars: ['REVENUE', 'CULTURE'],
    tags: ['tourism-management', 'lodging-tax', 'governance'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Charleston,_South_Carolina',
        sourceTitle: 'Charleston, South Carolina (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Rainbow_Row_Charleston.jpg/1280px-Rainbow_Row_Charleston.jpg',
        caption: 'Rainbow Row — Charleston’s iconic contributing street wall.',
        credit: 'Wikimedia Commons · via Wikipedia article on Charleston',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/nr/travel/charleston/index.htm',
        sourceTitle: 'Charleston — NPS travel itinerary',
        caption: 'NPS itinerary for Charleston’s historic resources.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'newport-ri-waterfront',
    place: 'Newport Historic District',
    region: 'Rhode Island',
    title: 'Newport: colonial waterfront, yacht economy, and house museums',
    angle:
      'Layered visitor products — house museums, sailing culture, and downtown retail — funded partly by admissions and events.',
    takeaways: [
      'Multiple ticket products reduce dependence on a single retail peak.',
      'House museums need compatible adjacent food & lodging.',
      'Waterfront walks are free public goods that still drive paid stays.',
    ],
    pillars: ['BUSINESS', 'REVENUE', 'CULTURE'],
    tags: ['museums', 'waterfront', 'tickets'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Newport,_Rhode_Island',
        sourceTitle: 'Newport, Rhode Island (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Newport_Rhode_Island_harbor.jpg/1280px-Newport_Rhode_Island_harbor.jpg',
        caption: 'Newport harbor and historic shoreline.',
        credit: 'Wikimedia Commons · via Wikipedia article on Newport',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/nr/travel/newport/index.htm',
        sourceTitle: 'Newport — NPS travel itinerary',
        caption: 'NPS itinerary covering Newport’s historic core.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'key-west-duval',
    place: 'Key West Historic District',
    region: 'Florida',
    title: 'Key West: carrying capacity on a constrained island Main Street',
    angle:
      'An extreme tourism case — useful for Creek Street when thinking about boardwalk capacity, temporary signage, and protecting contributing cottages.',
    takeaways: [
      'Capacity limits protect the asset that markets the town.',
      'Temporary A-frames and sandwich boards need hard rules.',
      'Local housing pressure is a preservation issue, not only a social one.',
    ],
    pillars: ['CULTURE', 'REVENUE'],
    tags: ['carrying-capacity', 'signage', 'housing'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Key_West,_Florida',
        sourceTitle: 'Key West, Florida (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Duval_Street_Key_West.jpg/1280px-Duval_Street_Key_West.jpg',
        caption: 'Duval Street — Key West’s high-pressure commercial spine.',
        credit: 'Wikimedia Commons · via Wikipedia article on Key West',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/drto/index.htm',
        sourceTitle: 'Dry Tortugas / Key West region (NPS)',
        caption: 'Regional NPS context for Keys visitation patterns.',
        credit: 'National Park Service',
      },
    ],
  },
  {
    id: 'victoria-bastion-square',
    place: 'Old Town Victoria / Bastion Square',
    region: 'British Columbia',
    title: 'Victoria’s Old Town: Canadian Main Street lessons for a rainy port',
    angle:
      'A Pacific port neighbor with tourism, cruise, and heritage conservation area tools — close climate analog for Ketchikan’s visitor patterns.',
    takeaways: [
      'Heritage conservation areas can pair with business improvement districts.',
      'Covered walks and canopies need design-review templates.',
      'Cross-border cruise itineraries reward authentic regional foodways.',
    ],
    pillars: ['BUSINESS', 'CULTURE'],
    tags: ['canada', 'cruise', 'canopies'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Victoria,_British_Columbia',
        sourceTitle: 'Victoria, British Columbia (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Victoria_BC_Inner_Harbour.jpg/1280px-Victoria_BC_Inner_Harbour.jpg',
        caption: 'Victoria Inner Harbour — tourism and heritage edge.',
        credit: 'Wikimedia Commons · via Wikipedia article on Victoria',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.heritagebc.ca/',
        sourceTitle: 'Heritage BC',
        caption: 'Provincial heritage context for conservation-area practice.',
        credit: 'Heritage BC',
      },
    ],
  },
  {
    id: 'ketchikan-region-peers',
    place: 'Southeast Alaska peer towns',
    region: 'Alaska',
    title: 'Southeast Alaska peers: shared cruise calendars, different street rules',
    angle:
      'A comparative lens across SE Alaska towns — what Creek Street can borrow when every neighbor faces the same ship schedule but different design-review cultures.',
    takeaways: [
      'Compare temporary-use and sandwich-board rules across ports.',
      'Share apprenticeship models for historic wood repair.',
      'Regional storytelling licenses can fund accurate media packs.',
    ],
    pillars: ['CULTURE', 'BUSINESS', 'REVENUE'],
    tags: ['southeast', 'cruise', 'regional'],
    embeds: [
      {
        kind: 'photo',
        sourceUrl: 'https://en.wikipedia.org/wiki/Ketchikan,_Alaska',
        sourceTitle: 'Ketchikan, Alaska (Wikipedia)',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ketchikan_Alaska_waterfront.jpg/1280px-Ketchikan_Alaska_waterfront.jpg',
        caption: 'Ketchikan waterfront — regional peer context for Creek Street.',
        credit: 'Wikimedia Commons · via Wikipedia article on Ketchikan',
      },
      {
        kind: 'article',
        sourceUrl: 'https://www.nps.gov/klse/index.htm',
        sourceTitle: 'Klondike Gold Rush — Seattle unit (NPS)',
        caption: 'Regional gold-rush corridor interpretation that SE towns share.',
        credit: 'National Park Service',
      },
    ],
  },
];

export const JOURNAL_DISCLAIMER =
  'Creek Street Journal — independent case-study teaching by Mitchel Turner Dev, LLC. Not City of Ketchikan or Ketchikan Gateway Borough policy. Photos are embedded from source articles with attribution; we do not host or claim ownership of remote media.';
