export const DEEPLINKS = {
  poki_kids:     'https://poki.com/en/g/kids',
  poki_girls:    'https://poki.com/en/g/girls',
  poki_puzzles:  'https://poki.com/en/g/puzzle',
  poki_racing:   'https://poki.com/en/g/car',
  poki_dress:    'https://poki.com/en/g/dress-up',
  poki_memory:   'https://poki.com/en/g/memory',
  poki_coloring: 'https://poki.com/en/g/drawing-coloring',
  poki_animals:  'https://poki.com/en/g/animals',
  poki_edu:      'https://poki.com/en/g/educational',
  crazy_kids:    'https://www.crazygames.com/c/kids',
  scratch_home:  'https://scratch.mit.edu/explore/projects/games/?q=preschool',
};

export const GAME_POKI_MAP = {
  coloring:  DEEPLINKS.poki_coloring,
  memory:    DEEPLINKS.poki_memory,
  bubble:    DEEPLINKS.poki_kids,
  racing:    DEEPLINKS.poki_racing,
  dressup:   DEEPLINKS.poki_dress,
  abc:       DEEPLINKS.poki_edu,
  numbers:   DEEPLINKS.poki_edu,
  colors:    DEEPLINKS.poki_edu,
  shapes:    DEEPLINKS.poki_edu,
  animals:   DEEPLINKS.poki_animals,
  puzzle:    DEEPLINKS.poki_puzzles,
};

// Whitelisted domains for SafeWebView
export const SAFE_DOMAINS = [
  'poki.com',
  'scratch.mit.edu',
  'educandy.com',
  'youtube.com',
  'openlibrary.org',
  'gutenberg.org',
];
