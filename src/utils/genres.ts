export interface GenreInfo {
  slug: string;
  name: string;
  description: string;
  icon: string;
}

export const GENRE_MAP: Record<string, GenreInfo> = {
  'crime': {
    slug: 'crime',
    name: 'අපරාධ පරීක්ෂණ',
    description: 'රහස් පරීක්ෂකයන්, අපරාධකරුවන් සහ ත්‍රාසජනක ගවේෂණ වටා ගෙතුණු නවකතා.',
    icon: '🔍',
  },
  'thriller': {
    slug: 'thriller',
    name: 'ත්‍රාසජනක',
    description: 'හදවත ගැහෙන ත්‍රාසය, ත්‍රාසජනක හැරවුම් සහ ත්‍රාසය දනවන අත්දැකීම්.',
    icon: '⚡',
  },
  'mystery': {
    slug: 'mystery',
    name: 'අබිරහස්',
    description: 'නොවිසඳුණු රහස්, අද්භූත සිදුවීම් සහ සැඟවුණු සත්‍යයන් හෙළිකරන කතා.',
    icon: '🔮',
  },
  'romance': {
    slug: 'romance',
    name: 'ආදර කතා',
    description: 'ආදරය, සංවේගය, බැඳීම් සහ ජීවිතයේ හැඟීම්බර අවස්ථා.',
    icon: '❤️',
  },
  'fantasy': {
    slug: 'fantasy',
    name: 'ෆැන්ටසි',
    description: 'මායාකාරී ලෝකයන්, අද්භූත සත්වයින් සහ මනඃකල්පිත වික්‍රමයන්.',
    icon: '✨',
  },
  'drama': {
    slug: 'drama',
    name: 'නාට්‍යමය',
    description: 'සමාජ ගැටුම්, මානව සබඳතා සහ ගැඹුරු ජීවන අත්දැකීම්.',
    icon: '🎭',
  },
};

export function getGenreSlug(genreName: string): string {
  const entry = Object.entries(GENRE_MAP).find(([_, g]) => g.name === genreName);
  return entry ? entry[0] : encodeURIComponent(genreName.toLowerCase());
}

export function getGenreName(slug: string): string {
  return GENRE_MAP[slug]?.name || decodeURIComponent(slug);
}
