// Web address for a person or publisher page made from their name: lower case, hyphens for spaces.
// Sinhala letters stay as they are; the Cf class keeps the invisible joiner many Sinhala letters contain.
export const slugFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{M}\p{N}\p{Cf}-]/gu, '');
