export const NAME_CORRECTIONS: Record<string, string> = {
  'Ada': 'Adia',
};

export function displayName(name: string): string {
  return NAME_CORRECTIONS[name] ?? name;
}