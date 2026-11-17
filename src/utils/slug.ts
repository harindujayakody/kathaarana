// Web address for a person or publisher page made from their name: lower case, hyphens for spaces.
// Sinhala letters stay as they are; the Cf class keeps the invisible joiner many Sinhala letters contain.
export const slugFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{M}\p{N}\p{Cf}-]/gu, '');

// Address for a book list (/books/author|publisher|genre/<this>/): the English part of the name when it
// has one ("බිසෝ ප්‍රකාශන - Biso Prakashana" -> "biso-prakashana"), otherwise the Sinhala name.
export const listSlug = (name: string) =>
  /[a-z]/i.test(name)
    ? name
        .replace(/[^a-z0-9]+/gi, ' ')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
    : slugFromName(name);
