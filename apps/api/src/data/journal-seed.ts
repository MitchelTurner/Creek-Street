/**
 * Peer historic-district case studies for the Creek Street Journal.
 * Voice: vivid, specific, a little salty — not brochure copy.
 * Photos are remote embeds from source articles (Wikimedia / NPS / encyclopedia).
 * Independent teaching — not borough policy.
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
  /** One-line cold open — sensory, specific */
  hook: string;
  angle: string;
  /** Short scene-setting paragraphs used in curated posts */
  scenes: string[];
  takeaways: string[];
  creekStreetHook: string;
  pillars: Array<'CULTURE' | 'BUSINESS' | 'REVENUE'>;
  tags: string[];
  embeds: JournalEmbed[];
};

/** Bump when seed voice/embeds change so the store re-bootstraps. */
export const JOURNAL_SEED_VERSION = 2;

export const JOURNAL_DISCLAIMER =
  'Creek Street Journal — independent case-study teaching by Mitchel Turner Dev, LLC. Not City of Ketchikan or Ketchikan Gateway Borough policy. Photos are embedded from source articles with attribution; we do not host or claim ownership of remote media.';

function photo(
  sourceUrl: string,
  sourceTitle: string,
  imageUrl: string,
  caption: string,
  credit: string,
): JournalEmbed {
  return { kind: 'photo', sourceUrl, sourceTitle, imageUrl, caption, credit };
}

function article(sourceUrl: string, sourceTitle: string, caption: string, credit: string): JournalEmbed {
  return { kind: 'article', sourceUrl, sourceTitle, caption, credit };
}

export const journalTopics: JournalTopic[] = [
  {
    id: 'skagway-boardwalk-tourism',
    place: 'Skagway Historic District',
    region: 'Alaska',
    title: 'Skagway’s Broadway: when the ships leave, who owns the street?',
    hook: 'At noon Broadway is a river of rain jackets. By 8 p.m. you can hear boot heels on wet board again.',
    angle:
      'Skagway’s National Historic Landmark core survives cruise tides by treating temporary retail as temporary — and putting real gold-rush storytelling back on the street after the last tender.',
    scenes: [
      'Watch a jewelry cart roll onto Broadway at 9:15 and roll off again before dinner. That choreography is the product. The false-front skyline stays; the sales floor flexes.',
      'NPS rangers and local guides still win the evening crowd with stories that don’t need a neon arrow on a contributing façade. Creek Street’s lesson: interpretation can outsell clutter.',
    ],
    takeaways: [
      'Seasonal kiosks should be reversible, licensed, and banned from primary contributing fronts.',
      'Program local maker hours after the last tender — own the shoulder of the day.',
      'Publish the temporary-use checklist before May, not during the first crush.',
    ],
    creekStreetHook:
      'Draft a “last-tender to dusk” maker window for one Creek Street block and run it through triage before promising anyone a cart.',
    pillars: ['CULTURE', 'BUSINESS'],
    tags: ['cruise', 'boardwalk', 'temporary-use'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Skagway,_Alaska',
        'Skagway, Alaska (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Skagway_Alaska.jpg/1280px-Skagway_Alaska.jpg',
        'Skagway from the channel — the whole town is the arrival experience.',
        'Wikimedia Commons · via Wikipedia (Skagway)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Skagway,_Alaska',
        'Skagway, Alaska (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/White_Pass_and_Yukon_Route_depot_Skagway.jpg/1280px-White_Pass_and_Yukon_Route_depot_Skagway.jpg',
        'White Pass depot — railroad bones still structure the visitor day.',
        'Wikimedia Commons · via Wikipedia (Skagway)',
      ),
      photo(
        'https://www.nps.gov/klgo/index.htm',
        'Klondike Gold Rush NHP (NPS)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Skagway_Alaska_street.jpg/1280px-Skagway_Alaska_street.jpg',
        'Historic commercial streetscape under Landmark protection.',
        'Wikimedia Commons · NPS / Wikipedia context',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Klondike_Gold_Rush_National_Historical_Park',
        'Klondike Gold Rush NHP (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Broadway_Skagway.jpg/1280px-Broadway_Skagway.jpg',
        'Broadway’s false fronts — the stage set that must stay honest.',
        'Wikimedia Commons · via Wikipedia (Klondike NHP)',
      ),
      article(
        'https://www.nps.gov/klgo/index.htm',
        'Klondike Gold Rush National Historical Park',
        'Federal interpretation playbook for a gold-rush Main Street under cruise pressure.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'sitka-russian-block',
    place: 'Sitka Historic District',
    region: 'Alaska',
    title: 'Sitka doesn’t pick one century — and that’s why it still feels alive',
    hook: 'You can smell alder smoke, hear a floatplane, and pass a Russian bishop’s house in the same ten-minute walk.',
    angle:
      'Sitka’s power is layering: Tlingit continuity, Russian-American landmarks, and a working harbor that never agreed to become a museum diorama.',
    scenes: [
      'Tour buses pause at the onion dome. Locals cut behind to the harbor where gear still drips salt. Both streets are “historic.” Only one is allowed to look busy.',
      'Place names do real work here. When English isn’t the only language on a plaque, visitors slow down — and shops near those stops sell better stories, not just magnets.',
    ],
    takeaways: [
      'Center Indigenous place names beside pioneer narratives — dual voice, one street.',
      'Protect contributing shells; let interiors host food, studios, and services.',
      'Keep marine trades visible. Authenticity is inventory, not a mural of a boat.',
    ],
    creekStreetHook:
      'Pilot bilingual interpretation at two Creek Street stops and measure whether evening foot traffic sticks around for local makers.',
    pillars: ['CULTURE', 'BUSINESS'],
    tags: ['indigenous', 'harbor', 'interpretation'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Sitka,_Alaska',
        'Sitka, Alaska (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Sitka_Alaska.jpg/1280px-Sitka_Alaska.jpg',
        'Sitka against forested islands — culture and harbor in one frame.',
        'Wikimedia Commons · via Wikipedia (Sitka)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/St._Michael%27s_Cathedral_(Sitka,_Alaska)',
        "St. Michael's Cathedral (Wikipedia)",
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/St_Michaels_Cathedral_Sitka.jpg/1280px-St_Michaels_Cathedral_Sitka.jpg',
        "St. Michael’s Cathedral — a landmark that still anchors downtown ritual.",
        'Wikimedia Commons · via Wikipedia (St. Michael’s Cathedral)',
      ),
      photo(
        'https://www.nps.gov/sitk/index.htm',
        'Sitka National Historical Park (NPS)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Totem_Walk_Sitka.jpg/1280px-Totem_Walk_Sitka.jpg',
        'Totem walk — Indigenous continuity as public landscape, not a gift-shop theme.',
        'Wikimedia Commons · NPS / Sitka NHP context',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Sitka_National_Historical_Park',
        'Sitka NHP (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Sitka_waterfront.jpg/1280px-Sitka_waterfront.jpg',
        'Working waterfront edge where tourism and gear still share the tide line.',
        'Wikimedia Commons · via Wikipedia (Sitka NHP)',
      ),
      article(
        'https://www.nps.gov/sitk/index.htm',
        'Sitka National Historical Park',
        'How a park unit frames a living cultural landscape without freezing the town.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'port-townsend-main-street',
    place: 'Port Townsend Historic District',
    region: 'Washington',
    title: 'Port Townsend’s secret: the Victorians are the stage, makers are the show',
    hook: 'Fog lifts off the bay and suddenly every bay window looks like it has a plan for the next hundred years.',
    angle:
      'Port Townsend proves design review can be a business strategy: cornices and window rhythms stay put while galleries, marine trades, and kitchens rotate underneath.',
    scenes: [
      'A sailmaker’s loft above a café. A gallery that used to be a bank. Nobody asked the brick to pretend it was built last Tuesday.',
      'Shoulder season is when the town earns its reputation. Festival weekends are dessert; Tuesday in October is the meal.',
    ],
    takeaways: [
      'Ship a pre-vetted sign/awning kit so tenants open faster without inventing style.',
      'Keep an arts calendar public — emptiness is a branding problem.',
      'Let marine trades stay visible; they are the authenticity budget.',
    ],
    creekStreetHook:
      'Bundle three approved Creek Street sign/paint packages and hand them to the next tenant before they hire a designer from out of town.',
    pillars: ['BUSINESS', 'CULTURE'],
    tags: ['main-street', 'makers', 'signage'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Port_Townsend,_Washington',
        'Port Townsend (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Port_Townsend_Washington.jpg/1280px-Port_Townsend_Washington.jpg',
        'Victorian commercial wall meeting the Strait — tourism with a working edge.',
        'Wikimedia Commons · via Wikipedia (Port Townsend)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Port_Townsend,_Washington',
        'Port Townsend (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Port_Townsend_WA_downtown.jpg/1280px-Port_Townsend_WA_downtown.jpg',
        'Downtown blocks where window rhythm does more branding than any logo.',
        'Wikimedia Commons · via Wikipedia (Port Townsend)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Port_Townsend_Historic_District',
        'Port Townsend Historic District (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Bell_Tower_Port_Townsend.jpg/1280px-Bell_Tower_Port_Townsend.jpg',
        'Bell Tower — civic landmarks that pin a Main Street in memory.',
        'Wikimedia Commons · via Wikipedia (Port Townsend HD)',
      ),
      photo(
        'https://www.nps.gov/articles/port-townsend.htm',
        'Port Townsend — NPS article',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Port_Townsend_waterfront.jpg/1280px-Port_Townsend_waterfront.jpg',
        'Waterfront working edge — boats and brick in the same economy.',
        'Wikimedia Commons · NPS / Port Townsend context',
      ),
      article(
        'https://www.nps.gov/articles/port-townsend.htm',
        'Port Townsend — NPS',
        'National Register framing for a Victorian seaport that still works.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'astoria-cannery-reuse',
    place: 'Astoria Downtown Historic District',
    region: 'Oregon',
    title: 'Astoria kept the smell of the river — and that honesty pays rent',
    hook: 'The canneries stopped canning. The buildings refused to pretend they were cottages.',
    angle:
      'Astoria’s adaptive reuse works because industrial honesty stayed in the bones: lodging, food, and interpretation moved in without erasing the working-waterfront story.',
    scenes: [
      'A hotel lobby that still shows timber and river light. Guests Instagram the beams, then walk outside and buy smoked fish from someone who still knows the tide book.',
      'Heritage lodging extends the spend past cruise hours. That’s not nostalgia — that’s a night of lodging tax and a second dinner seating.',
    ],
    takeaways: [
      'Material honesty beats faux-historic cladding every time review boards (and visitors) keep score.',
      'Food + heritage lodging stretch revenue past the last bus.',
      'Interpret labor history as culture — not décor props in a gift shop.',
    ],
    creekStreetHook:
      'Pick one over-water Creek Street structure and write an interior-first reuse story that never promises a fake façade.',
    pillars: ['BUSINESS', 'CULTURE', 'REVENUE'],
    tags: ['adaptive-reuse', 'waterfront', 'hospitality'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Astoria,_Oregon',
        'Astoria, Oregon (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Astoria_Oregon.jpg/1280px-Astoria_Oregon.jpg',
        'Astoria stacked on the hillside — downtown still answers to the Columbia.',
        'Wikimedia Commons · via Wikipedia (Astoria)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Astoria_Column',
        'Astoria Column (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Astoria_Column.jpg/1280px-Astoria_Column.jpg',
        'Astoria Column — a civic landmark that sells the whole town in one climb.',
        'Wikimedia Commons · via Wikipedia (Astoria Column)',
      ),
      photo(
        'https://www.oregonencyclopedia.org/articles/astoria/',
        'Astoria — Oregon Encyclopedia',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Astoria_Bridge.jpg/1280px-Astoria_Bridge.jpg',
        'Bridge and river weather — industrial geography as brand.',
        'Wikimedia Commons · Oregon Encyclopedia context',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Astoria,_Oregon',
        'Astoria, Oregon (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Downtown_Astoria_Oregon.jpg/1280px-Downtown_Astoria_Oregon.jpg',
        'Downtown blocks where cannery-era massing still reads as itself.',
        'Wikimedia Commons · via Wikipedia (Astoria)',
      ),
      article(
        'https://www.oregonencyclopedia.org/articles/astoria/',
        'Astoria — Oregon Encyclopedia',
        'Port economy and built fabric without the brochure gloss.',
        'Oregon Encyclopedia',
      ),
    ],
  },
  {
    id: 'eureka-old-town',
    place: 'Eureka Old Town Historic District',
    region: 'California',
    title: 'Eureka Old Town after dark: Victorian glass, gallery light, fewer alibis',
    hook: 'When the foghorns start, the cornices look sharper — and empty storefronts look louder.',
    angle:
      'Old Town Eureka shows how a dense Victorian grid can host galleries and dining while design review holds the glass-and-cornice rhythm that makes the night walk worth it.',
    scenes: [
      'A First Friday crawl turns upper-floor studios into street theater. The architecture doesn’t need temporary vinyl banners screaming SALE.',
      'Night lighting that grazes brick beats strings of carnival bulbs every time a review board asks about character.',
    ],
    takeaways: [
      'Temporary lighting programs can be code-friendly and still cinematic.',
      'Gallery crawls fill midweek inventory for small retailers.',
      'District branding belongs on maps and calendars — not as façade advertising.',
    ],
    creekStreetHook:
      'Sketch a reversible lantern-walk lighting plan for Creek Street and pressure-test it in triage before anyone buys hardware.',
    pillars: ['BUSINESS', 'CULTURE'],
    tags: ['victorian', 'galleries', 'lighting'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Eureka,_California',
        'Eureka, California (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Carson_Mansion_Eureka_CA.jpg/1280px-Carson_Mansion_Eureka_CA.jpg',
        'Carson Mansion — the postcard that still funds curiosity about Old Town.',
        'Wikimedia Commons · via Wikipedia (Eureka)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Eureka,_California',
        'Eureka, California (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Eureka_California_waterfront.jpg/1280px-Eureka_California_waterfront.jpg',
        'Waterfront edge where Old Town meets the bay’s working weather.',
        'Wikimedia Commons · via Wikipedia (Eureka)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Old_Town_Eureka',
        'Old Town Eureka (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Eureka_CA_Old_Town.jpg/1280px-Eureka_CA_Old_Town.jpg',
        'Old Town commercial fabric — glass, cast iron, and evening foot traffic.',
        'Wikimedia Commons · via Wikipedia (Old Town Eureka)',
      ),
      photo(
        'https://www.nps.gov/nr/travel/eureka/index.htm',
        'Eureka — NPS travel',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Workers_Samuelson_Eureka.jpg/1280px-Workers_Samuelson_Eureka.jpg',
        'Labor history still readable in Eureka’s historic resources.',
        'Wikimedia Commons · NPS Eureka travel context',
      ),
      article(
        'https://www.nps.gov/nr/travel/eureka/index.htm',
        'Eureka — NPS travel itinerary',
        'How NPS frames Eureka’s Victorian commercial resources for visitors.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'juneau-downtown-hd',
    place: 'Juneau Downtown Historic District',
    region: 'Alaska',
    title: 'Juneau’s downtown math: ships, stairs, and who pays for the sidewalks',
    hook: 'The capital city learns every summer that gravity and gangways are a land-use system.',
    angle:
      'Juneau balances government offices, tourism, and contributing commercial buildings under the same passenger spikes Creek Street knows — with clearer event-fee tools than most small ports admit.',
    scenes: [
      'A street closes for a market; the invoice for cleanup should already exist. Otherwise the public realm becomes a free venue with a private profit.',
      'Side streets where locals still buy coffee are the resilience plan. If every dollar chases the cruise gangway, winter owns you.',
    ],
    takeaways: [
      'Coordinate street closures with temporary retail rules — one packet, one price.',
      'Put interpretation budget into side streets locals still use.',
      'Special-event fee packages can fund cleanup and staffing without inventing a new tax every August.',
    ],
    creekStreetHook:
      'Price a shoulder-season event permit bundle and publish it next to the Creek Street build-window calendar.',
    pillars: ['REVENUE', 'BUSINESS'],
    tags: ['cruise', 'capital-city', 'events'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Juneau,_Alaska',
        'Juneau, Alaska (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Juneau_Alaska_panorama.jpg/1280px-Juneau_Alaska_panorama.jpg',
        'Juneau from the channel — capital density meeting tidewater tourism.',
        'Wikimedia Commons · via Wikipedia (Juneau)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Juneau,_Alaska',
        'Juneau, Alaska (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Downtown_Juneau_Alaska.jpg/1280px-Downtown_Juneau_Alaska.jpg',
        'Downtown stacked against the mountain — every sidewalk is contested space.',
        'Wikimedia Commons · via Wikipedia (Juneau)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Alaska_State_Capitol',
        'Alaska State Capitol (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Alaska_State_Capitol.jpg/1280px-Alaska_State_Capitol.jpg',
        'Capitol building — government and tourism sharing one compressed downtown.',
        'Wikimedia Commons · via Wikipedia (Alaska State Capitol)',
      ),
      photo(
        'https://www.nps.gov/articles/juneau.htm',
        'Juneau — NPS article',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Juneau_cruise_ships.jpg/1280px-Juneau_cruise_ships.jpg',
        'Cruise ships at the dock — the daily land-use event.',
        'Wikimedia Commons · NPS / Juneau context',
      ),
      article(
        'https://www.nps.gov/articles/juneau.htm',
        'Juneau — NPS',
        'Historic resources under capital-city and cruise pressure.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'seward-harbor-district',
    place: 'Seward Historic District',
    region: 'Alaska',
    title: 'Seward’s harbor doesn’t cosplay fishing — it still smells like it',
    hook: 'Halibut ice melt in the gutter is a better authenticity signal than any carved wooden captain.',
    angle:
      'Seward keeps marine trades and railroad heritage visible while Kenai Fjords visitors pour through — a template for waterfront commerce that doesn’t apologize for work.',
    scenes: [
      'Tourists photograph boats because the boats are real. The second you hide the gear, you’re selling a postcard of a postcard.',
      'Shoulder-season festivals fill beds when the big ships thin out. Culture calendar = occupancy model.',
    ],
    takeaways: [
      'Showcase working boats and gear as interpretation, not props.',
      'Shoulder-season festivals extend lodging and dining revenue.',
      'Protect small-scale massing along the water’s edge — height is a character decision.',
    ],
    creekStreetHook:
      'Propose a “working waterfront window” on Creek Street that shows a live trade — then check exterior scope in triage first.',
    pillars: ['CULTURE', 'BUSINESS', 'REVENUE'],
    tags: ['harbor', 'fishing', 'shoulder-season'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Seward,_Alaska',
        'Seward, Alaska (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Seward_Alaska.jpg/1280px-Seward_Alaska.jpg',
        'Seward under Resurrection Bay weather — tourism that still shares the harbor.',
        'Wikimedia Commons · via Wikipedia (Seward)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Seward,_Alaska',
        'Seward, Alaska (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Seward_Alaska_boat_harbor.jpg/1280px-Seward_Alaska_boat_harbor.jpg',
        'Small-boat harbor — the town’s real main street is floating.',
        'Wikimedia Commons · via Wikipedia (Seward)',
      ),
      photo(
        'https://www.nps.gov/kefj/index.htm',
        'Kenai Fjords National Park (NPS)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Exit_Glacier.jpg/1280px-Exit_Glacier.jpg',
        'Exit Glacier — the park draw that fills Seward’s beds and breakfasts.',
        'Wikimedia Commons · NPS Kenai Fjords context',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Alaska_Railroad',
        'Alaska Railroad (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Alaska_Railroad_Seward.jpg/1280px-Alaska_Railroad_Seward.jpg',
        'Railroad heritage still feeding the visitor itinerary.',
        'Wikimedia Commons · via Wikipedia (Alaska Railroad)',
      ),
      article(
        'https://www.nps.gov/kefj/index.htm',
        'Kenai Fjords National Park',
        'Gateway visitation patterns that shape Seward’s downtown economy.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'cordova-main-street',
    place: 'Cordova',
    region: 'Alaska',
    title: 'Cordova’s Main Street bet: local owners beat peak-day cosplay',
    hook: 'No road in. That’s not a branding slogan — it’s a filter that keeps ownership honest.',
    angle:
      'Cordova shows what happens when cultural programming and local storefront ownership matter more than maximizing gangway throughput.',
    scenes: [
      'Copper River salmon season is a calendar the whole town understands. Tourism rides that truth instead of inventing a pirate festival.',
      'Winter isn’t the off-season if arts nights and community dinners keep the lights on. Empty glass in January is a policy failure, not weather.',
    ],
    takeaways: [
      'Local ownership keeps character through tourism swings.',
      'Lead with living culture (salmon, arts) — not generic retail.',
      'Invest in winter programming before chasing another summer gimmick.',
    ],
    creekStreetHook:
      'Build a shoulder-season culture night on Creek Street with local owners first — invite cruise marketing second.',
    pillars: ['CULTURE', 'BUSINESS'],
    tags: ['main-street', 'local-ownership', 'winter'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Cordova,_Alaska',
        'Cordova, Alaska (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Cordova_Alaska.jpg/1280px-Cordova_Alaska.jpg',
        'Cordova from above — a coastal town that can’t fake a freeway exit.',
        'Wikimedia Commons · via Wikipedia (Cordova)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Cordova,_Alaska',
        'Cordova, Alaska (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Cordova_harbor.jpg/1280px-Cordova_harbor.jpg',
        'Harbor slips — economy you can smell at low tide.',
        'Wikimedia Commons · via Wikipedia (Cordova)',
      ),
      photo(
        'https://www.nps.gov/wrst/index.htm',
        'Wrangell–St. Elias (NPS)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Wrangell_St_Elias.jpg/1280px-Wrangell_St_Elias.jpg',
        'Regional wild hinterland that still shapes Cordova’s visitor story.',
        'Wikimedia Commons · NPS Wrangell–St. Elias context',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Copper_River_(Alaska)',
        'Copper River (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Copper_River_Alaska.jpg/1280px-Copper_River_Alaska.jpg',
        'Copper River country — the brand locals already live.',
        'Wikimedia Commons · via Wikipedia (Copper River)',
      ),
      article(
        'https://www.nps.gov/wrst/index.htm',
        'Wrangell–St. Elias National Park & Preserve',
        'Gateway context for Cordova’s remoteness-as-character economy.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'leadville-mining-main',
    place: 'Leadville Historic District',
    region: 'Colorado',
    title: 'Leadville sells thin air and true brick — not a theme-park mine',
    hook: 'At 10,000 feet, fake façades look even faker. Leadville never bothered.',
    angle:
      'High-country mining towns prove industrial heritage can sell lodging and tours without inventing Disney ore carts — and winter events stabilize the municipal receipts.',
    scenes: [
      'A walking tour that ends in a saloon with original tin ceilings does more economic development than a new fiberglass miner on the sidewalk.',
      'January lights and ski-adjacent weekends keep sales tax from hibernating. Culture is a revenue instrument.',
    ],
    takeaways: [
      'Honest materials beat theme-park cladding — visitors can tell.',
      'Guided tours monetize accuracy; misinformation is a race to the bottom.',
      'Winter events stabilize municipal sales-tax receipts.',
    ],
    creekStreetHook:
      'Price a licensed Creek Street storytelling walk that ends in a local shop — accurate NRHP facts only.',
    pillars: ['CULTURE', 'REVENUE'],
    tags: ['mining', 'tours', 'winter'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Leadville,_Colorado',
        'Leadville, Colorado (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Leadville_Colorado.jpg/1280px-Leadville_Colorado.jpg',
        'Leadville under big-sky weather — altitude as authenticity filter.',
        'Wikimedia Commons · via Wikipedia (Leadville)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Leadville,_Colorado',
        'Leadville, Colorado (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Leadville_Colorado_main_street.jpg/1280px-Leadville_Colorado_main_street.jpg',
        'Main Street corridor — brick that earned its soot.',
        'Wikimedia Commons · via Wikipedia (Leadville)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/National_Mining_Hall_of_Fame',
        'National Mining Hall of Fame (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/National_Mining_Museum_Leadville.jpg/1280px-National_Mining_Museum_Leadville.jpg',
        'Mining museum — interpretation that still funds downtown foot traffic.',
        'Wikimedia Commons · via Wikipedia (Mining Hall of Fame)',
      ),
      photo(
        'https://www.nps.gov/nr/travel/american_latino_heritage/leadville.htm',
        'Leadville — NPS travel',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Matchless_Mine_Leadville.jpg/1280px-Matchless_Mine_Leadville.jpg',
        'Matchless Mine — industrial heritage as destination, not décor.',
        'Wikimedia Commons · NPS Leadville context',
      ),
      article(
        'https://www.nps.gov/nr/travel/american_latino_heritage/leadville.htm',
        'Leadville — NPS travel',
        'Historic resources and tourism framing for a mining-era Main Street.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'galena-illinois',
    place: 'Galena Historic District',
    region: 'Illinois',
    title: 'Galena’s Main Street crush: charming until the parking lot becomes the plan',
    hook: 'Brick storefronts photograph like a dream. The alley behind them is where the town either lives or dies.',
    angle:
      'Galena is a Midwestern masterclass in tourism pressure: B&Bs, shopper weekends, and the quiet fight to keep residential fabric from becoming overflow retail.',
    scenes: [
      'Saturday afternoon feels like prosperity. Monday morning reveals whether residents still have a grocery and a dry cleaner within walking distance.',
      'Lodging spreads dollars past retail hours. Parking policy is either a revenue tool or a slow eviction notice for locals.',
    ],
    takeaways: [
      'Visitor parking strategy is livability infrastructure — price it like it matters.',
      'B&B lodging spreads benefit beyond shop hours.',
      'Protect the residential rim; commercial spill is how districts hollow out.',
    ],
    creekStreetHook:
      'Model an off-season parking + culture-night bundle that sends dollars to city lots and boardwalk programs.',
    pillars: ['BUSINESS', 'REVENUE'],
    tags: ['main-street', 'lodging', 'parking'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Galena,_Illinois',
        'Galena, Illinois (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Galena_Illinois.jpg/1280px-Galena_Illinois.jpg',
        'Galena’s hillside brick — tourism magnet with residential stakes.',
        'Wikimedia Commons · via Wikipedia (Galena)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Galena,_Illinois',
        'Galena, Illinois (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Galena_Illinois_Main_Street.jpg/1280px-Galena_Illinois_Main_Street.jpg',
        'Main Street commercial blocks under weekend pressure.',
        'Wikimedia Commons · via Wikipedia (Galena)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Ulysses_S._Grant_Home',
        'Grant Home (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Grant_Home_Galena.jpg/1280px-Grant_Home_Galena.jpg',
        'Grant Home — house-museum traffic that still feeds downtown lunch.',
        'Wikimedia Commons · via Wikipedia (Grant Home)',
      ),
      photo(
        'https://www.nps.gov/nr/travel/galena/index.htm',
        'Galena — NPS travel',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Galena_River.jpg/1280px-Galena_River.jpg',
        'River corridor that shaped the commercial grid.',
        'Wikimedia Commons · NPS Galena travel context',
      ),
      article(
        'https://www.nps.gov/nr/travel/galena/index.htm',
        'Galena — NPS travel itinerary',
        'Itinerary framing for one of the densest historic commercial streets in the Midwest.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'new-bedford-whaling',
    place: 'New Bedford Historic District',
    region: 'Massachusetts',
    title: 'New Bedford still fishes — that’s the whole thesis',
    hook: 'Cobblestones, customs house, and a working pier in the same camera frame. Most towns only manage two of the three.',
    angle:
      'A National Historical Park downtown that still lands catch — culture interpretation and working piers share space, with park partnerships that fund public storytelling capacity.',
    scenes: [
      'School groups exit the park visitor center and walk past ice and nets. The curriculum writes itself because the economy didn’t leave.',
      'Grant-funded interpretation staff are a municipal capacity hack: someone gets paid to tell the true story so Instagram doesn’t invent a worse one.',
    ],
    takeaways: [
      'Park partnerships can amplify local storytelling budgets.',
      'Keep working waterfront uses visible beside visitor retail.',
      'Grants + admissions can underwrite public interpretation staff.',
    ],
    creekStreetHook:
      'Package a Creek Street media/licensing pack for tour operators — accurate structure facts, paid, attributed.',
    pillars: ['CULTURE', 'REVENUE'],
    tags: ['whaling', 'nps', 'waterfront'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/New_Bedford,_Massachusetts',
        'New Bedford (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/New_Bedford_MA_Custom_House.jpg/1280px-New_Bedford_MA_Custom_House.jpg',
        'Custom House — federal brick still anchoring the waterfront district.',
        'Wikimedia Commons · via Wikipedia (New Bedford)',
      ),
      photo(
        'https://www.nps.gov/nebe/index.htm',
        'New Bedford Whaling NHP (NPS)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/New_Bedford_Whaling_Museum.jpg/1280px-New_Bedford_Whaling_Museum.jpg',
        'Whaling Museum — interpretation density that spills into downtown spend.',
        'Wikimedia Commons · NPS New Bedford context',
      ),
      photo(
        'https://en.wikipedia.org/wiki/New_Bedford_Whaling_National_Historical_Park',
        'New Bedford Whaling NHP (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/New_Bedford_harbor.jpg/1280px-New_Bedford_harbor.jpg',
        'Harbor working edge — fishing and heritage in the same tide.',
        'Wikimedia Commons · via Wikipedia (New Bedford NHP)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/New_Bedford,_Massachusetts',
        'New Bedford (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/New_Bedford_cobblestone.jpg/1280px-New_Bedford_cobblestone.jpg',
        'Cobblestone streets — material honesty underfoot.',
        'Wikimedia Commons · via Wikipedia (New Bedford)',
      ),
      article(
        'https://www.nps.gov/nebe/index.htm',
        'New Bedford Whaling National Historical Park',
        'Park partnership model for a downtown that still works the water.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'savannah-squares',
    place: 'Savannah Historic District',
    region: 'Georgia',
    title: 'Savannah’s squares are beautiful — and they are a management problem',
    hook: 'Live oaks make the postcard. Tour buses make the budget conversation.',
    angle:
      'Savannah is both inspiration and caution: world-famous historic tourism with hard lessons on carrying capacity, fees, and protecting the people who live behind the iron gates.',
    scenes: [
      'A square at sunrise belongs to joggers and dog walkers. By 11 a.m. it belongs to itineraries. Governance is deciding which hours get which rules.',
      'Carriage limits and walking-tour caps are preservation tools. So is the unsexy line item that keeps azaleas alive.',
    ],
    takeaways: [
      'Tour and bus rules protect sidewalk capacity — write them before resentment does.',
      'Public squares are infrastructure; budget for upkeep like you would a pier.',
      'Resident amenity hours matter as much as storefront polish.',
    ],
    creekStreetHook:
      'Define a boardwalk carrying-capacity rule of thumb for peak ship days — then publish it with the visit guide.',
    pillars: ['REVENUE', 'CULTURE'],
    tags: ['carrying-capacity', 'tours', 'public-realm'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Savannah_Historic_District',
        'Savannah Historic District (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Forsyth_Park_fountain_Savannah.jpg/1280px-Forsyth_Park_fountain_Savannah.jpg',
        'Forsyth Park fountain — public realm as brand and maintenance obligation.',
        'Wikimedia Commons · via Wikipedia (Savannah HD)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Savannah,_Georgia',
        'Savannah, Georgia (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Savannah_historic_district.jpg/1280px-Savannah_historic_district.jpg',
        'Oak-canopied streets — beauty that requires traffic rules.',
        'Wikimedia Commons · via Wikipedia (Savannah)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Savannah_Historic_District',
        'Savannah Historic District (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/River_Street_Savannah.jpg/1280px-River_Street_Savannah.jpg',
        'River Street — waterfront tourism pressure in cobblestone form.',
        'Wikimedia Commons · via Wikipedia (Savannah HD)',
      ),
      photo(
        'https://www.nps.gov/nr/travel/savannah/index.htm',
        'Savannah — NPS travel',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Cathedral_of_St_John_the_Baptist_Savannah.jpg/1280px-Cathedral_of_St_John_the_Baptist_Savannah.jpg',
        'Cathedral spires above the ward grid — landmarks that organize visitor flow.',
        'Wikimedia Commons · NPS Savannah travel context',
      ),
      article(
        'https://www.nps.gov/nr/travel/savannah/index.htm',
        'Savannah — NPS travel itinerary',
        'Itinerary framing for a high-pressure historic city.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'deadwood-gaming-balance',
    place: 'Deadwood Historic District',
    region: 'South Dakota',
    title: 'Deadwood’s awkward genius: a dedicated revenue hose aimed at brick',
    hook: 'Not every town should copy gaming. Every town should study what happens when preservation gets a named funding stream.',
    angle:
      'Deadwood tied a controversial revenue source to historic fabric repair — useful when talking municipal capacity, not when shopping for slot machines.',
    scenes: [
      'Main Street neon and Victorian cornices argue all night. The interesting part is the ordinance that sends money back into the buildings.',
      'Night economy needs lighting rules that respect contributing façades. Glow is not a preservation plan.',
    ],
    takeaways: [
      'Dedicated fees can fund preservation if legally ring-fenced and transparent.',
      'Authenticity still requires design review — money alone won’t save a bad façade decision.',
      'Night lighting rules belong in the same packet as operating hours.',
    ],
    creekStreetHook:
      'Propose a transparent “sponsor-a-structure” interpretation fund that never sells primary façade ads.',
    pillars: ['REVENUE', 'CULTURE'],
    tags: ['fees', 'preservation-funding', 'night-economy'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Deadwood,_South_Dakota',
        'Deadwood (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Deadwood_South_Dakota_main_street.jpg/1280px-Deadwood_South_Dakota_main_street.jpg',
        'Deadwood Main Street — night economy meeting Landmark fabric.',
        'Wikimedia Commons · via Wikipedia (Deadwood)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Deadwood,_South_Dakota',
        'Deadwood (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Deadwood_SD.jpg/1280px-Deadwood_SD.jpg',
        'Tight canyon Main Street — every sign decision is visible from everywhere.',
        'Wikimedia Commons · via Wikipedia (Deadwood)',
      ),
      photo(
        'https://www.nps.gov/nr/travel/deadwood/index.htm',
        'Deadwood — NPS travel',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Adams_House_Deadwood.jpg/1280px-Adams_House_Deadwood.jpg',
        'Adams House — house museum gravity inside a gaming downtown.',
        'Wikimedia Commons · NPS Deadwood context',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Mount_Moriah_Cemetery_(Deadwood,_South_Dakota)',
        'Mount Moriah Cemetery (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Mount_Moriah_Deadwood.jpg/1280px-Mount_Moriah_Deadwood.jpg',
        'Mount Moriah — myth and tourism walking the same hillside.',
        'Wikimedia Commons · via Wikipedia (Mount Moriah)',
      ),
      article(
        'https://www.nps.gov/nr/travel/deadwood/index.htm',
        'Deadwood — NPS travel',
        'Landmark district framing — study the funding tools, not only the myth.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'telluride-festival-town',
    place: 'Telluride Historic District',
    region: 'Colorado',
    title: 'Telluride’s box canyon runs on calendars as much as powder',
    hook: 'When the ski lifts slow, the film festival is not culture — it’s occupancy strategy with better lighting.',
    angle:
      'A compact mining-era town that uses festivals and film culture to fill beds when seasons soften — without rewriting the Victorian street wall into a resort cartoon.',
    scenes: [
      'Main Street fits in a camera phone and a zoning envelope. Temporary stages appear, then vanish. The cornices stay.',
      'Lodging taxes funding arts and street work is the virtuous loop: visitors pay for the ambiance they came to consume.',
    ],
    takeaways: [
      'A published culture calendar is economic development infrastructure.',
      'Temporary stages and banners need clear HD rules before the first sponsor asks.',
      'Lodging taxes can fund both arts and street maintenance — show the split.',
    ],
    creekStreetHook:
      'Publish a Creek Street shoulder-season culture calendar with one measurable lodging/dining goal attached.',
    pillars: ['BUSINESS', 'REVENUE', 'CULTURE'],
    tags: ['festivals', 'lodging-tax', 'shoulder-season'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Telluride,_Colorado',
        'Telluride (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Telluride_Colorado_main_street.jpg/1280px-Telluride_Colorado_main_street.jpg',
        'Main Street boxed by cliffs — every banner fights for the same sky.',
        'Wikimedia Commons · via Wikipedia (Telluride)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Telluride,_Colorado',
        'Telluride (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Telluride_Colorado.jpg/1280px-Telluride_Colorado.jpg',
        'Town form in the box canyon — density is the design review.',
        'Wikimedia Commons · via Wikipedia (Telluride)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Telluride_Film_Festival',
        'Telluride Film Festival (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Telluride_opera_house.jpg/1280px-Telluride_opera_house.jpg',
        'Opera house — culture venue that still punches above small-town weight.',
        'Wikimedia Commons · via Wikipedia (Telluride Film Festival)',
      ),
      photo(
        'https://www.nps.gov/nr/travel/colorado/telluride.htm',
        'Telluride — NPS / Colorado travel',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Bridal_Veil_Falls_Telluride.jpg/1280px-Bridal_Veil_Falls_Telluride.jpg',
        'Bridal Veil Falls — the landscape brand behind the festival calendar.',
        'Wikimedia Commons · NPS Telluride context',
      ),
      article(
        'https://www.nps.gov/nr/travel/colorado/telluride.htm',
        'Telluride — NPS travel',
        'Historic commercial core context for a festival town.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'annapolis-harbor',
    place: 'Annapolis Historic District',
    region: 'Maryland',
    title: 'Annapolis prices the harbor like it knows the harbor is the product',
    hook: 'Sails, brick, and a statehouse dome — and a dockmaster who can quote you a rate.',
    angle:
      'A colonial capital that still sails: harbor enterprise funds, maritime museums, and strict design review keep the waterfront productive and photogenic.',
    scenes: [
      'Day-trippers and overnight guests are different products. Annapolis prices them differently. Most small ports pretend they’re the same line at the ice cream shop.',
      'Brick rhythms are the brand guidelines. Design review is the brand manager with legal teeth.',
    ],
    takeaways: [
      'Harbor enterprise funds can support public docks and interpretation.',
      'Design review protects the brick rhythms that market the town.',
      'School groups and overnight guests need different fee products.',
    ],
    creekStreetHook:
      'Split Creek Street visitor products: free boardwalk story walk vs paid guided maker walk — different prices, same street.',
    pillars: ['REVENUE', 'CULTURE'],
    tags: ['harbor', 'fees', 'maritime'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Annapolis,_Maryland',
        'Annapolis (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Annapolis_Maryland_city_dock.jpg/1280px-Annapolis_Maryland_city_dock.jpg',
        'City Dock — the cash register and the postcard in one slip.',
        'Wikimedia Commons · via Wikipedia (Annapolis)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Annapolis,_Maryland',
        'Annapolis (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Maryland_State_House.jpg/1280px-Maryland_State_House.jpg',
        'Maryland State House — capital gravity feeding downtown commerce.',
        'Wikimedia Commons · via Wikipedia (Annapolis)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/United_States_Naval_Academy',
        'U.S. Naval Academy (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/US_Naval_Academy_campus.jpg/1280px-US_Naval_Academy_campus.jpg',
        'Naval Academy edge — institutional visitation as downtown fuel.',
        'Wikimedia Commons · via Wikipedia (Naval Academy)',
      ),
      photo(
        'https://www.nps.gov/nr/travel/annapolis/index.htm',
        'Annapolis — NPS travel',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Annapolis_historic_street.jpg/1280px-Annapolis_historic_street.jpg',
        'Colonial street wall — design review as brand enforcement.',
        'Wikimedia Commons · NPS Annapolis travel context',
      ),
      article(
        'https://www.nps.gov/nr/travel/annapolis/index.htm',
        'Annapolis — NPS travel itinerary',
        'Historic resources for a capital harbor under constant visitation.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'santa-fe-plaza',
    place: 'Santa Fe Historic District',
    region: 'New Mexico',
    title: 'Santa Fe Plaza: when the design language is the economy',
    hook: 'Adobe isn’t a paint color. It’s a rulebook people fly across the country to stand inside.',
    angle:
      'Strong design standards around adobe and portal forms — plus Indigenous and Hispanic market traditions — keep the plaza economically alive without turning it into a strip mall in earth tones.',
    scenes: [
      'Portal markets work when rules privilege makers with a real practice. The second anyone can sell airport trinkets under the same portal, the brand softens.',
      'Consistency is not boredom. Visitors pay for a place that refuses to look like everywhere else.',
    ],
    takeaways: [
      'A consistent design language is a tourism asset — defend it in review.',
      'Vendor markets need rules that privilege local makers.',
      'Interpretation should credit living cultures, not frozen myth.',
    ],
    creekStreetHook:
      'Write a one-page Creek Street “portal rule” for temporary vendors: who qualifies, where they stand, what they can’t hang on a façade.',
    pillars: ['CULTURE', 'BUSINESS'],
    tags: ['plaza', 'markets', 'design-standards'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Santa_Fe,_New_Mexico',
        'Santa Fe (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Santa_Fe_Plaza.jpg/1280px-Santa_Fe_Plaza.jpg',
        'Santa Fe Plaza — civic and market heart under strict design language.',
        'Wikimedia Commons · via Wikipedia (Santa Fe)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Santa_Fe,_New_Mexico',
        'Santa Fe (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Palace_of_the_Governors_Santa_Fe.jpg/1280px-Palace_of_the_Governors_Santa_Fe.jpg',
        'Palace of the Governors portal — market tradition with rules.',
        'Wikimedia Commons · via Wikipedia (Santa Fe)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Cathedral_Basilica_of_St._Francis_of_Assisi_(Santa_Fe)',
        'St. Francis Cathedral (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/St_Francis_Cathedral_Santa_Fe.jpg/1280px-St_Francis_Cathedral_Santa_Fe.jpg',
        'Cathedral — landmark gravity organizing plaza foot traffic.',
        'Wikimedia Commons · via Wikipedia (St. Francis Cathedral)',
      ),
      photo(
        'https://www.nps.gov/nr/travel/santafetraces/index.htm',
        'Santa Fe — NPS travel',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Santa_Fe_adobe.jpg/1280px-Santa_Fe_adobe.jpg',
        'Adobe street wall — design consistency as economic moat.',
        'Wikimedia Commons · NPS Santa Fe travel context',
      ),
      article(
        'https://www.nps.gov/nr/travel/santafetraces/index.htm',
        'Santa Fe — NPS travel',
        'Historic resources and plaza culture under design discipline.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'charleston-battery',
    place: 'Charleston Historic District',
    region: 'South Carolina',
    title: 'Charleston’s pretty streets are a governance flex',
    hook: 'Rainbow Row is the wallpaper. The interesting document is the tourism management ordinance.',
    angle:
      'A high-pressure historic city with mature review boards, carriage rules, and lodging taxes — study the governance tools, not only the postcard streets.',
    scenes: [
      'Guides know which corners get jammed at 2 p.m. That’s carrying capacity with a human face.',
      'Lodging and tour fees funding sidewalks and drainage is unromantic — and it’s why the romance survives.',
    ],
    takeaways: [
      'Tourism management ordinances are preservation tools.',
      'Lodging and tour fees can fund sidewalk and drainage repair — show the ledger.',
      'Resident amenity hours protect the district after peak visitation.',
    ],
    creekStreetHook:
      'List three Creek Street peak-hour friction points and assign each a fee, a rule, or a design fix — not a shrug.',
    pillars: ['REVENUE', 'CULTURE'],
    tags: ['tourism-management', 'lodging-tax', 'governance'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Charleston,_South_Carolina',
        'Charleston (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Rainbow_Row_Charleston.jpg/1280px-Rainbow_Row_Charleston.jpg',
        'Rainbow Row — contributing street wall as global brand.',
        'Wikimedia Commons · via Wikipedia (Charleston)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Charleston,_South_Carolina',
        'Charleston (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Charleston_Battery.jpg/1280px-Charleston_Battery.jpg',
        'The Battery — public edge under constant visitor pressure.',
        'Wikimedia Commons · via Wikipedia (Charleston)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Historic_Charleston_Foundation',
        'Historic Charleston Foundation (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Charleston_single_house.jpg/1280px-Charleston_single_house.jpg',
        'Single house form — design typology enforced by culture and code.',
        'Wikimedia Commons · Historic Charleston context',
      ),
      photo(
        'https://www.nps.gov/nr/travel/charleston/index.htm',
        'Charleston — NPS travel',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Charleston_market.jpg/1280px-Charleston_market.jpg',
        'Market buildings — commerce layered into the historic core.',
        'Wikimedia Commons · NPS Charleston travel context',
      ),
      article(
        'https://www.nps.gov/nr/travel/charleston/index.htm',
        'Charleston — NPS travel itinerary',
        'High-pressure historic city resources and visitor framing.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'newport-ri-waterfront',
    place: 'Newport Historic District',
    region: 'Rhode Island',
    title: 'Newport stacks tickets: mansions, masts, and downtown dinner',
    hook: 'One itinerary can burn a mansion admission, a sailing photo, and a clam cake before sunset — by design.',
    angle:
      'Layered visitor products — house museums, sailing culture, downtown retail — reduce dependence on a single souvenir peak and keep the harbor reading as itself.',
    scenes: [
      'Free waterfront walks are the loss leader. Paid house museums and beds are the margin. Creek Street already has free walk quality — it needs the paid layers that don’t wreck façades.',
      'When the America’s Cup circus leaves, the colonial streets still have to work for whoever lives there in February.',
    ],
    takeaways: [
      'Multiple ticket products reduce dependence on a single retail peak.',
      'House museums need compatible adjacent food and lodging.',
      'Waterfront walks are free public goods that still drive paid stays.',
    ],
    creekStreetHook:
      'Pair the free /visit QR story walk with one paid small-group maker walk that ends in local shops.',
    pillars: ['BUSINESS', 'REVENUE', 'CULTURE'],
    tags: ['museums', 'waterfront', 'tickets'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Newport,_Rhode_Island',
        'Newport (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Newport_Rhode_Island_harbor.jpg/1280px-Newport_Rhode_Island_harbor.jpg',
        'Harbor masts — sailing culture as downtown fuel.',
        'Wikimedia Commons · via Wikipedia (Newport)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/The_Breakers_(mansion)',
        'The Breakers (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/The_Breakers_Newport.jpg/1280px-The_Breakers_Newport.jpg',
        'The Breakers — ticketed house museum gravity.',
        'Wikimedia Commons · via Wikipedia (The Breakers)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Newport,_Rhode_Island',
        'Newport (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Thames_Street_Newport.jpg/1280px-Thames_Street_Newport.jpg',
        'Thames Street commercial grain — visitor spend between mansion and mast.',
        'Wikimedia Commons · via Wikipedia (Newport)',
      ),
      photo(
        'https://www.nps.gov/nr/travel/newport/index.htm',
        'Newport — NPS travel',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Newport_colony_house.jpg/1280px-Newport_colony_house.jpg',
        'Colony House — colonial civic landmarks still organizing the walk.',
        'Wikimedia Commons · NPS Newport travel context',
      ),
      article(
        'https://www.nps.gov/nr/travel/newport/index.htm',
        'Newport — NPS travel itinerary',
        'Layered historic products in a sailing capital.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'key-west-duval',
    place: 'Key West Historic District',
    region: 'Florida',
    title: 'Key West is a warning wrapped in sunset colors',
    hook: 'Duval Street can teach Creek Street more about capacity than about cocktails.',
    angle:
      'An extreme tourism case on a constrained island — temporary signage, cottage fabric, and housing pressure all show what happens when the brand eats the neighborhood.',
    scenes: [
      'Sandwich boards multiply like mangroves. Then someone notices you can’t see the contributing porch for the specials.',
      'If workers can’t live near the district, the district becomes a stage set with rotating cast and no understudy.',
    ],
    takeaways: [
      'Capacity limits protect the asset that markets the town.',
      'Temporary A-frames need hard rules — charm dies in clutter.',
      'Local housing pressure is a preservation issue, not only a social one.',
    ],
    creekStreetHook:
      'Cap temporary sidewalk signs on Creek Street before peak season — and say so publicly.',
    pillars: ['CULTURE', 'REVENUE'],
    tags: ['carrying-capacity', 'signage', 'housing'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Key_West,_Florida',
        'Key West (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Duval_Street_Key_West.jpg/1280px-Duval_Street_Key_West.jpg',
        'Duval Street — high-pressure commercial spine.',
        'Wikimedia Commons · via Wikipedia (Key West)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Key_West,_Florida',
        'Key West (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Key_West_porch.jpg/1280px-Key_West_porch.jpg',
        'Contributing porch fabric — easy to hide behind temporary clutter.',
        'Wikimedia Commons · via Wikipedia (Key West)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Southernmost_point_buoy',
        'Southernmost point buoy (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Southernmost_point_Key_West.jpg/1280px-Southernmost_point_Key_West.jpg',
        'Southernmost point — tourism ritual that compresses the island’s edges.',
        'Wikimedia Commons · via Wikipedia (Southernmost point)',
      ),
      photo(
        'https://www.nps.gov/drto/index.htm',
        'Dry Tortugas / Keys region (NPS)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Fort_Jefferson.jpg/1280px-Fort_Jefferson.jpg',
        'Fort Jefferson — regional NPS draw shaping Keys visitation patterns.',
        'Wikimedia Commons · NPS Dry Tortugas context',
      ),
      article(
        'https://www.nps.gov/drto/index.htm',
        'Dry Tortugas National Park',
        'Regional visitation context for an island under tourism compression.',
        'National Park Service',
      ),
    ],
  },
  {
    id: 'victoria-bastion-square',
    place: 'Old Town Victoria / Bastion Square',
    region: 'British Columbia',
    title: 'Victoria’s Inner Harbour: a rainy port cousin worth stealing from',
    hook: 'Same Pacific drizzle, same cruise schedules — different willingness to treat heritage as downtown infrastructure.',
    angle:
      'Victoria pairs tourism, cruise, and heritage conservation-area tools in a climate Creek Street recognizes — including canopies, BIAs, and foodways that aren’t generic pier nachos.',
    scenes: [
      'Covered walks earn their keep in sideways rain. Design-review templates for canopies beat ad-hoc plastic tarps every season.',
      'Cross-border itineraries reward regional taste. Smoked fish and proper coffee outsell another wall of T-shirts.',
    ],
    takeaways: [
      'Heritage conservation areas can pair with business improvement districts.',
      'Covered walks and canopies need design-review templates.',
      'Regional foodways beat generic pier retail on repeat visits.',
    ],
    creekStreetHook:
      'Draft a Creek Street canopy/awning template sheet from approved precedents and hand it to the next restaurant applicant.',
    pillars: ['BUSINESS', 'CULTURE'],
    tags: ['canada', 'cruise', 'canopies'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Victoria,_British_Columbia',
        'Victoria, B.C. (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Victoria_BC_Inner_Harbour.jpg/1280px-Victoria_BC_Inner_Harbour.jpg',
        'Inner Harbour — tourism and heritage sharing the seawall.',
        'Wikimedia Commons · via Wikipedia (Victoria)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/British_Columbia_Parliament_Buildings',
        'B.C. Parliament Buildings (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/BC_Parliament_Buildings.jpg/1280px-BC_Parliament_Buildings.jpg',
        'Parliament Buildings — civic landmark gravity on the harbour edge.',
        'Wikimedia Commons · via Wikipedia (B.C. Parliament)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Fairmont_Empress',
        'Fairmont Empress (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Empress_Hotel_Victoria.jpg/1280px-Empress_Hotel_Victoria.jpg',
        'Empress Hotel — hospitality landmark that still organizes the waterfront walk.',
        'Wikimedia Commons · via Wikipedia (Empress)',
      ),
      photo(
        'https://www.heritagebc.ca/',
        'Heritage BC',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Bastion_Square_Victoria.jpg/1280px-Bastion_Square_Victoria.jpg',
        'Bastion Square — Old Town public room under conservation practice.',
        'Wikimedia Commons · Heritage BC / Victoria context',
      ),
      article(
        'https://www.heritagebc.ca/',
        'Heritage BC',
        'Provincial heritage practice for conservation areas and Main Streets.',
        'Heritage BC',
      ),
    ],
  },
  {
    id: 'ketchikan-region-peers',
    place: 'Southeast Alaska peer towns',
    region: 'Alaska',
    title: 'Southeast Alaska: same ships, different sidewalk rules — compare notes',
    hook: 'The vessels are identical. The sandwich-board ordinances are not. That’s the opportunity.',
    angle:
      'A comparative lens across SE Alaska ports — what Creek Street can borrow when neighbors share a cruise calendar but run different design-review cultures.',
    scenes: [
      'One town bans A-frames; another looks like a paper forest. Visitors notice. So do insurers and photographers.',
      'Shared apprenticeship for historic wood repair is regional economic development disguised as culture.',
    ],
    takeaways: [
      'Compare temporary-use and sandwich-board rules across SE ports — steal the clearest one.',
      'Share apprenticeship models for historic wood and paint repair.',
      'Regional storytelling licenses can fund accurate media packs.',
    ],
    creekStreetHook:
      'Call two SE Alaska peer planners this month and swap temporary-sign rules — then publish Creek Street’s clearer version.',
    pillars: ['CULTURE', 'BUSINESS', 'REVENUE'],
    tags: ['southeast', 'cruise', 'regional'],
    embeds: [
      photo(
        'https://en.wikipedia.org/wiki/Ketchikan,_Alaska',
        'Ketchikan (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ketchikan_Alaska_waterfront.jpg/1280px-Ketchikan_Alaska_waterfront.jpg',
        'Ketchikan waterfront — home context for Creek Street’s peer comparisons.',
        'Wikimedia Commons · via Wikipedia (Ketchikan)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Creek_Street_(Ketchikan,_Alaska)',
        'Creek Street (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Creek_Street_Ketchikan.jpg/1280px-Creek_Street_Ketchikan.jpg',
        'Creek Street boardwalk — the street these case studies are for.',
        'Wikimedia Commons · via Wikipedia (Creek Street)',
      ),
      photo(
        'https://en.wikipedia.org/wiki/Ketchikan,_Alaska',
        'Ketchikan (Wikipedia)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Ketchikan_Creek.jpg/1280px-Ketchikan_Creek.jpg',
        'Ketchikan Creek — the reason the boardwalk exists at all.',
        'Wikimedia Commons · via Wikipedia (Ketchikan)',
      ),
      photo(
        'https://www.nps.gov/klse/index.htm',
        'Klondike Gold Rush — Seattle unit (NPS)',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Pioneer_Square_Seattle.jpg/1280px-Pioneer_Square_Seattle.jpg',
        'Pioneer Square / gold-rush corridor — shared regional story architecture.',
        'Wikimedia Commons · NPS Klondike Seattle context',
      ),
      article(
        'https://www.nps.gov/klse/index.htm',
        'Klondike Gold Rush NHP — Seattle unit',
        'Regional gold-rush corridor interpretation SE towns still share.',
        'National Park Service',
      ),
    ],
  },
];
