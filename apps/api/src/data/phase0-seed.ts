/**
 * Phase 0 seed — structure inventory from NRHP nomination ref. 14000454 (listed 2014).
 * Federal public domain. Every mirrored fact carries sourceDocUrl.
 * Source: NPS NRHP registration / continuation sheets for Creek Street Historic District.
 */

const NRHP_SOURCE =
  'https://npgallery.nps.gov/AssetDetail/NRIS/14000454';

const KGBC_TITLE18_NOTE =
  'KGBC Title 18 HD zone provisions — hand-curated from borough code (ICC Code Solutions host). Verify before citing in official filings.';

export type LngLat = [number, number];

export type PolygonGeometry = {
  type: 'Polygon';
  coordinates: number[][][];
};

export type PointGeometry = {
  type: 'Point';
  coordinates: LngLat;
};

export type GeoFeature = {
  type: 'Feature';
  properties: Record<string, unknown> | null;
  geometry: PolygonGeometry | PointGeometry;
};

export type SeedParcel = {
  id: string;
  parcelNumber: string;
  address: string;
  geometry: PolygonGeometry;
  inHdZone: boolean;
};

export type SeedStructure = {
  id: string;
  parcelId: string;
  commonName: string | null;
  addressLabel: string;
  yearBuilt: number | null;
  nrhpContributing: boolean;
  historicNarrative: string;
  publicSlug: string;
  centroid: PointGeometry;
  sourceDocUrl: string;
};

export type SeedMeeting = {
  id: string;
  scheduledAt: string;
  location: string;
  status: 'SCHEDULED' | 'HELD' | 'CANCELLED' | 'FAILED_QUORUM';
  quorumMet: boolean | null;
  cancelReason: string | null;
  agendaUrl: string | null;
  minutesUrl: string | null;
  videoUrl: string | null;
  sourceDocUrl: string | null;
  agendaItems: { id: string; itemNumber: string; title: string; applicationId: string | null }[];
};

export type SeedApplication = {
  id: string;
  caseNumber: string | null;
  parcelId: string;
  structureId: string | null;
  applicantName: string | null;
  projectType: string;
  description: string;
  status: string;
  filedAt: string | null;
  source: 'MIRRORED' | 'APPLICANT_DRAFT';
  sourceDocUrl: string | null;
};

export type SeedDecision = {
  id: string;
  applicationId: string;
  meetingId: string | null;
  recommendation: string;
  conditions: string | null;
  voteFor: number | null;
  voteAgainst: number | null;
  finalOutcome: string | null;
  sourceDocUrl: string;
  decidedAt: string | null;
};

export type SeedSeat = {
  id: string;
  label: string;
  seatType: string;
  terms: {
    id: string;
    memberName: string | null;
    termStart: string;
    termEnd: string;
    vacatedAt: string | null;
  }[];
};

export type SeedCriterion = {
  key: string;
  label: string;
  plainLanguage: string;
  codeCite: string;
  codeText: string;
};

/** Approximate HD zone polygon around Creek Street boardwalk (WGS84). */
export const districtBoundary: GeoFeature = {
  type: 'Feature',
  properties: {
    name: 'Creek Street Historic District',
    sourceDocUrl: NRHP_SOURCE,
    note: 'Approximate boundary for map display; refine from borough GIS when available.',
  },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [-131.6432, 55.3416],
        [-131.6408, 55.3416],
        [-131.6405, 55.3434],
        [-131.6430, 55.3435],
        [-131.6432, 55.3416],
      ],
    ],
  },
};

export const parcels: SeedParcel[] = [
  {
    id: 'parcel_2cs',
    parcelNumber: 'CS-002',
    address: '2 Creek Street',
    inHdZone: true,
    geometry: polyAround(-131.6427, 55.3429),
  },
  {
    id: 'parcel_4cs',
    parcelNumber: 'CS-004',
    address: '4 Creek Street',
    inHdZone: true,
    geometry: polyAround(-131.6426, 55.34285),
  },
  {
    id: 'parcel_5cs',
    parcelNumber: 'CS-005',
    address: '5 Creek Street',
    inHdZone: true,
    geometry: polyAround(-131.64253, 55.34247),
  },
  {
    id: 'parcel_10cs',
    parcelNumber: 'CS-010',
    address: '10 Creek Street',
    inHdZone: true,
    geometry: polyAround(-131.6424, 55.3427),
  },
  {
    id: 'parcel_11cs',
    parcelNumber: 'CS-011',
    address: '11 Creek Street',
    inHdZone: true,
    geometry: polyAround(-131.6423, 55.34265),
  },
  {
    id: 'parcel_20cs',
    parcelNumber: 'CS-020',
    address: '20 Creek Street',
    inHdZone: true,
    geometry: polyAround(-131.6421, 55.3424),
  },
  {
    id: 'parcel_24cs',
    parcelNumber: 'CS-024',
    address: '24 Creek Street',
    inHdZone: true,
    geometry: polyAround(-131.6420, 55.3423),
  },
  {
    id: 'parcel_28cs',
    parcelNumber: 'CS-028',
    address: '28 Creek Street',
    inHdZone: true,
    geometry: polyAround(-131.6419, 55.3422),
  },
  {
    id: 'parcel_203stedman',
    parcelNumber: 'ST-203',
    address: '203/203A Stedman Street',
    inHdZone: true,
    geometry: polyAround(-131.6417, 55.3419),
  },
  {
    id: 'parcel_1cs',
    parcelNumber: 'CS-001',
    address: '1 Creek Street',
    inHdZone: true,
    geometry: polyAround(-131.6428, 55.3430),
  },
  {
    id: 'parcel_7cs',
    parcelNumber: 'CS-007',
    address: '7 Creek Street',
    inHdZone: true,
    geometry: polyAround(-131.6425, 55.34255),
  },
  {
    id: 'parcel_13cs',
    parcelNumber: 'CS-013',
    address: '13 Creek Street',
    inHdZone: true,
    geometry: polyAround(-131.64225, 55.3426),
  },
  {
    id: 'parcel_18cs',
    parcelNumber: 'CS-018',
    address: '18 Creek Street',
    inHdZone: true,
    geometry: polyAround(-131.64215, 55.3425),
  },
  {
    id: 'parcel_21cs',
    parcelNumber: 'CS-021',
    address: '21 Creek Street',
    inHdZone: true,
    geometry: polyAround(-131.64205, 55.34235),
  },
  {
    id: 'parcel_22cs',
    parcelNumber: 'CS-022',
    address: '22 Creek Street',
    inHdZone: true,
    geometry: polyAround(-131.64202, 55.34232),
  },
];

export const structures: SeedStructure[] = [
  {
    id: 'struct_2cs',
    parcelId: 'parcel_2cs',
    commonName: null,
    addressLabel: '2 Creek Street',
    yearBuilt: 1920,
    nrhpContributing: true,
    historicNarrative:
      'Contributing building (c. 1920) in the Creek Street Historic District. Typical Creek Street Pioneer / vernacular pioneer form: wood frame on pilings over tidal waters, boardwalk frontage, steep roof pitched for heavy rain and snow.',
    publicSlug: '2-creek-street',
    centroid: point(-131.6427, 55.3429),
    sourceDocUrl: NRHP_SOURCE,
  },
  {
    id: 'struct_4cs',
    parcelId: 'parcel_4cs',
    commonName: null,
    addressLabel: '4 Creek Street',
    yearBuilt: 1920,
    nrhpContributing: true,
    historicNarrative:
      'Contributing building (c. 1920). Maintains massing and boardwalk relationship characteristic of early Creek Street residential/commercial vernacular.',
    publicSlug: '4-creek-street',
    centroid: point(-131.6426, 55.34285),
    sourceDocUrl: NRHP_SOURCE,
  },
  {
    id: 'struct_star',
    parcelId: 'parcel_5cs',
    commonName: "The Star / Star House",
    addressLabel: '5 Creek Street',
    yearBuilt: 1903,
    nrhpContributing: true,
    historicNarrative:
      'The Star (1903), individually listed in the National Register (NRIS 93000336) and a contributing property to the Creek Street Historic District. Began as a gabled 1½-story building; a larger rectangular addition for a dance hall and upstairs rooms was joined between about 1910–1913; a hipped roof was added in the late 1920s. Restored and maintained as a landmark of the district.',
    publicSlug: 'star-house',
    centroid: point(-131.64253, 55.34247),
    sourceDocUrl: NRHP_SOURCE,
  },
  {
    id: 'struct_10cs',
    parcelId: 'parcel_10cs',
    commonName: null,
    addressLabel: '10 Creek Street',
    yearBuilt: 1921,
    nrhpContributing: true,
    historicNarrative:
      'Contributing building (c. 1921). Maintains original massing and distinctive early Creek Street character along the boardwalk.',
    publicSlug: '10-creek-street',
    centroid: point(-131.6424, 55.3427),
    sourceDocUrl: NRHP_SOURCE,
  },
  {
    id: 'struct_11cs',
    parcelId: 'parcel_11cs',
    commonName: null,
    addressLabel: '11 Creek Street',
    yearBuilt: 1925,
    nrhpContributing: true,
    historicNarrative:
      'Contributing building (late 1920s / c. 1925). Little altered; associated with early Creek Street commercial and residential use on pilings over Ketchikan Creek.',
    publicSlug: '11-creek-street',
    centroid: point(-131.6423, 55.34265),
    sourceDocUrl: NRHP_SOURCE,
  },
  {
    id: 'struct_20cs',
    parcelId: 'parcel_20cs',
    commonName: null,
    addressLabel: '20 Creek Street',
    yearBuilt: 1920,
    nrhpContributing: true,
    historicNarrative:
      'Contributing building (c. 1920). Restored and noted in the nomination as in very good condition; wood vernacular form fronting the boardwalk.',
    publicSlug: '20-creek-street',
    centroid: point(-131.6421, 55.3424),
    sourceDocUrl: NRHP_SOURCE,
  },
  {
    id: 'struct_dollys',
    parcelId: 'parcel_24cs',
    commonName: "Dolly's House",
    addressLabel: '24 Creek Street',
    yearBuilt: 1905,
    nrhpContributing: true,
    historicNarrative:
      "Dolly's House (1905), contributing building and today a museum interpreting Creek Street's decades as Ketchikan's restricted district (roughly 1903–1954). Restored; among the properties cited in the NRHP nomination as in very good condition.",
    publicSlug: 'dollys-house',
    centroid: point(-131.6420, 55.3423),
    sourceDocUrl: NRHP_SOURCE,
  },
  {
    id: 'struct_28cs',
    parcelId: 'parcel_28cs',
    commonName: null,
    addressLabel: '28 Creek Street',
    yearBuilt: 1902,
    nrhpContributing: true,
    historicNarrative:
      'Contributing building (1902). Among the earliest surviving houses on the Creek; restored and cited in the nomination as in very good condition. (A separate non-contributing 2005 structure also appears in district resource counts under a later address reuse — see non-contributing inventory.)',
    publicSlug: '28-creek-street',
    centroid: point(-131.6419, 55.3422),
    sourceDocUrl: NRHP_SOURCE,
  },
  {
    id: 'struct_junes',
    parcelId: 'parcel_203stedman',
    commonName: "June's Cafe",
    addressLabel: '203/203A Stedman Street',
    yearBuilt: 1903,
    nrhpContributing: true,
    historicNarrative:
      "June's Cafe (1903), contributing storefront building at the corner of Stedman and Creek — the storefront type rare on Creek Street itself. Simple commercial form with display windows and false-front character facing Stedman Street.",
    publicSlug: 'junes-cafe',
    centroid: point(-131.6417, 55.3419),
    sourceDocUrl: NRHP_SOURCE,
  },
  // Non-contributing (built or dramatically altered less than 50 years before nomination)
  {
    id: 'struct_1cs',
    parcelId: 'parcel_1cs',
    commonName: null,
    addressLabel: '1 Creek Street',
    yearBuilt: 1930,
    nrhpContributing: false,
    historicNarrative:
      'Non-contributing (1930, dramatically altered 1972). Included in the district building inventory for map completeness; does not contribute to the NRHP period of significance under the 2014 nomination criteria for contributing resources.',
    publicSlug: '1-creek-street',
    centroid: point(-131.6428, 55.3430),
    sourceDocUrl: NRHP_SOURCE,
  },
  {
    id: 'struct_eagles',
    parcelId: 'parcel_7cs',
    commonName: 'Eagles Lodge',
    addressLabel: '7 Creek Street',
    yearBuilt: 1976,
    nrhpContributing: false,
    historicNarrative:
      'Non-contributing Eagles Lodge (1976). Post-dates the historic period; subject to local HD zone design review for exterior work.',
    publicSlug: 'eagles-lodge',
    centroid: point(-131.6425, 55.34255),
    sourceDocUrl: NRHP_SOURCE,
  },
  {
    id: 'struct_13cs',
    parcelId: 'parcel_13cs',
    commonName: null,
    addressLabel: '13 Creek Street',
    yearBuilt: 1991,
    nrhpContributing: false,
    historicNarrative:
      'Non-contributing building (1991). Newer construction within the local historic district; design review applies under KGBC HD zone rules.',
    publicSlug: '13-creek-street',
    centroid: point(-131.64225, 55.3426),
    sourceDocUrl: NRHP_SOURCE,
  },
  {
    id: 'struct_18cs',
    parcelId: 'parcel_18cs',
    commonName: null,
    addressLabel: '18 Creek Street',
    yearBuilt: 1974,
    nrhpContributing: false,
    historicNarrative:
      'Non-contributing building (1974). Built after the close of the nomination’s contributing period; still within the local HD zone.',
    publicSlug: '18-creek-street',
    centroid: point(-131.64215, 55.3425),
    sourceDocUrl: NRHP_SOURCE,
  },
  {
    id: 'struct_21cs',
    parcelId: 'parcel_21cs',
    commonName: null,
    addressLabel: '21 Creek Street',
    yearBuilt: 1993,
    nrhpContributing: false,
    historicNarrative:
      'Non-contributing building (1993). Newer construction on the boardwalk; exterior changes may trigger design review.',
    publicSlug: '21-creek-street',
    centroid: point(-131.64205, 55.34235),
    sourceDocUrl: NRHP_SOURCE,
  },
  {
    id: 'struct_22cs',
    parcelId: 'parcel_22cs',
    commonName: null,
    addressLabel: '22 Creek Street',
    yearBuilt: 1974,
    nrhpContributing: false,
    historicNarrative:
      'Non-contributing building (1974). Included for complete district map coverage.',
    publicSlug: '22-creek-street',
    centroid: point(-131.64202, 55.34232),
    sourceDocUrl: NRHP_SOURCE,
  },
];

export const criteria: SeedCriterion[] = [
  {
    key: 'UNIFORMITY',
    label: 'Excessive uniformity',
    plainLanguage:
      'New work should not make Creek Street look like a matching set. The district’s character comes from related but individual wooden buildings — not identical façades.',
    codeCite: 'KGBC 18.40.010(13)',
    codeText:
      'Review criterion addressing excessive uniformity among buildings in the historic district (plain-language rendering; consult current KGBC Title 18 text).',
  },
  {
    key: 'DISSIMILARITY',
    label: 'Dissimilarity',
    plainLanguage:
      'New work also should not jar against neighbors. Scale, roof pitch, materials, and boardwalk relationship should read as belonging to Creek Street’s vernacular pioneer pattern.',
    codeCite: 'KGBC 18.40.010(13)',
    codeText:
      'Review criterion addressing excessive dissimilarity / incompatibility with surrounding historic character (plain-language rendering; consult current KGBC Title 18 text).',
  },
  {
    key: 'APPROPRIATENESS',
    label: 'Appropriateness',
    plainLanguage:
      'Is the proposal appropriate to this place — a boardwalk on pilings over an anadromous creek, with wood vernacular buildings and pedestrian-only access?',
    codeCite: 'KGBC 18.40.010(13)',
    codeText:
      'Review criterion addressing appropriateness of design within the HD zone context (plain-language rendering; consult current KGBC Title 18 text).',
  },
  {
    key: 'DESIGN_QUALITY',
    label: 'Design quality',
    plainLanguage:
      'Craft, proportion, and detailing matter. The board evaluates whether the design is competent and coherent, not merely allowed by dimensional rules.',
    codeCite: 'KGBC 18.40.010(13)',
    codeText:
      'Review criterion addressing quality of design (plain-language rendering; consult current KGBC Title 18 text).',
  },
  {
    key: 'MATERIAL_HONESTY',
    label: 'Honest material expression',
    plainLanguage:
      'Materials should read as what they are. Fake “historic” cladding or materials that pretend to be something else have been a recurring concern in design review.',
    codeCite: 'KGBC 18.40.010(13)',
    codeText:
      'Review criterion addressing dishonest expression of materials (plain-language rendering; consult current KGBC Title 18 text).',
  },
];

export const guidanceSections = [
  {
    id: 'hd-zone',
    title: 'What the HD zone is',
    plainLanguage:
      'The Creek Street Historic District is a local zoning overlay under Ketchikan Gateway Borough Code Title 18. An Architectural Design Review Board advises the Planning Commission and Zoning Administrator on exterior design in the district. This hub mirrors public information; it is not the borough’s system of record.',
    codeCite: 'KGBC Title 18 — Historic District (HD) zone',
    codeText: KGBC_TITLE18_NOTE,
  },
  {
    id: 'who-decides',
    title: 'Who decides',
    plainLanguage:
      'The Design Review Board issues advisory recommendations. Final action rests with the Planning Commission or Zoning Administrator under borough code. Always confirm requirements with the Zoning Administrator before filing.',
    codeCite: 'KGBC Title 18; board enabling provisions',
    codeText: KGBC_TITLE18_NOTE,
  },
  {
    id: 'typical-triggers',
    title: 'Typical review triggers',
    plainLanguage:
      'Exterior alterations, new construction, signage, awnings/canopies, paint and materials changes visible from the boardwalk, demolition, and work on boardwalk or substructure/pilings commonly raise design-review questions. Multi-agency permits (building, habitat, Corps, etc.) may also apply — design review is often the smallest approval a project needs.',
    codeCite: 'KGBC 18.40.010(13) and related HD provisions',
    codeText: KGBC_TITLE18_NOTE,
  },
  {
    id: 'criteria',
    title: 'Review criteria (derived)',
    plainLanguage:
      'Criteria derive from KGBC 18.40.010(13): uniformity/dissimilarity, appropriateness, design quality, and honest material expression. See each criterion page for plain language beside the code cite.',
    codeCite: 'KGBC 18.40.010(13)',
    codeText: KGBC_TITLE18_NOTE,
  },
];

/** Illustrative mirrored docket/archive rows — labeled as sample until borough packets are ingested. */
export const applications: SeedApplication[] = [
  {
    id: 'app_sample_sign',
    caseNumber: 'HDR-SAMPLE-001',
    parcelId: 'parcel_20cs',
    structureId: 'struct_20cs',
    applicantName: 'Sample Applicant (illustrative)',
    projectType: 'SIGNAGE',
    description:
      'Illustrative archive row: proposed wall-mounted wood sign on boardwalk façade, hand-painted lettering, no internal illumination.',
    status: 'APPROVED_W_CONDITIONS',
    filedAt: '2023-03-01T00:00:00.000Z',
    source: 'MIRRORED',
    sourceDocUrl: NRHP_SOURCE,
  },
  {
    id: 'app_sample_awning',
    caseNumber: 'HDR-SAMPLE-002',
    parcelId: 'parcel_10cs',
    structureId: 'struct_10cs',
    applicantName: 'Sample Applicant (illustrative)',
    projectType: 'AWNING_CANOPY',
    description:
      'Illustrative archive row: replacement fabric awning over entry, cedar frame, traditional shed profile.',
    status: 'APPROVED',
    filedAt: '2024-01-12T00:00:00.000Z',
    source: 'MIRRORED',
    sourceDocUrl: NRHP_SOURCE,
  },
  {
    id: 'app_sample_pending',
    caseNumber: 'HDR-SAMPLE-003',
    parcelId: 'parcel_13cs',
    structureId: 'struct_13cs',
    applicantName: 'Sample Applicant (illustrative)',
    projectType: 'EXTERIOR_ALTERATION',
    description:
      'Illustrative docket row: proposed window replacement on creek-facing elevation with wood-clad units matching existing proportions.',
    status: 'SCHEDULED',
    filedAt: '2026-05-01T00:00:00.000Z',
    source: 'MIRRORED',
    sourceDocUrl: null,
  },
];

export const decisions: SeedDecision[] = [
  {
    id: 'dec_sample_1',
    applicationId: 'app_sample_sign',
    meetingId: 'mtg_2023_04',
    recommendation: 'Recommend approval with conditions: wood substrate; no plastic face; mounting hardware painted to match siding.',
    conditions: 'Wood substrate; no internal illumination; mount into framing where possible.',
    voteFor: 4,
    voteAgainst: 0,
    finalOutcome: 'Zoning Administrator approved with board conditions (illustrative).',
    sourceDocUrl: NRHP_SOURCE,
    decidedAt: '2023-04-12T00:00:00.000Z',
  },
  {
    id: 'dec_sample_2',
    applicationId: 'app_sample_awning',
    meetingId: 'mtg_2024_02',
    recommendation: 'Recommend approval as submitted.',
    conditions: null,
    voteFor: 5,
    voteAgainst: 0,
    finalOutcome: 'Approved (illustrative).',
    sourceDocUrl: NRHP_SOURCE,
    decidedAt: '2024-02-14T00:00:00.000Z',
  },
];

export const meetings: SeedMeeting[] = [
  {
    id: 'mtg_2023_04',
    scheduledAt: '2023-04-12T18:00:00.000Z',
    location: 'Assembly Chambers, White Cliff Building',
    status: 'HELD',
    quorumMet: true,
    cancelReason: null,
    agendaUrl: null,
    minutesUrl: null,
    videoUrl: null,
    sourceDocUrl: null,
    agendaItems: [
      {
        id: 'ai_2023_04_1',
        itemNumber: '4.a',
        title: 'HDR-SAMPLE-001 — Signage at 20 Creek Street (illustrative)',
        applicationId: 'app_sample_sign',
      },
    ],
  },
  {
    id: 'mtg_2024_02',
    scheduledAt: '2024-02-14T18:00:00.000Z',
    location: 'Assembly Chambers, White Cliff Building',
    status: 'HELD',
    quorumMet: true,
    cancelReason: null,
    agendaUrl: null,
    minutesUrl: null,
    videoUrl: null,
    sourceDocUrl: null,
    agendaItems: [
      {
        id: 'ai_2024_02_1',
        itemNumber: '4.a',
        title: 'HDR-SAMPLE-002 — Awning at 10 Creek Street (illustrative)',
        applicationId: 'app_sample_awning',
      },
    ],
  },
  {
    id: 'mtg_2026_08',
    scheduledAt: '2026-08-12T18:00:00.000Z',
    location: 'Assembly Chambers, White Cliff Building',
    status: 'SCHEDULED',
    quorumMet: null,
    cancelReason: null,
    agendaUrl: null,
    minutesUrl: null,
    videoUrl: null,
    sourceDocUrl: null,
    agendaItems: [
      {
        id: 'ai_2026_08_1',
        itemNumber: '4.a',
        title: 'HDR-SAMPLE-003 — Window replacement at 13 Creek Street (illustrative)',
        applicationId: 'app_sample_pending',
      },
    ],
  },
];

export const seats: SeedSeat[] = [
  {
    id: 'seat_al1',
    label: 'At-Large 1',
    seatType: 'AT_LARGE',
    terms: [
      {
        id: 'term_al1_vacant',
        memberName: null,
        termStart: '2025-01-01T00:00:00.000Z',
        termEnd: '2027-12-31T00:00:00.000Z',
        vacatedAt: null,
      },
    ],
  },
  {
    id: 'seat_al2',
    label: 'At-Large 2',
    seatType: 'AT_LARGE',
    terms: [
      {
        id: 'term_al2_vacant',
        memberName: null,
        termStart: '2025-01-01T00:00:00.000Z',
        termEnd: '2027-12-31T00:00:00.000Z',
        vacatedAt: null,
      },
    ],
  },
  {
    id: 'seat_po',
    label: 'Property Owner',
    seatType: 'PROPERTY_OWNER',
    terms: [
      {
        id: 'term_po_placeholder',
        memberName: 'Seat holder (confirm with Clerk)',
        termStart: '2024-01-01T00:00:00.000Z',
        termEnd: '2026-12-31T00:00:00.000Z',
        vacatedAt: null,
      },
    ],
  },
  {
    id: 'seat_bo',
    label: 'Business Owner',
    seatType: 'BUSINESS_OWNER',
    terms: [
      {
        id: 'term_bo_placeholder',
        memberName: 'Seat holder (confirm with Clerk)',
        termStart: '2024-01-01T00:00:00.000Z',
        termEnd: '2026-12-31T00:00:00.000Z',
        vacatedAt: null,
      },
    ],
  },
  {
    id: 'seat_dp',
    label: 'Design Professional',
    seatType: 'DESIGN_PROFESSIONAL',
    terms: [
      {
        id: 'term_dp_placeholder',
        memberName: 'Seat holder (confirm with Clerk)',
        termStart: '2024-01-01T00:00:00.000Z',
        termEnd: '2026-12-31T00:00:00.000Z',
        vacatedAt: null,
      },
    ],
  },
];

export const openDataLicense = {
  name: 'Open Data — Creek Street Design Review Hub',
  spdx: 'CC0-1.0',
  summary:
    'Public mirror datasets (structures, applications with non-DRAFT status, decisions, meetings, seats) are published for reuse. This site is operated by Mitchel Turner Dev, LLC and is not a borough property. Mirrored facts cite primary documents; verify against borough records before relying on them for filings.',
  attribution:
    'NRHP structure inventory derived from National Register nomination 14000454 (public domain federal record).',
};

export const meta = {
  siteName: 'Creek Street Design Review Hub',
  operator: 'Mitchel Turner Dev, LLC',
  notBoroughProperty: true,
  phase: 1,
  nrhpReference: '14000454',
  nrhpSourceUrl: NRHP_SOURCE,
  zoningAdministratorContact: {
    label: 'Ketchikan Gateway Borough — Planning / Zoning Administrator',
    url: 'https://www.kgbak.us/',
    note: 'Official determinations and filings go to the Borough Planning Department.',
  },
  applyForBoard: {
    label: 'Platting/Zoning Clerk — how to apply for a seat',
    url: 'https://www.kgbak.us/',
    note: 'At-large and other vacancies are filled through the borough appointment process. Confirm current openings with the Clerk.',
  },
};

function point(lng: number, lat: number): PointGeometry {
  return { type: 'Point', coordinates: [lng, lat] };
}

function polyAround(lng: number, lat: number): PolygonGeometry {
  const d = 0.00008;
  return {
    type: 'Polygon',
    coordinates: [
      [
        [lng - d, lat - d],
        [lng + d, lat - d],
        [lng + d, lat + d],
        [lng - d, lat + d],
        [lng - d, lat - d],
      ],
    ],
  };
}
