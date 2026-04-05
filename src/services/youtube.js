const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const BASE = 'https://www.googleapis.com/youtube/v3';

const SAFE_PARAMS = {
  safeSearch: 'strict',
  videoEmbeddable: 'true',
  videoSyndicated: 'true',
  type: 'video',
  relevanceLanguage: 'en',
  regionCode: 'US',
};

// ══════════════════════════════════════════════
//  QUOTA-AWARE CACHE  (Production key)
//  search.list = 100 units per call, 10,000 units/day
//  Aggressive caching strategy:
//    - 24-hour localStorage TTL (channels + searches)
//    - In-memory dedup for in-flight requests
//    - Daily quota tracker to avoid 403s
// ══════════════════════════════════════════════
const CACHE_TTL_MS  = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_PREFIX  = 'yt_cache_';
const QUOTA_KEY     = 'yt_quota';
const DAILY_LIMIT   = 10_000;
const COST_PER_SEARCH = 100;

// --- In-flight dedup: if the same key is already fetching, reuse the promise ---
const _inflight = new Map();

// --- Quota tracker: resets each calendar day ---
function _getQuota() {
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    if (!raw) return { day: '', used: 0 };
    return JSON.parse(raw);
  } catch { return { day: '', used: 0 }; }
}
function _bumpQuota() {
  const today = new Date().toISOString().slice(0, 10);
  const q = _getQuota();
  const used = q.day === today ? q.used + COST_PER_SEARCH : COST_PER_SEARCH;
  try { localStorage.setItem(QUOTA_KEY, JSON.stringify({ day: today, used })); } catch {}
  return used;
}
function quotaRemaining() {
  const today = new Date().toISOString().slice(0, 10);
  const q = _getQuota();
  return q.day === today ? DAILY_LIMIT - q.used : DAILY_LIMIT;
}

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) { localStorage.removeItem(CACHE_PREFIX + key); return null; }
    return data;
  } catch { return null; }
}

function cacheSet(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Storage full — evict oldest yt_cache entries and retry once
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(CACHE_PREFIX)) {
          const { ts } = JSON.parse(localStorage.getItem(k));
          keys.push({ k, ts });
        }
      }
      keys.sort((a, b) => a.ts - b.ts);
      // Remove oldest quarter
      keys.slice(0, Math.max(1, Math.ceil(keys.length / 4))).forEach(({ k }) => localStorage.removeItem(k));
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data }));
    } catch { /* truly full — give up */ }
  }
}

// ══════════════════════════════════════════════
//  CHANNELS — each can have multiple creators
//  `creators` is an array of { name, channelId }
//  If a channel has only one official source, creators can be omitted
//  and `channelId` / `isSearch` + `query` used directly.
// ══════════════════════════════════════════════

export const CHANNELS = [
  // ── For You (curated search) ──
  {
    id: 'home',
    label: 'For You',
    emoji: '🌈',
    color: '#FF6FB8',
    query: 'kids shows girls preschool 2025',
    isSearch: true,
  },

  // ── KPop Demon Hunters ──
  {
    id: 'kpop-dh',
    label: 'KPop Demon Hunters',
    emoji: '🎤',
    color: '#9B5DE5',
    creators: [
      { name: 'Sony Pictures Animation', channelId: 'UCzWQYUVCpZqtN93H8RR44Qw' },
      { name: 'Netflix After School', channelId: 'UCBBssRkMOC3fUDGmuR_6Z4g' },
    ],
  },

  // ── PAW Patrol ──
  {
    id: 'pawpatrol',
    label: 'PAW Patrol',
    emoji: '🐾',
    color: '#FF6B6B',
    creators: [
      { name: 'PAW Patrol Official', channelId: 'UCSVSJ1OCSv5ClFgKFTHIDew' },
      { name: 'Nick Jr.', channelId: 'UC5partmrCpLpOsWGpQgLdlg' },
    ],
  },

  // ── Peppa Pig ──
  {
    id: 'peppa',
    label: 'Peppa Pig',
    emoji: '🐷',
    color: '#FF69B4',
    creators: [
      { name: 'Peppa Pig Official', channelId: 'UCAOtE1V7Ots4DjM8JLlrYgg' },
      { name: 'Peppa Pig Surprise', channelId: 'UCmjrp2KKXD-U2JaDl3clZg' },
    ],
  },

  // ── Bluey ──
  {
    id: 'bluey',
    label: 'Bluey',
    emoji: '🐶',
    color: '#4CC9F0',
    creators: [
      { name: 'Bluey Official', channelId: 'UCVgO39Bk5sMo66-6o6Spn6Q' },
      { name: 'Disney Junior', channelId: 'UCgwv23FVv3lqh567yagXfNg' },
    ],
  },

  // ── CoComelon ──
  {
    id: 'cocomelon',
    label: 'CoComelon',
    emoji: '🎵',
    color: '#FFE566',
    creators: [
      { name: 'CoComelon', channelId: 'UCbCmjCuTUZos6Inko4u57UQ' },
      { name: 'CoComelon Animal Time', channelId: 'UCkMqHsDREV6kiKxtbpAG47Q' },
      { name: 'CoComelon Español', channelId: 'UCGGrrasLfn-g68Jy_MpAqOg' },
    ],
  },

  // ── Hello Kitty ──
  {
    id: 'hellokitty',
    label: 'Hello Kitty',
    emoji: '🎀',
    color: '#FF6FB8',
    creators: [
      { name: 'Hello Kitty & Friends', channelId: 'UCyMy3i5mSbOFLOJ7rFiSHOA' },
      { name: 'Sanrio', query: 'Sanrio Hello Kitty official kids', isSearch: true },
    ],
  },

  // ── Barbie ──
  {
    id: 'barbie',
    label: 'Barbie',
    emoji: '💖',
    color: '#FF1493',
    creators: [
      { name: 'Barbie', channelId: 'UCHfpBXUJXwMBX1I7xsDE_gA' },
      { name: 'Barbie Dreamhouse', query: 'Barbie Dreamhouse Adventures full episodes kids', isSearch: true },
      { name: 'Come On Barbie', query: 'Barbie life in the dreamhouse official', isSearch: true },
    ],
  },

  // ── Disney Jr ──
  {
    id: 'disneyjr',
    label: 'Disney Jr',
    emoji: '🏰',
    color: '#9B5DE5',
    creators: [
      { name: 'Disney Junior', channelId: 'UCgwv23FVv3lqh567yagXfNg' },
      { name: 'Disney Channel', channelId: 'UCN3UjBMkMGBbMPf8u2LsxzA' },
      { name: 'Disney Princess', channelId: 'UC0sHUbBbT3gAqLJ5X4ZWPQg' },
    ],
  },

  // ── Blippi ──
  {
    id: 'blippi',
    label: 'Blippi',
    emoji: '🚜',
    color: '#00F5D4',
    creators: [
      { name: 'Blippi', channelId: 'UC5PYHgAzJ1wLEidB58SK6Xw' },
      { name: 'Blippi Wonders', channelId: 'UCX6SBCrqMHFhJCCe9MVjq0Q' },
      { name: 'Meekah - Blippi', channelId: 'UC9L2o_SITvgFCsBBMKG5TVQ' },
    ],
  },

  // ── Sesame Street ──
  {
    id: 'sesame',
    label: 'Sesame Street',
    emoji: '🧸',
    color: '#36D399',
    creators: [
      { name: 'Sesame Street', channelId: 'UCx-KWLTKlB83hDI6UKECtJQ' },
    ],
  },

  // ── Daniel Tiger ──
  {
    id: 'danieltiger',
    label: 'Daniel Tiger',
    emoji: '🐯',
    color: '#FF8C42',
    creators: [
      { name: 'Daniel Tiger Official', channelId: 'UCUIzbAjFgtNtcgheLbh1okA' },
      { name: 'PBS KIDS', channelId: 'UCYvFEwMJhPuyqgmTxINaDaA' },
    ],
  },

  // ── Super Simple Songs ──
  {
    id: 'supersimple',
    label: 'Super Simple',
    emoji: '🌻',
    color: '#FFD93D',
    creators: [
      { name: 'Super Simple Songs', channelId: 'UCLsooMJoIpl_7ux2jvdPB-Q' },
      { name: 'Super Simple Play', channelId: 'UCTFGh5GMBIjMBgDPI7gBP_Q' },
    ],
  },

  // ══════════════════════════════════════════
  //  🎶 KID-FRIENDLY MUSIC
  // ══════════════════════════════════════════

  {
    id: 'music-nursery',
    label: 'Nursery Rhymes',
    emoji: '🎶',
    color: '#F472B6',
    creators: [
      { name: 'Little Baby Bum', channelId: 'UCGhBfrMo-2sOLsEzdEBSCig' },
      { name: 'Dave and Ava', channelId: 'UC3YS3KnNMRBxSXZMPdrAhyA' },
      { name: 'BabyBus', channelId: 'UCpYye8D5fFMUPf9nSHgTtPw' },
      { name: 'Bounce Patrol Kids', channelId: 'UCpGSMFOCYmrR0TNrMRkOL4g' },
    ],
  },
  {
    id: 'music-dance',
    label: 'Dance & Move',
    emoji: '💃',
    color: '#C084FC',
    creators: [
      { name: 'GoNoodle', channelId: 'UC2YBT7HYqCbbvzu3kKZ3wnw' },
      { name: 'Kidz Bop', channelId: 'UCY75VD6jMIZPhnTD65v7gSg' },
      { name: 'Just Dance Kids', query: 'Just Dance Kids official songs', isSearch: true },
      { name: 'Pinkfong', channelId: 'UCcdwLMPsaU2ezNSJU1nFoBQ' },
    ],
  },
  {
    id: 'music-lullaby',
    label: 'Lullabies',
    emoji: '🌙',
    color: '#818CF8',
    creators: [
      { name: 'Baby Relax Channel', query: 'baby lullaby music sleep relaxing', isSearch: true },
      { name: 'Stardust Vibes', query: 'lullaby bedtime music kids calm', isSearch: true },
      { name: 'Rockabye Baby!', query: 'Rockabye Baby lullaby renditions kids', isSearch: true },
    ],
  },
  {
    id: 'music-singalong',
    label: 'Sing Along',
    emoji: '🎤',
    color: '#FB923C',
    creators: [
      { name: 'The Wiggles', channelId: 'UCdS-OiJWJJR0EXMG-znz-cQ' },
      { name: "Gracie's Corner", channelId: 'UCWxB20FQ5y7jMHmBsxsgtGQ' },
      { name: 'Ms Rachel', channelId: 'UCFn_fGGDt-9D1L_QTBQ_HJw' },
      { name: 'Mother Goose Club', channelId: 'UC3MkvhPMCRj3JHUfnJRKGiQ' },
    ],
  },

  // ── YouTube Shorts ──
  {
    id: 'shorts',
    label: 'Shorts',
    emoji: '⚡',
    color: '#FF0050',
    isShorts: true,
    query: 'kids cartoon funny shorts',
  },
];

// ══════════════════════════════════════════════
//  FETCH VIDEOS
// ══════════════════════════════════════════════
export async function fetchVideos(channel, searchQuery = null, { creator = null } = {}) {
  if (!API_KEY) {
    throw new Error('YouTube API key not configured. Add VITE_YOUTUBE_API_KEY to .env.local');
  }

  const params = new URLSearchParams({
    part: 'snippet',
    maxResults: '50',          // Production key — show lots of content
    key: API_KEY,
    ...SAFE_PARAMS,
  });

  if (searchQuery) {
    params.set('q', searchQuery + ' kids safe');
  } else if (creator) {
    if (creator.isSearch || !creator.channelId) {
      params.set('q', creator.query || creator.name + ' kids');
    } else {
      params.set('channelId', creator.channelId);
    }
  } else if (channel.isShorts) {
    params.set('q', channel.query + ' #shorts');
    params.set('videoDuration', 'short');
  } else if (channel.isSearch) {
    params.set('q', channel.query);
  } else if (channel.creators && channel.creators.length > 0) {
    const first = channel.creators[0];
    if (first.isSearch || !first.channelId) {
      params.set('q', first.query || first.name + ' kids');
    } else {
      params.set('channelId', first.channelId);
    }
  } else if (channel.channelId) {
    params.set('channelId', channel.channelId);
  }

  // Cache key — now includes user searches (kids repeat the same queries)
  const cacheKey = searchQuery
    ? `search_${searchQuery.toLowerCase().trim()}`
    : `${channel.id}_${creator?.channelId ?? creator?.name ?? 'default'}`;

  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  // Dedup in-flight requests — avoids storming the API on rapid re-renders
  if (_inflight.has(cacheKey)) return _inflight.get(cacheKey);

  // Guard quota
  if (quotaRemaining() < COST_PER_SEARCH) {
    throw new Error('Daily YouTube quota nearly exhausted — results served from cache only. Try again tomorrow!');
  }

  const promise = (async () => {
    try {
      const url = `${BASE}/search?${params}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      _bumpQuota();

      const items = (data.items || []).map((item) => ({
        id: item.id?.videoId || item.id,
        title: item.snippet?.title || 'Video',
        thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
        channel: item.snippet?.channelTitle || '',
        publishedAt: item.snippet?.publishedAt
          ? new Date(item.snippet.publishedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : '',
        isShort: channel.isShorts || false,
      }));

      cacheSet(cacheKey, items);
      return items;
    } finally {
      _inflight.delete(cacheKey);
    }
  })();

  _inflight.set(cacheKey, promise);
  return promise;
}

// ══════════════════════════════════════════════
//  FETCH SHORTS specifically
// ══════════════════════════════════════════════
export async function fetchShorts(query = 'kids cartoon funny') {
  if (!API_KEY) {
    throw new Error('YouTube API key not configured.');
  }

  const cacheKey = `shorts_${query}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  if (_inflight.has(cacheKey)) return _inflight.get(cacheKey);

  if (quotaRemaining() < COST_PER_SEARCH) {
    throw new Error('Daily YouTube quota nearly exhausted — try again tomorrow!');
  }

  const promise = (async () => {
    try {
      const params = new URLSearchParams({
        part: 'snippet',
        maxResults: '50',
        key: API_KEY,
        safeSearch: 'strict',
        videoEmbeddable: 'true',
        type: 'video',
        videoDuration: 'short',
        relevanceLanguage: 'en',
        regionCode: 'US',
        q: query + ' #shorts kids',
      });

      const url = `${BASE}/search?${params}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      _bumpQuota();

      const items = (data.items || []).map((item) => ({
        id: item.id?.videoId || item.id,
        title: item.snippet?.title || 'Short',
        thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
        channel: item.snippet?.channelTitle || '',
        publishedAt: item.snippet?.publishedAt
          ? new Date(item.snippet.publishedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : '',
        isShort: true,
      }));

      cacheSet(cacheKey, items);
      return items;
    } finally {
      _inflight.delete(cacheKey);
    }
  })();

  _inflight.set(cacheKey, promise);
  return promise;
}
