export type ActionIntent = 'track' | 'file' | 'emergency';

export const TRACK_PATTERNS = [
  /track\b.*complaint/i, /status\b.*complaint/i, /complaint\b.*status/i,
  /suriin\b.*reklamo/i, /tingnan\b.*reklamo/i, /status\b.*ng\b.*reklamo/i,
  /reklamo\b.*status/i, /alamin\b.*status/i, /makita\b.*reklamo/i,
  /i-track/i, /i-check\b.*reklamo/i,
];

export const FILE_PATTERNS = [
  /how\b.*file\b.*complaint/i, /submit\b.*complaint/i, /make\b.*complaint/i,
  /lodge\b.*complaint/i, /mag-reklamo/i, /paano\b.*magreklamo/i,
  /paano\b.*mag.reklamo/i, /mag-file\b.*ng\b.*reklamo/i, /i-file\b.*reklamo/i,
  /isumite\b.*reklamo/i, /magsumite\b.*ng\b.*reklamo/i, /magsampa\b.*ng\b.*reklamo/i,
];

/**
 * EMERGENCY_PATTERNS — kept strict/specific so they don't fire on
 * complaint-related FAQ responses that happen to mention:
 *   - "hotline" (common in complaint instructions)
 *   - "tulungan" / "tulong" (common in polite bot replies)
 *   - "pulis" without an actual distress context
 *
 * Rules:
 *  - Physical emergency events: fire, flood, accident, crime, etc.
 *  - Distress calls that require immediate help (saklolo, ambulance, rescue)
 *  - Specific agency references only when paired with urgency (mdrrmo, bfp, pnp)
 *  - "hotline" only when paired with emergency/crisis keywords
 *  - "tulong/tulungan" excluded — too generic, appears in all bot responses
 */
export const EMERGENCY_PATTERNS = [
  // English — physical emergencies
  /\bemergency\b/i,
  /\bfire\b/i,
  /\bflood\b/i,
  /\baccident\b/i,
  /\bambulance\b/i,
  /\brescue\b/i,
  /\bcrime\b/i,
  /\bburglar(y)?\b/i,
  /\bshooting\b/i,
  /\bmedical\s*(emergency|help|attention)\b/i,

  // Filipino — physical emergencies
  /\bsunog\b/i,
  /\bbaha\b/i,
  /\baksidente\b/i,
  /\bsaklolo\b/i,       // "help me!" distress cry — specific enough
  /\blikas(an)?\b/i,    // evacuation

  // Agency references — only valid in an emergency context
  /\bmdrrmo\b/i,        // disaster risk office — inherently emergency
  /\bbfp\b/i,           // bureau of fire — inherently emergency
  /\bpnp\b.*(\btulong\b|\bsaklolo\b|\bemergency\b)/i, // PNP only with distress
  /\bpulis\b.*(\btulong\b|\bsaklolo\b|\bemergency\b)/i, // same for "pulis"

  // Hotline only when paired with emergency/crisis context
  /emergency\s*(number|hotline|contact)/i,
  /hotline\b.*(sunog|baha|aksidente|emergency|rescue|saklolo)/i,

  // Explicit call-for-help phrases
  /\btawagin\b.*(\bambulance\b|\bbombero\b|\bpulis\b|\bmdrrmo\b)/i,
  /\bcall\b.*(police|ambulance|fire\s*department|rescue)/i,
];

/**
 * Detects intents with priority logic:
 *
 * - TRACK and FILE are detected independently.
 * - EMERGENCY is only added when NO complaint intents (track/file) are present.
 *   This prevents emergency buttons from appearing on complaint-related FAQ
 *   responses that happen to contain broad words like "hotline" or "tulungan".
 * - If both complaint and emergency patterns match, we assume the bot is giving
 *   complaint procedure advice, not reporting a real emergency.
 */
export function detectIntents(text: string): ActionIntent[] {
  const intents: ActionIntent[] = [];

  const hasTrack = TRACK_PATTERNS.some((p) => p.test(text));
  const hasFile = FILE_PATTERNS.some((p) => p.test(text));
  const hasEmergency = EMERGENCY_PATTERNS.some((p) => p.test(text));

  if (hasTrack) intents.push('track');
  if (hasFile) intents.push('file');

  // Only add emergency if there are NO complaint-related intents.
  // A response about filing/tracking a complaint should never show
  // the emergency button even if it mentions agencies or hotlines.
  if (hasEmergency && !hasTrack && !hasFile) {
    intents.push('emergency');
  }

  return intents;
}

export type TextRun =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'url'; value: string };

export const RICH_REGEX = /\*\*(.+?)\*\*|\*(.+?)\*|https?:\/\/[^\s<>"')\]]+/g;