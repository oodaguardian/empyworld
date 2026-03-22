import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CHANNELS, fetchVideos } from '../services/youtube';
import VideoPlayerModal from './VideoPlayerModal';
import useVoiceSearch from '../hooks/useVoiceSearch';

function SkeletonCard({ isShort }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-purple-500/20" style={{ background: '#1A1535' }}>
      <div
        className="w-full"
        style={{
          paddingTop: isShort ? '177%' : '56.25%',
          background: 'linear-gradient(90deg, #1A1535 25%, #231D45 50%, #1A1535 75%)',
          backgroundSize: '200% 100%',
          animation: 'skeletonWave 1.5s infinite',
        }}
      />
      <div className="p-3 space-y-2">
        <div className="h-3 rounded-full w-4/5" style={{ background: 'linear-gradient(90deg, #231D45 25%, rgba(155,93,229,0.2) 50%, #231D45 75%)', backgroundSize: '200% 100%', animation: 'skeletonWave 1.5s infinite' }} />
        <div className="h-3 rounded-full w-3/5" style={{ background: 'linear-gradient(90deg, #231D45 25%, rgba(155,93,229,0.2) 50%, #231D45 75%)', backgroundSize: '200% 100%', animation: 'skeletonWave 1.5s infinite' }} />
      </div>
    </div>
  );
}

function VideoCard({ video, onPlay }) {
  const isShort = video.isShort;
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(155,93,229,0.3)' }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onPlay(video)}
      className="rounded-2xl overflow-hidden cursor-pointer border border-purple-500/30 transition-shadow"
      style={{ background: '#1A1535' }}
    >
      <div className="relative w-full" style={{ paddingTop: isShort ? '177%' : '56.25%' }}>
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Shorts badge */}
        {isShort && (
          <div className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
            ⚡ Short
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/35 transition-colors group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-empy-pink rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-lg shadow-empy-pink/50">
            <span className="text-white text-base sm:text-lg ml-0.5">▶</span>
          </div>
        </div>
      </div>
      <div className="p-2 sm:p-3">
        <p className="text-white font-body text-xs sm:text-sm font-bold leading-tight line-clamp-2">
          {video.title}
        </p>
        <div className="flex items-center gap-1 mt-1 text-[10px] sm:text-xs text-purple-300/70 font-semibold">
          <span className="truncate">{video.channel}</span>
          {video.publishedAt && (
            <>
              <span className="opacity-40">•</span>
              <span className="flex-shrink-0">{video.publishedAt}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CreatorPicker({ creators, activeCreator, onSelect }) {
  if (!creators || creators.length <= 1) return null;
  return (
    <div className="flex-shrink-0 px-2 sm:px-3">
      <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-hide">
        {/* "All" option */}
        <button
          onClick={() => onSelect(null)}
          className={`flex-shrink-0 text-[9px] sm:text-[10px] font-extrabold px-2.5 py-1 rounded-full border transition-all ${
            !activeCreator
              ? 'bg-empy-pink/20 border-empy-pink text-empy-pink'
              : 'bg-transparent border-purple-500/30 text-purple-300/60 hover:border-purple-400/50'
          }`}
        >
          All
        </button>
        {creators.map((c) => (
          <button
            key={c.name}
            onClick={() => onSelect(c)}
            className={`flex-shrink-0 text-[9px] sm:text-[10px] font-extrabold px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${
              activeCreator?.name === c.name
                ? 'bg-empy-pink/20 border-empy-pink text-empy-pink'
                : 'bg-transparent border-purple-500/30 text-purple-300/60 hover:border-purple-400/50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function VideoCenter() {
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0]);
  const [activeCreator, setActiveCreator] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [playerVideo, setPlayerVideo] = useState(null);
  const channelScrollRef = useRef(null);
  const inputRef = useRef(null);

  const { isListening, status: voiceStatus, transcript, toggle: toggleVoice, supported: voiceSupported } = useVoiceSearch();

  // Debounce timer for typed searches — prevents rapid-fire API calls
  const searchTimerRef = useRef(null);

  const loadVideos = useCallback(async (channel, query = null, creator = null) => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchVideos(channel, query, { creator });
      setVideos(items);
    } catch (err) {
      setError(err.message);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos(activeChannel, null, activeCreator);
  }, [activeChannel, activeCreator, loadVideos]);

  // Voice transcript -> search
  useEffect(() => {
    if (transcript && !isListening) {
      setSearchQuery(transcript);
      loadVideos(activeChannel, transcript);
    }
  }, [transcript, isListening, activeChannel, loadVideos]);

  const handleSearch = useCallback(() => {
    const q = searchQuery.trim();
    if (!q) return;
    clearTimeout(searchTimerRef.current);
    setActiveCreator(null);
    loadVideos(activeChannel, q);
  }, [searchQuery, activeChannel, loadVideos]);

  // Debounced live-search as user types (800ms delay)
  const handleSearchInputChange = useCallback((value) => {
    setSearchQuery(value);
    clearTimeout(searchTimerRef.current);
    const q = value.trim();
    if (q.length >= 3) {
      searchTimerRef.current = setTimeout(() => {
        setActiveCreator(null);
        loadVideos(activeChannel, q);
      }, 800);
    }
  }, [activeChannel, loadVideos]);

  const handleChannelClick = useCallback((ch) => {
    setActiveChannel(ch);
    setActiveCreator(null);
    setSearchQuery('');
  }, []);

  const handleCreatorSelect = useCallback((creator) => {
    setActiveCreator(creator);
    setSearchQuery('');
  }, []);

  const isShorts = activeChannel.isShorts;

  const sectionTitle = searchQuery.trim()
    ? `Results for "${searchQuery}"`
    : activeCreator
    ? activeCreator.name
    : activeChannel.label;

  const sectionPill = searchQuery.trim()
    ? '🔍 Search'
    : isShorts
    ? '⚡ Shorts'
    : `${activeChannel.emoji} Channel`;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* ── Search Bar ── */}
      <div className="flex-shrink-0 px-2 sm:px-3 pt-2 pb-1">
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1 sm:py-1.5 border-2 border-purple-500/60 focus-within:border-empy-pink focus-within:shadow-[0_0_0_3px_rgba(255,111,184,0.2)] transition-all" style={{ background: '#231D45' }}>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for videos... 🔍"
            className="flex-1 bg-transparent border-none outline-none text-white font-body text-xs sm:text-sm font-semibold placeholder-purple-300/50 min-w-0"
            maxLength={120}
          />

          {voiceSupported && (
            <button
              onClick={toggleVoice}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm flex-shrink-0 border-2 transition-all ${
                isListening
                  ? 'border-empy-pink bg-empy-pink/30 animate-pulse'
                  : 'border-empy-pink/50 bg-transparent hover:bg-empy-pink/20'
              }`}
              title="Voice Search"
              aria-label="Voice search"
            >
              🎤
            </button>
          )}

          <button
            onClick={handleSearch}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm flex-shrink-0 bg-purple-600 hover:bg-empy-pink transition-colors"
            title="Search"
            aria-label="Search videos"
          >
            🔍
          </button>
        </div>

        {/* Voice status */}
        <AnimatePresence>
          {voiceStatus && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-empy-pink font-body text-[10px] sm:text-xs text-center font-bold mt-1"
            >
              {voiceStatus}
            </motion.p>
          )}
        </AnimatePresence>

        <p className="text-center text-[9px] sm:text-[10px] text-purple-300/50 font-semibold mt-0.5">
          🛡️ SafeSearch ON · Kids Mode
        </p>
      </div>

      {/* ── Channel Tabs (horizontal scroll) ── */}
      <div className="flex-shrink-0 px-1" ref={channelScrollRef}>
        <div className="flex gap-2 overflow-x-auto py-1.5 px-1 scrollbar-hide">
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => handleChannelClick(ch)}
              className={`flex-shrink-0 flex flex-col items-center gap-0.5 transition-transform hover:-translate-y-0.5 ${
                activeChannel.id === ch.id ? '' : 'opacity-70'
              }`}
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl border-2 transition-all ${
                  activeChannel.id === ch.id
                    ? 'border-empy-pink shadow-[0_0_12px_rgba(255,111,184,0.5)]'
                    : 'border-transparent'
                }`}
                style={{ background: '#231D45' }}
              >
                {ch.emoji}
              </div>
              <span
                className={`text-[8px] sm:text-[9px] font-extrabold text-center leading-tight max-w-[56px] truncate ${
                  activeChannel.id === ch.id ? 'text-empy-pink' : 'text-purple-300/60'
                }`}
              >
                {ch.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Creator / Sub-Channel Picker ── */}
      <CreatorPicker
        creators={activeChannel.creators}
        activeCreator={activeCreator}
        onSelect={handleCreatorSelect}
      />

      {/* ── Section Header ── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1">
        <span className="font-display text-white text-xs sm:text-sm truncate">{sectionTitle}</span>
        <span className="text-[9px] sm:text-[10px] font-extrabold text-empy-pink bg-empy-pink/15 border border-empy-pink/40 px-2 py-0.5 rounded-full flex-shrink-0">
          {sectionPill}
        </span>
      </div>

      {/* ── Video Grid (scrollable) ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-3 pb-2">
        {loading ? (
          <div className={`grid gap-2 sm:gap-3 ${
            isShorts
              ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5'
              : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3'
          }`}>
            {Array.from({ length: isShorts ? 15 : 12 }).map((_, i) => (
              <SkeletonCard key={i} isShort={isShorts} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-6">
            <span className="text-4xl">⚠️</span>
            <p className="text-white font-bold text-sm">{error}</p>
            <p className="text-purple-300/50 text-xs">Check your API key or try again</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-6">
            <span className="text-4xl">🔍</span>
            <p className="text-white font-bold text-sm">No videos found</p>
            <p className="text-purple-300/50 text-xs">Try another search or channel!</p>
          </div>
        ) : (
          <div className={`grid gap-2 sm:gap-3 ${
            isShorts
              ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5'
              : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3'
          }`}>
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} onPlay={setPlayerVideo} />
            ))}
          </div>
        )}
      </div>

      {/* ── Video Player Modal ── */}
      {playerVideo && (
        <VideoPlayerModal
          videoId={playerVideo.id}
          title={playerVideo.title}
          onClose={() => setPlayerVideo(null)}
        />
      )}
    </div>
  );
}
