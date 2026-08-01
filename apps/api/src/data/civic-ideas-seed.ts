/**
 * Curated civic ideation prompts for Creek Street / Ketchikan Gateway Borough.
 * Independent brainstorming aids — not borough policy or official filings.
 */

export type IdeaPillar = 'CULTURE' | 'BUSINESS' | 'REVENUE';

export type CivicIdea = {
  id: string;
  pillar: IdeaPillar;
  title: string;
  summary: string;
  whyItFits: string;
  nextStep: string;
  tags: string[];
  links?: Array<{ label: string; href: string }>;
};

export const civicIdeas: CivicIdea[] = [
  // Culture
  {
    id: 'cul_boardwalk_story_walk',
    pillar: 'CULTURE',
    title: 'Boardwalk story walk with QR dossiers',
    summary:
      'Pair each contributing structure with a short oral-history stop — QR codes open the public visit pages already mirrored in this hub.',
    whyItFits:
      'Turns NRHP inventory into a living street experience without altering façades or inventing private records.',
    nextStep: 'Pilot 5 contributing buildings on /visit and print weatherproof QR plaques.',
    tags: ['tourism', 'heritage', 'qr', 'walkable'],
    links: [
      { label: 'Visit guide', href: '/visit' },
      { label: 'Structures', href: '/structures' },
    ],
  },
  {
    id: 'cul_seasonal_culture_calendar',
    pillar: 'CULTURE',
    title: 'Shoulder-season culture calendar',
    summary:
      'Program Native arts, fishing heritage, and pioneer craft nights in April–May and September–October when cruise density is lower.',
    whyItFits:
      'Protects cultural depth from peak-day crowding and gives locals ownership of the narrative.',
    nextStep: 'Coordinate with tribal partners and local museums; publish a single public calendar feed.',
    tags: ['shoulder-season', 'arts', 'community'],
  },
  {
    id: 'cul_materials_apprenticeship',
    pillar: 'CULTURE',
    title: 'Historic materials apprenticeship',
    summary:
      'Train carpenters and sign-makers in wood, paint, and hardware approaches the Design Review Board already rewards.',
    whyItFits:
      'Culture is preserved in craft skill, not only in plaques — and applicants get clearer “how” not just “don’t.”',
    nextStep: 'Link apprenticeships to MATERIAL_HONESTY teaching pages and approved exemplars.',
    tags: ['crafts', 'workforce', 'materials'],
    links: [
      { label: 'Material honesty', href: '/guidance/criteria/MATERIAL_HONESTY' },
      { label: 'Precedents', href: '/precedents' },
    ],
  },
  {
    id: 'cul_photo_archive_drive',
    pillar: 'CULTURE',
    title: 'Neighbor photo archive drive',
    summary:
      'Invite families to contribute historic and contemporary photos of Creek Street structures under moderated public credit.',
    whyItFits:
      'Builds a living archive that strengthens designation narratives and visitor storytelling.',
    nextStep: 'Run a weekend intake at Dolly’s House / boardwalk with the /photos submit flow.',
    tags: ['archive', 'photos', 'community'],
    links: [{ label: 'Submit photos', href: '/photos' }],
  },
  {
    id: 'cul_language_on_the_boardwalk',
    pillar: 'CULTURE',
    title: 'Bilingual boardwalk interpretation',
    summary:
      'Add Tlingit / English interpretation at key stops — place names, fish-camp history, and boardwalk commerce eras.',
    whyItFits:
      'Centers Indigenous continuity alongside pioneer vernacular without rewriting the built fabric.',
    nextStep: 'Partner with culture bearers on wording; keep design review for any physical signs.',
    tags: ['language', 'indigenous', 'interpretation'],
  },
  {
    id: 'cul_night_lantern_walk',
    pillar: 'CULTURE',
    title: 'Winter lantern heritage walk',
    summary:
      'Low-impact evening walks with temporary lighting and storytelling — no permanent façade changes.',
    whyItFits:
      'Creates off-season cultural presence while respecting HD materials and massing rules.',
    nextStep: 'Draft a temporary-use checklist via triage for lighting/signage before winter pilot.',
    tags: ['winter', 'events', 'lighting'],
    links: [{ label: 'Triage', href: '/triage' }],
  },

  // Business
  {
    id: 'biz_maker_micro_leases',
    pillar: 'BUSINESS',
    title: 'Maker micro-leases on the boardwalk',
    summary:
      'Short-term booths for woodworkers, jewelry, and smoked-seafood makers in underused storefront frontage.',
    whyItFits:
      'Keeps commerce authentic to the district’s craft identity instead of generic souvenir volume.',
    nextStep: 'Map vacant or partial frontages on the district map; publish a simple lease packet.',
    tags: ['retail', 'makers', 'leases'],
    links: [{ label: 'District map', href: '/map' }],
  },
  {
    id: 'biz_shoulder_dining_popups',
    pillar: 'BUSINESS',
    title: 'Shoulder-season dining pop-ups',
    summary:
      'Local chefs and seafood processors host limited-run dinners when cruise volume drops — outdoor canopies only if design-review clear.',
    whyItFits:
      'Extends revenue beyond peak days and showcases regional foodways tied to the creek.',
    nextStep: 'Run permit/triage checks for canopies and outdoor seating before marketing dates.',
    tags: ['food', 'shoulder-season', 'pop-up'],
    links: [
      { label: 'Permits', href: '/permits' },
      { label: 'Build window', href: '/construction' },
    ],
  },
  {
    id: 'biz_design_ready_storefront_kit',
    pillar: 'BUSINESS',
    title: 'Design-ready storefront kit',
    summary:
      'Pre-vetted sign, awning, and paint packages that already match approved precedents — faster openings for new tenants.',
    whyItFits:
      'Lowers filing friction while protecting material honesty and boardwalk character.',
    nextStep: 'Bundle approved exemplars into a tenant packet with a filing pathway template.',
    tags: ['storefront', 'signage', 'tenant'],
    links: [
      { label: 'Filing pathway', href: '/filing' },
      { label: 'Compare precedents', href: '/precedents/compare' },
    ],
  },
  {
    id: 'biz_co_work_heritage_loft',
    pillar: 'BUSINESS',
    title: 'Heritage loft co-work (interior first)',
    summary:
      'Quiet co-work desks for remote workers and seasonal entrepreneurs inside contributing buildings — exterior change minimized.',
    whyItFits:
      'Diversifies daytime economy beyond cruise retail without pushing massing or false-historic cladding.',
    nextStep: 'Confirm occupancy/use with Zoning Administrator; keep exterior alterations out of scope initially.',
    tags: ['cowork', 'year-round', 'interior'],
  },
  {
    id: 'biz_guided_commerce_walks',
    pillar: 'BUSINESS',
    title: 'Guided commerce + culture walks',
    summary:
      'Ticketed small-group walks that end in maker shops — guides trained on NRHP facts from public dossiers.',
    whyItFits:
      'Monetizes storytelling while sending visitors into local businesses with accurate history.',
    nextStep: 'License guides against public structure sheets; keep groups small for boardwalk capacity.',
    tags: ['tours', 'tickets', 'retail'],
    links: [{ label: 'Structure dossiers', href: '/structures' }],
  },
  {
    id: 'biz_marine_repair_showcase',
    pillar: 'BUSINESS',
    title: 'Working waterfront showcase window',
    summary:
      'A small interpretive + retail window for marine trades, net-mending demos, and boatbuilding culture.',
    whyItFits:
      'Connects Creek Street’s over-water identity to living industries, not only nostalgia retail.',
    nextStep: 'Find a non-contributing or adaptable storefront; run exterior triage early.',
    tags: ['marine', 'trades', 'interpretation'],
  },

  // Revenue (city / borough)
  {
    id: 'rev_shoulder_event_permits',
    pillar: 'REVENUE',
    title: 'Shoulder-season event permit package',
    summary:
      'Bundle temporary-use, sign, and special-event fees into a predictable package priced for April–May / Sept–Oct.',
    whyItFits:
      'Creates municipal fee revenue while steering activity into lower-impact months.',
    nextStep: 'Publish a one-page fee schedule and link applicants to /construction for file-by timing.',
    tags: ['fees', 'events', 'shoulder-season'],
    links: [{ label: 'Build window', href: '/construction' }],
  },
  {
    id: 'rev_premium_story_licensing',
    pillar: 'REVENUE',
    title: 'Licensed storytelling assets for operators',
    summary:
      'Offer cruise/tour companies a paid, accurate media pack (structure facts, maps, photo credits) instead of ad-hoc scrapes.',
    whyItFits:
      'Turns public-domain heritage accuracy into a service revenue line while reducing misinformation.',
    nextStep: 'Package open-data exports + reviewed narratives with a simple license invoice.',
    tags: ['licensing', 'tourism', 'open-data'],
    links: [{ label: 'Open data', href: '/opendata' }],
  },
  {
    id: 'rev_design_review_completeness_fee',
    pillar: 'REVENUE',
    title: 'Completeness coaching surcharge (optional)',
    summary:
      'Optional paid pre-application completeness review that uses the public filing pathway checklist — refundable against filing fees if adopted.',
    whyItFits:
      'Funds staff time, improves packet quality, and reduces failed-quorum / continued cases.',
    nextStep: 'Pilot with applicants who finish /filing and want a staff walkthrough before official submittal.',
    tags: ['fees', 'staff', 'filing'],
    links: [{ label: 'Filing pathway', href: '/filing' }],
  },
  {
    id: 'rev_sponsor_a_structure',
    pillar: 'REVENUE',
    title: 'Sponsor-a-structure interpretation fund',
    summary:
      'Local businesses underwrite QR plaques and maintenance for contributing buildings with tasteful, code-compliant recognition.',
    whyItFits:
      'Philanthropic + sponsorship revenue that funds culture without selling façade advertising.',
    nextStep: 'Define sponsorship rules so recognition stays off primary façades if design review requires it.',
    tags: ['sponsorship', 'plaques', 'maintenance'],
  },
  {
    id: 'rev_data_dashboard_subscription',
    pillar: 'REVENUE',
    title: 'Civic mirror ops subscription for agencies',
    summary:
      'Sell a low-cost annual subscription to neighboring jurisdictions for the mirrored docket/meeting tooling pattern (not private records).',
    whyItFits:
      'Products the independent hub’s ops stack into a transferable service while Creek Street stays the showcase.',
    nextStep: 'Document readiness + compliance posture; offer a pilot to one partner borough/city.',
    tags: ['saas', 'intergov', 'ops'],
    links: [{ label: 'Compliance', href: '/compliance' }],
  },
  {
    id: 'rev_offseason_parking_culture_nights',
    pillar: 'REVENUE',
    title: 'Off-season parking + culture night bundle',
    summary:
      'Pair evening culture events with parking validation or paid lots — revenue shares between city lots and program costs.',
    whyItFits:
      'Captures municipal parking revenue when cruise buses are gone and locals return downtown.',
    nextStep: 'Align event nights with parking enterprise funds; publish a transparent split.',
    tags: ['parking', 'events', 'municipal'],
  },
];

export const ideaPillars: Array<{
  key: IdeaPillar;
  label: string;
  blurb: string;
}> = [
  {
    key: 'CULTURE',
    label: 'Preserve culture',
    blurb: 'Heritage craft, Indigenous continuity, and boardwalk memory — without fake façades.',
  },
  {
    key: 'BUSINESS',
    label: 'Build business',
    blurb: 'Maker commerce, shoulder-season dining, and design-ready storefronts that fit HD review.',
  },
  {
    key: 'REVENUE',
    label: 'Drive public revenue',
    blurb: 'Fees, licensing, sponsorship, and services that fund City and Borough capacity.',
  },
];
