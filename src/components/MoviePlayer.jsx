import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getVideoSourceCandidates } from '../services/bunny';
import logo from '../emplogo.png';

function getFileExt(path = '') {
  const clean = String(path || '').split('?')[0];
  const i = clean.lastIndexOf('.');
  return i >= 0 ? clean.slice(i).toLowerCase() : '';
}

export default function MoviePlayer({ movie, onClose }) {
  if (!movie) return null;

  const sources = useMemo(() => getVideoSourceCandidates(movie.filename), [movie.filename]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [errorInfo, setErrorInfo] = useState(null);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    setSourceIndex(0);
    setErrorInfo(null);
    setAttempts([]);
  }, [movie?.filename]);

  const activeSource = sources[sourceIndex];

  const probeUrl = async (url) => {
    // Only probe same-origin URLs to avoid noisy CORS errors in diagnostics.
    if (!url || !url.startsWith('/')) {
      return { ok: false, status: 0, note: 'cross-origin probe skipped' };
    }

    try {
      const head = await fetch(url, { method: 'HEAD' });
      return { ok: head.ok, status: head.status };
    } catch {
      try {
        const get = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-1' } });
        return { ok: get.ok, status: get.status };
      } catch (probeErr) {
        return { ok: false, status: 0, note: probeErr?.message || 'probe failed' };
      }
    }
  };

  const onVideoError = async (event) => {
    const mediaError = event?.currentTarget?.error;
    const codeMap = {
      1: 'aborted',
      2: 'network',
      3: 'decode',
      4: 'src-not-supported',
    };

    const probe = activeSource ? await probeUrl(activeSource.url) : { ok: false, status: 0 };
    const detail = {
      source: activeSource,
      code: mediaError?.code || null,
      reason: mediaError?.code ? codeMap[mediaError.code] || 'unknown' : 'unknown',
      status: probe.status,
      note: probe.note || '',
    };

    setAttempts((prev) => [...prev, detail]);
    setErrorInfo(detail);
    setSourceIndex((idx) => (idx + 1 < sources.length ? idx + 1 : idx));
  };

  const fileExt = getFileExt(movie?.filename);
  const isPotentiallyUnsupported = fileExt === '.mkv' || fileExt === '.avi';

  return (
    <AnimatePresence>
      <motion.div
        key="movie-player"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: '#0a0614' }}
      >
        {/* ── Pink/Blue top accent bar ─────────────────────────── */}
        <div className="h-1 flex-shrink-0 bg-gradient-to-r from-[#4A90D9] via-[#9B5DE5] to-[#FF69B4]" />

        {/* ── Header ───────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0d0b2a 0%, #1a0d2e 100%)', borderBottom: '1px solid rgba(74,144,217,0.25)' }}
        >
          {/* Logo + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-full blur-md opacity-60"
                style={{ background: 'linear-gradient(135deg, #4A90D9, #FF69B4)' }} />
              <img
                src={logo}
                alt="Empy TV"
                className="relative h-9 w-9 rounded-full object-cover border-2"
                style={{ borderColor: '#FF69B4' }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-display tracking-widest uppercase"
                style={{ color: '#4A90D9' }}>
                Empy TV Movies
              </p>
              <h2 className="text-white font-display text-sm sm:text-lg leading-tight truncate max-w-[60vw]">
                {movie.title}
              </h2>
            </div>
          </div>

          {/* Close */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-white text-lg font-bold transition-all"
            style={{
              background: 'rgba(255,105,180,0.15)',
              border: '1px solid rgba(255,105,180,0.4)',
            }}
          >
            ✕
          </motion.button>
        </div>

        {/* ── Player area ──────────────────────────────────────── */}
        <div className="flex-1 relative overflow-hidden">
          {/* Corner accent lines */}
          <div className="absolute top-0 left-0 w-40 h-0.5 z-10"
            style={{ background: 'linear-gradient(to right, #4A90D9, transparent)' }} />
          <div className="absolute top-0 right-0 w-40 h-0.5 z-10"
            style={{ background: 'linear-gradient(to left, #FF69B4, transparent)' }} />
          <div className="absolute bottom-0 left-0 w-40 h-0.5 z-10"
            style={{ background: 'linear-gradient(to right, #4A90D9, transparent)' }} />
          <div className="absolute bottom-0 right-0 w-40 h-0.5 z-10"
            style={{ background: 'linear-gradient(to left, #FF69B4, transparent)' }} />

          <video
            src={activeSource?.url}
            className="w-full h-full"
            controls
            autoPlay
            playsInline
            preload="metadata"
            title={movie.title}
            style={{ background: '#000' }}
            onLoadedData={() => setErrorInfo(null)}
            onError={onVideoError}
          />

          {isPotentiallyUnsupported && (
            <div
              className="absolute top-3 left-3 right-3 rounded-xl px-3 py-2 text-xs"
              style={{
                background: 'rgba(12, 8, 22, 0.82)',
                border: '1px solid rgba(74, 144, 217, 0.45)',
                color: '#dbeafe',
              }}
            >
              This file is {fileExt}. Browser support depends on codec. If it fails, convert to MP4 (H.264/AAC) for widest playback compatibility.
            </div>
          )}

          {errorInfo && (
            <div
              className="absolute left-3 right-3 bottom-3 rounded-xl p-3 text-xs"
              style={{
                background: 'rgba(10, 6, 20, 0.85)',
                border: '1px solid rgba(255, 105, 180, 0.45)',
                color: '#fff',
              }}
            >
              <p className="font-display text-[11px] mb-1" style={{ color: '#FF9BCF' }}>
                Playback diagnostic
              </p>
              <p className="font-body text-[11px] opacity-90">
                Current source: {activeSource?.kind || 'unknown'} {activeSource?.path ? `(${activeSource.path})` : ''}
              </p>
              <p className="font-body text-[11px] opacity-90 break-all">
                URL: {errorInfo.source?.url || 'unknown'}
              </p>
              <p className="font-body text-[11px] opacity-90">
                MediaError: {errorInfo.reason}{errorInfo.code ? ` (${errorInfo.code})` : ''}
                {errorInfo.status ? ` | HTTP probe: ${errorInfo.status}` : ''}
                {errorInfo.note ? ` | ${errorInfo.note}` : ''}
              </p>
              <p className="font-body text-[11px] opacity-80 mt-1">
                Attempts: {attempts.length} / {sources.length}
              </p>
            </div>
          )}
        </div>

        {/* ── Pink/Blue bottom accent bar ─────────────────────── */}
        <div className="h-1 flex-shrink-0 bg-gradient-to-r from-[#FF69B4] via-[#9B5DE5] to-[#4A90D9]" />
      </motion.div>
    </AnimatePresence>
  );
}
