/** Application statuses safe for public mirror / open data. DRAFT is never included. */
export const PUBLIC_APPLICATION_STATUSES = [
  'FILED',
  'SCHEDULED',
  'BOARD_REVIEWED',
  'FORWARDED',
  'APPROVED',
  'APPROVED_W_CONDITIONS',
  'DENIED',
  'WITHDRAWN',
] as const;

export type PublicApplicationStatus = (typeof PUBLIC_APPLICATION_STATUSES)[number];

export const PUBLIC_STATUS_SET = new Set<string>(PUBLIC_APPLICATION_STATUSES);
