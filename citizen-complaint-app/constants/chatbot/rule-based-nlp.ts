
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


export const EMERGENCY_PATTERNS = [
  /emergency/i, /fire\b/i, /flood/i, /accident/i, /ambulance/i,
  /police/i, /rescue/i, /crime/i, /burglar/i, /shooting/i,
  /sunog/i, /baha/i, /aksidente/i, /tulungan/i, /saklolo/i,
  /pulis/i, /pnp/i, /bfp/i, /mdrrmo/i, /hotline/i,
  /emergency\s*number/i, /emergency\s*contact/i, /tawagin.*tulong/i,
];

export function detectIntents(text: string): ActionIntent[] {
  const intents: ActionIntent[] = [];
  if (TRACK_PATTERNS.some((p) => p.test(text))) intents.push('track');
  if (FILE_PATTERNS.some((p) => p.test(text))) intents.push('file');
  if (EMERGENCY_PATTERNS.some((p) => p.test(text))) intents.push('emergency');
  return intents;
}

export type TextRun =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'url'; value: string };

export const RICH_REGEX = /\*\*(.+?)\*\*|https?:\/\/[^\s<>"')\]]+/g;
