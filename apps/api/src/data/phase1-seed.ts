/**
 * Phase 1 decision-support data.
 * Triage cites verified KGBC sections. Permit triggers are data rows —
 * only those with verifiedAt are treated as publishable by default.
 */

export type TriageOutcomeKind = 'REVIEW_REQUIRED' | 'NOT_REQUIRED' | 'CONFIRM_WITH_ZA';

export type TriageNode =
  | {
      id: string;
      kind: 'question';
      prompt: string;
      help?: string;
      options: { id: string; label: string; next: string }[];
    }
  | {
      id: string;
      kind: 'outcome';
      outcome: TriageOutcomeKind;
      summary: string;
      codeCites: string[];
      criteria: string[];
      exhibits: string[];
      note: string;
    };

export type TriageFlowSeed = {
  id: string;
  projectType: string;
  version: number;
  isPublished: boolean;
  reviewedBy: string;
  reviewedAt: string;
  entryNodeId: string;
  tree: TriageNode[];
};

const ZA =
  'Confirm with the Ketchikan Gateway Borough Zoning Administrator before relying on this for a filing. This tool states what the code says; it is not a legal conclusion.';

const COMMON_EXHIBITS = [
  'Site plan / boardwalk context photo',
  'Existing elevations (photos acceptable)',
  'Proposed elevations or annotated drawings',
  'Materials and color schedule',
  'Narrative addressing KGBC 18.40.010(b)(13) criteria',
];

function exteriorOutcome(id: string, projectLabel: string): TriageNode {
  return {
    id,
    kind: 'outcome',
    outcome: 'REVIEW_REQUIRED',
    summary: `Exterior ${projectLabel} in the HD zone is the kind of work the Architectural Design Review Board evaluates under borough code. An application for a certificate of approval is typically required.`,
    codeCites: ['KGBC 18.40.010(b)(13)', 'KGBC 18.90.020'],
    criteria: ['UNIFORMITY', 'DISSIMILARITY', 'APPROPRIATENESS', 'DESIGN_QUALITY', 'MATERIAL_HONESTY'],
    exhibits: COMMON_EXHIBITS,
    note: ZA,
  };
}

function confirmOutcome(id: string, reason: string, cites: string[]): TriageNode {
  return {
    id,
    kind: 'outcome',
    outcome: 'CONFIRM_WITH_ZA',
    summary: reason,
    codeCites: cites,
    criteria: [],
    exhibits: ['Contact Zoning Administrator for required exhibits'],
    note: ZA,
  };
}

function notRequiredOutcome(id: string, reason: string, cites: string[]): TriageNode {
  return {
    id,
    kind: 'outcome',
    outcome: 'NOT_REQUIRED',
    summary: reason,
    codeCites: cites,
    criteria: [],
    exhibits: [],
    note: ZA,
  };
}

/** Shared branching used across project-type flows. */
function visibilityBranch(prefix: string, projectLabel: string): TriageNode[] {
  return [
    {
      id: `${prefix}_visible`,
      kind: 'question',
      prompt: 'Will any of the work change the exterior appearance as seen from the Creek Street boardwalk, Totem Way, or Stedman Street approaches?',
      help: 'The HD zone purpose statement focuses on exterior appearance of buildings in the district.',
      options: [
        { id: 'yes', label: 'Yes — exterior appearance will change', next: `${prefix}_review` },
        { id: 'no', label: 'No — fully interior / not visible', next: `${prefix}_interior` },
        { id: 'unsure', label: 'Not sure', next: `${prefix}_confirm_visibility` },
      ],
    },
    exteriorOutcome(`${prefix}_review`, projectLabel),
    notRequiredOutcome(
      `${prefix}_interior`,
      `If the work does not affect exterior appearance in the HD zone, design review under KGBC 18.40.010(b)(13) / 18.90.020 generally does not apply. Other permits (building, fire, habitat, etc.) may still apply.`,
      ['KGBC 18.40.010(b)(13)', 'KGBC 18.90.020'],
    ),
    confirmOutcome(
      `${prefix}_confirm_visibility`,
      'Visibility from the boardwalk and whether the change counts as an exterior appearance alteration should be confirmed with the Zoning Administrator.',
      ['KGBC 18.40.010(b)(13)', 'KGBC 18.90.020'],
    ),
  ];
}

export const triageFlows: TriageFlowSeed[] = [
  {
    id: 'triage_exterior_v1',
    projectType: 'EXTERIOR_ALTERATION',
    version: 1,
    isPublished: true,
    reviewedBy: 'Phase 1 seed — cites verified against ketchikangateway.borough.codes',
    reviewedAt: '2026-07-29T00:00:00.000Z',
    entryNodeId: 'ext_start',
    tree: [
      {
        id: 'ext_start',
        kind: 'question',
        prompt: 'Is the property inside the Creek Street Historic District (HD zone)?',
        options: [
          { id: 'yes', label: 'Yes, in the HD zone', next: 'ext_visible' },
          { id: 'no', label: 'No / outside the district', next: 'ext_outside' },
          { id: 'unsure', label: 'Not sure', next: 'ext_confirm_zone' },
        ],
      },
      notRequiredOutcome(
        'ext_outside',
        'HD zone design review applies inside the Creek Street Historic District. Outside the zone, this board’s review does not apply — other zoning and building rules may.',
        ['KGBC 18.40.010(b)(13)'],
      ),
      confirmOutcome(
        'ext_confirm_zone',
        'Confirm HD zone status with the Zoning Administrator or borough zoning map before filing.',
        ['KGBC 18.40.010(b)(13)', 'KGBC 18.40.030'],
      ),
      ...visibilityBranch('ext', 'alteration'),
    ],
  },
  {
    id: 'triage_signage_v1',
    projectType: 'SIGNAGE',
    version: 1,
    isPublished: true,
    reviewedBy: 'Phase 1 seed — cites verified against ketchikangateway.borough.codes',
    reviewedAt: '2026-07-29T00:00:00.000Z',
    entryNodeId: 'sign_start',
    tree: [
      {
        id: 'sign_start',
        kind: 'question',
        prompt: 'Is the sign on a building or site inside the Creek Street HD zone?',
        options: [
          { id: 'yes', label: 'Yes', next: 'sign_new' },
          { id: 'no', label: 'No', next: 'sign_outside' },
          { id: 'unsure', label: 'Not sure', next: 'sign_confirm_zone' },
        ],
      },
      notRequiredOutcome(
        'sign_outside',
        'HD design review for signage applies in the Creek Street Historic District. Outside the district, other sign rules may apply.',
        ['KGBC 18.40.010(b)(13)', 'KGBC 18.90.020'],
      ),
      confirmOutcome('sign_confirm_zone', 'Confirm whether the site is in the HD zone with the Zoning Administrator.', [
        'KGBC 18.40.010(b)(13)',
      ]),
      {
        id: 'sign_new',
        kind: 'question',
        prompt: 'Is this a new sign, a face change, illumination change, or a relocation — or only routine maintenance of an existing approved sign (same size, materials, copy area)?',
        options: [
          { id: 'change', label: 'New / changed / relocated / illuminated differently', next: 'sign_review' },
          { id: 'maint', label: 'In-kind maintenance only', next: 'sign_maint' },
          { id: 'unsure', label: 'Not sure', next: 'sign_confirm' },
        ],
      },
      exteriorOutcome('sign_review', 'signage'),
      confirmOutcome(
        'sign_maint',
        'Pure in-kind maintenance of an existing approved sign may not need a new design-review pass — but copy, size, material, or lighting changes usually do. Confirm with the Zoning Administrator.',
        ['KGBC 18.40.010(b)(13)', 'KGBC 18.90.020'],
      ),
      confirmOutcome('sign_confirm', 'Sign applicability should be confirmed with the Zoning Administrator.', [
        'KGBC 18.90.020',
      ]),
    ],
  },
  {
    id: 'triage_new_v1',
    projectType: 'NEW_CONSTRUCTION',
    version: 1,
    isPublished: true,
    reviewedBy: 'Phase 1 seed — cites verified against ketchikangateway.borough.codes',
    reviewedAt: '2026-07-29T00:00:00.000Z',
    entryNodeId: 'new_start',
    tree: [
      {
        id: 'new_start',
        kind: 'question',
        prompt: 'Is the new building or addition inside the Creek Street HD zone?',
        options: [
          { id: 'yes', label: 'Yes', next: 'new_review' },
          { id: 'no', label: 'No', next: 'new_outside' },
          { id: 'unsure', label: 'Not sure', next: 'new_confirm' },
        ],
      },
      exteriorOutcome('new_review', 'new construction'),
      notRequiredOutcome(
        'new_outside',
        'HD zone design review applies to exterior development inside the district. Outside the zone, other approvals still may apply.',
        ['KGBC 18.40.010(b)(13)'],
      ),
      confirmOutcome('new_confirm', 'Confirm HD zone status and application path with the Zoning Administrator.', [
        'KGBC 18.40.010(b)(13)',
        'KGBC 18.90.020',
      ]),
    ],
  },
  {
    id: 'triage_paint_v1',
    projectType: 'PAINT_MATERIALS',
    version: 1,
    isPublished: true,
    reviewedBy: 'Phase 1 seed — cites verified against ketchikangateway.borough.codes',
    reviewedAt: '2026-07-29T00:00:00.000Z',
    entryNodeId: 'paint_start',
    tree: [
      {
        id: 'paint_start',
        kind: 'question',
        prompt: 'Are you changing exterior paint, cladding, roofing, windows, or other finish materials visible from the boardwalk?',
        options: [
          { id: 'yes', label: 'Yes — visible exterior materials/colors', next: 'paint_review' },
          { id: 'touchup', label: 'Same color touch-up / repair in kind', next: 'paint_confirm' },
          { id: 'no', label: 'Interior only', next: 'paint_interior' },
        ],
      },
      exteriorOutcome('paint_review', 'paint / materials change'),
      confirmOutcome(
        'paint_confirm',
        'In-kind repairs sometimes fall outside a new design-review cycle, but material honesty and color changes are common review topics. Confirm with the Zoning Administrator.',
        ['KGBC 18.40.010(b)(13)', 'KGBC 18.90.020'],
      ),
      notRequiredOutcome(
        'paint_interior',
        'Interior-only work generally is outside HD exterior design review. Building/fire rules may still apply.',
        ['KGBC 18.40.010(b)(13)'],
      ),
    ],
  },
  {
    id: 'triage_awning_v1',
    projectType: 'AWNING_CANOPY',
    version: 1,
    isPublished: true,
    reviewedBy: 'Phase 1 seed — cites verified against ketchikangateway.borough.codes',
    reviewedAt: '2026-07-29T00:00:00.000Z',
    entryNodeId: 'awn_start',
    tree: [
      {
        id: 'awn_start',
        kind: 'question',
        prompt: 'Is the awning or canopy on a structure in the HD zone and visible from the boardwalk?',
        options: [
          { id: 'yes', label: 'Yes', next: 'awn_review' },
          { id: 'no', label: 'No', next: 'awn_outside' },
          { id: 'unsure', label: 'Not sure', next: 'awn_confirm' },
        ],
      },
      exteriorOutcome('awn_review', 'awning / canopy work'),
      notRequiredOutcome(
        'awn_outside',
        'If outside the HD zone or not an exterior appearance change in the district, HD design review generally does not apply.',
        ['KGBC 18.40.010(b)(13)'],
      ),
      confirmOutcome('awn_confirm', 'Confirm applicability with the Zoning Administrator.', ['KGBC 18.90.020']),
    ],
  },
  {
    id: 'triage_demo_v1',
    projectType: 'DEMOLITION',
    version: 1,
    isPublished: true,
    reviewedBy: 'Phase 1 seed — cites verified against ketchikangateway.borough.codes',
    reviewedAt: '2026-07-29T00:00:00.000Z',
    entryNodeId: 'demo_start',
    tree: [
      {
        id: 'demo_start',
        kind: 'question',
        prompt: 'Is the structure (or portion to be removed) in the Creek Street HD zone?',
        options: [
          { id: 'yes', label: 'Yes', next: 'demo_contrib' },
          { id: 'no', label: 'No', next: 'demo_outside' },
          { id: 'unsure', label: 'Not sure', next: 'demo_confirm' },
        ],
      },
      {
        id: 'demo_contrib',
        kind: 'question',
        prompt: 'Is the building NRHP-contributing or otherwise a historic contributing resource in the district?',
        options: [
          { id: 'yes', label: 'Yes / likely', next: 'demo_review' },
          { id: 'no', label: 'Non-contributing', next: 'demo_review' },
          { id: 'unsure', label: 'Not sure', next: 'demo_confirm' },
        ],
      },
      exteriorOutcome('demo_review', 'demolition'),
      notRequiredOutcome(
        'demo_outside',
        'HD design review applies inside the district. Demolition outside the HD zone follows other borough/city processes.',
        ['KGBC 18.40.010(b)(13)'],
      ),
      confirmOutcome(
        'demo_confirm',
        'Demolition in or near the district should be confirmed with the Zoning Administrator; contributing status affects review weight.',
        ['KGBC 18.40.010(b)(13)', 'KGBC 18.90.020'],
      ),
    ],
  },
  {
    id: 'triage_piling_v1',
    projectType: 'SUBSTRUCTURE_PILING',
    version: 1,
    isPublished: true,
    reviewedBy: 'Phase 1 seed — cites verified against ketchikangateway.borough.codes',
    reviewedAt: '2026-07-29T00:00:00.000Z',
    entryNodeId: 'pil_start',
    tree: [
      {
        id: 'pil_start',
        kind: 'question',
        prompt: 'Does the work involve pilings, substructure, or other work over or in Ketchikan Creek within the HD zone?',
        options: [
          { id: 'yes', label: 'Yes', next: 'pil_review' },
          { id: 'boardwalk', label: 'Boardwalk decking / rail only', next: 'pil_boardwalk' },
          { id: 'unsure', label: 'Not sure', next: 'pil_confirm' },
        ],
      },
      {
        id: 'pil_review',
        kind: 'outcome',
        outcome: 'REVIEW_REQUIRED',
        summary:
          'Substructure and piling work in the HD zone typically needs design review for exterior/district character — and is very likely to trigger multi-agency permits (ADF&G habitat, possibly Corps, city building). Use the permit trigger map next.',
        codeCites: ['KGBC 18.40.010(b)(13)', 'KGBC 18.90.020', 'AS 16.05.871'],
        criteria: ['APPROPRIATENESS', 'DESIGN_QUALITY', 'MATERIAL_HONESTY'],
        exhibits: [
          ...COMMON_EXHIBITS,
          'Structural/substructure drawings',
          'Work-in-water / over-water description',
        ],
        note: ZA,
      },
      exteriorOutcome('pil_boardwalk', 'boardwalk structure work'),
      confirmOutcome('pil_confirm', 'Confirm design-review and habitat permit path with the Zoning Administrator and ADF&G Habitat.', [
        'KGBC 18.90.020',
        'AS 16.05.871',
      ]),
    ],
  },
  {
    id: 'triage_boardwalk_v1',
    projectType: 'BOARDWALK_STRUCTURE',
    version: 1,
    isPublished: true,
    reviewedBy: 'Phase 1 seed — cites verified against ketchikangateway.borough.codes',
    reviewedAt: '2026-07-29T00:00:00.000Z',
    entryNodeId: 'bw_start',
    tree: [
      {
        id: 'bw_start',
        kind: 'question',
        prompt: 'Is the work on the public or private boardwalk network, bridge, or viewing platform in the district?',
        options: [
          { id: 'yes', label: 'Yes', next: 'bw_review' },
          { id: 'no', label: 'Building-only, not boardwalk', next: 'bw_building' },
          { id: 'unsure', label: 'Not sure', next: 'bw_confirm' },
        ],
      },
      exteriorOutcome('bw_review', 'boardwalk / pedestrian-network work'),
      confirmOutcome(
        'bw_building',
        'If the work is a building exterior alteration rather than boardwalk structure, restart the triage under Exterior alteration.',
        ['KGBC 18.40.010(b)(13)'],
      ),
      confirmOutcome('bw_confirm', 'Confirm ownership (borough/city/private) and review path with the Zoning Administrator.', [
        'KGBC 18.90.020',
      ]),
    ],
  },
  {
    id: 'triage_other_v1',
    projectType: 'OTHER',
    version: 1,
    isPublished: true,
    reviewedBy: 'Phase 1 seed — cites verified against ketchikangateway.borough.codes',
    reviewedAt: '2026-07-29T00:00:00.000Z',
    entryNodeId: 'oth_start',
    tree: [
      {
        id: 'oth_start',
        kind: 'question',
        prompt: 'Does the project change the exterior appearance of a building or structure in the HD zone?',
        options: [
          { id: 'yes', label: 'Yes', next: 'oth_review' },
          { id: 'no', label: 'No', next: 'oth_none' },
          { id: 'unsure', label: 'Not sure', next: 'oth_confirm' },
        ],
      },
      exteriorOutcome('oth_review', 'project'),
      confirmOutcome(
        'oth_none',
        'If there is no exterior appearance change in the HD zone, design review may not apply — confirm edge cases with the Zoning Administrator.',
        ['KGBC 18.40.010(b)(13)', 'KGBC 18.90.020'],
      ),
      confirmOutcome('oth_confirm', 'Confirm with the Zoning Administrator.', ['KGBC 18.90.020']),
    ],
  },
];

export type AgencySeed = {
  id: string;
  name: string;
  shortName: string;
  jurisdiction: string;
  contactUrl: string;
};

export type PermitTriggerSeed = {
  id: string;
  agencyId: string;
  permitName: string;
  statutoryCite: string;
  conditions: Record<string, boolean | string>;
  typicalLeadTimeDays: number | null;
  guidanceUrl: string | null;
  verifiedAt: string | null;
  verifiedNote: string | null;
};

export const agencies: AgencySeed[] = [
  {
    id: 'agency_kgb',
    name: 'Ketchikan Gateway Borough Planning / Zoning Administrator',
    shortName: 'KGB-Planning',
    jurisdiction: 'BOROUGH',
    contactUrl: 'https://www.kgbak.us/',
  },
  {
    id: 'agency_city',
    name: 'City of Ketchikan Building & Fire',
    shortName: 'City-Building',
    jurisdiction: 'CITY',
    contactUrl: 'https://www.ktn-ak.gov/',
  },
  {
    id: 'agency_adfg',
    name: 'ADF&G Habitat Section',
    shortName: 'ADF&G-Habitat',
    jurisdiction: 'STATE',
    contactUrl: 'https://www.adfg.alaska.gov/index.cfm?adfg=habitatregulations.main',
  },
  {
    id: 'agency_usace',
    name: 'U.S. Army Corps of Engineers',
    shortName: 'USACE',
    jurisdiction: 'FEDERAL',
    contactUrl: 'https://www.poa.usace.army.mil/',
  },
  {
    id: 'agency_adec',
    name: 'Alaska Department of Environmental Conservation',
    shortName: 'ADEC',
    jurisdiction: 'STATE',
    contactUrl: 'https://dec.alaska.gov/',
  },
  {
    id: 'agency_shpo',
    name: 'Alaska SHPO / Office of History & Archaeology',
    shortName: 'SHPO',
    jurisdiction: 'STATE',
    contactUrl: 'https://dnr.alaska.gov/parks/oha/',
  },
];

export const permitTriggers: PermitTriggerSeed[] = [
  {
    id: 'trig_hd_review',
    agencyId: 'agency_kgb',
    permitName: 'HD zone certificate of approval / design review',
    statutoryCite: 'KGBC 18.40.010(b)(13); KGBC 18.90.020',
    conditions: { inHdZone: true, exteriorChange: true },
    typicalLeadTimeDays: 45,
    guidanceUrl: 'https://ketchikangateway.borough.codes/KGBC/18.90.020',
    verifiedAt: '2026-07-29T00:00:00.000Z',
    verifiedNote:
      'Verified against published KGBC Title 18 on ketchikangateway.borough.codes (18.40.010 HD purpose; 18.90.020 administrative permits / ADRB procedure).',
  },
  {
    id: 'trig_adfg_fh',
    agencyId: 'agency_adfg',
    permitName: 'Fish Habitat Permit (Anadromous Fish Act)',
    statutoryCite: 'AS 16.05.871; 5 AAC 95.011',
    conditions: { overWater: true, inWater: true, groundDisturbing: false, substructure: true },
    typicalLeadTimeDays: 30,
    guidanceUrl: 'https://www.adfg.alaska.gov/index.cfm?adfg=habitatregulations.prohibited',
    verifiedAt: '2026-07-29T00:00:00.000Z',
    verifiedNote:
      'Statute verified. Ketchikan Creek cited as AWC 101-47-10250 in ADF&G Deer Mountain Hatchery BMP; confirm current Anadromous Waters Catalog entry before filing. Applies when work uses, diverts, obstructs, pollutes, or changes the natural flow or bed of a specified waterbody.',
  },
  {
    id: 'trig_city_building',
    agencyId: 'agency_city',
    permitName: 'Building / structural / fire / occupancy permit',
    statutoryCite: 'City of Ketchikan building & fire codes (verify current title)',
    conditions: { structural: true, occupancyChange: true, exteriorChange: true },
    typicalLeadTimeDays: 30,
    guidanceUrl: 'https://www.ktn-ak.gov/',
    verifiedAt: null,
    verifiedNote:
      'Creek Street is inside city limits — building/fire jurisdiction is likely. Specific code sections and boardwalk load rules not yet hand-verified for publication.',
  },
  {
    id: 'trig_usace',
    agencyId: 'agency_usace',
    permitName: 'Section 10 / Section 404 authorization',
    statutoryCite: 'Rivers and Harbors Act §10; Clean Water Act §404',
    conditions: { inWater: true, fill: true, overWater: true, substructure: true },
    typicalLeadTimeDays: 120,
    guidanceUrl: 'https://www.poa.usace.army.mil/',
    verifiedAt: null,
    verifiedNote:
      'Likely for fill or structures in navigable/jurisdictional waters. Applicability to specific Creek Street piling repairs not yet verified with Corps Alaska District — do not treat as confirmed.',
  },
  {
    id: 'trig_adec',
    agencyId: 'agency_adec',
    permitName: 'Stormwater / wastewater / contaminated site authorizations',
    statutoryCite: 'Project-dependent ADEC programs',
    conditions: { groundDisturbing: true, wastewater: true },
    typicalLeadTimeDays: 60,
    guidanceUrl: 'https://dec.alaska.gov/',
    verifiedAt: null,
    verifiedNote: 'Project-dependent. Not verified for typical Creek Street exterior-only work.',
  },
  {
    id: 'trig_shpo',
    agencyId: 'agency_shpo',
    permitName: 'Section 106 / state historic consultation',
    statutoryCite: 'NHPA §106 (federal nexus); state consultation where applicable',
    conditions: { federalNexus: true },
    typicalLeadTimeDays: 90,
    guidanceUrl: 'https://dnr.alaska.gov/parks/oha/',
    verifiedAt: null,
    verifiedNote:
      'Only where a federal funding or permit nexus exists. Not a default HD-zone trigger. Unverified for routine private exterior work.',
  },
];

export type PrecedentExemplarSeed = {
  id: string;
  decisionId: string;
  photoUrl: string;
  side: 'BEFORE' | 'AFTER' | 'AS_PROPOSED' | 'AS_BUILT';
  caption: string;
  sourceDocUrl: string;
  criterion: string;
  weight: 'DECISIVE' | 'SUPPORTING' | 'INCIDENTAL';
};

/** Visual library rows — captions carry the teaching; photos are illustrative placeholders until packet exhibits are mirrored. */
export const precedentExemplars: PrecedentExemplarSeed[] = [
  {
    id: 'ex_sign_proposed',
    decisionId: 'dec_sample_1',
    photoUrl: '/precedents/sign-as-proposed.svg',
    side: 'AS_PROPOSED',
    caption:
      'As proposed: wall-mounted wood sign, hand-painted lettering, no internal illumination — board recommended approval with material conditions.',
    sourceDocUrl: 'https://npgallery.nps.gov/AssetDetail/NRIS/14000454',
    criterion: 'MATERIAL_HONESTY',
    weight: 'DECISIVE',
  },
  {
    id: 'ex_sign_after',
    decisionId: 'dec_sample_1',
    photoUrl: '/precedents/sign-as-built.svg',
    side: 'AS_BUILT',
    caption: 'Condition focus: wood substrate; no plastic face; hardware painted to match siding.',
    sourceDocUrl: 'https://npgallery.nps.gov/AssetDetail/NRIS/14000454',
    criterion: 'MATERIAL_HONESTY',
    weight: 'DECISIVE',
  },
  {
    id: 'ex_awning_proposed',
    decisionId: 'dec_sample_2',
    photoUrl: '/precedents/awning-as-proposed.svg',
    side: 'AS_PROPOSED',
    caption: 'Traditional shed-profile fabric awning on cedar frame — recommended approval as submitted (appropriateness / design quality).',
    sourceDocUrl: 'https://npgallery.nps.gov/AssetDetail/NRIS/14000454',
    criterion: 'APPROPRIATENESS',
    weight: 'DECISIVE',
  },
  {
    id: 'ex_awning_after',
    decisionId: 'dec_sample_2',
    photoUrl: '/precedents/awning-as-built.svg',
    side: 'AS_BUILT',
    caption: 'Approved profile consistent with boardwalk vernacular — steep shed, wood structure, fabric cover.',
    sourceDocUrl: 'https://npgallery.nps.gov/AssetDetail/NRIS/14000454',
    criterion: 'DESIGN_QUALITY',
    weight: 'SUPPORTING',
  },
];
