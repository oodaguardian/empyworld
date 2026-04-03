import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadMovie, fetchMovies, deleteMovie, updateMovieTitle } from '../services/bunny';
import logo from '../emplogo.png';

const UPLOAD_PIN = localStorage.getItem('empyPIN') || '1234';

function PinGate({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  const check = (value) => {
    const stored = localStorage.getItem('empyPIN') || '1234';
    if (value === stored) {
      onUnlock();
    } else if (value.length === 4) {
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 500);
    }
  };

  const tap = (d) => {
    const next = pin + d;
    setPin(next);
    if (next.length === 4) check(next);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4"
      style={{ background: 'linear-gradient(135deg, #0d0b2a 0%, #1a0d2e 100%)' }}>
      {/* Logo */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-xl opacity-60"
          style={{ background: 'linear-gradient(135deg, #4A90D9, #FF69B4)' }} />
        <img src={logo} alt="Empy TV" className="relative h-20 w-20 rounded-full border-4"
          style={{ borderColor: '#FF69B4' }} />
      </div>
      <h1 className="text-white font-display text-2xl">Movie Upload Portal</h1>
      <p className="text-white/50 font-body text-sm text-center">Enter your PIN to access</p>

      {/* PIN dots */}
      <motion.div
        animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.3 }}
        className="flex gap-3"
      >
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="w-4 h-4 rounded-full border-2 transition-all"
            style={{
              borderColor: '#FF69B4',
              background: i < pin.length ? '#FF69B4' : 'transparent',
            }} />
        ))}
      </motion.div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 w-56">
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.88 }}
            onClick={() => {
              if (d === '⌫') setPin(p => p.slice(0, -1));
              else if (d !== '') tap(String(d));
            }}
            disabled={d === ''}
            className="h-14 rounded-2xl text-white text-xl font-display disabled:opacity-0 transition-all"
            style={{
              background: d === '' ? 'transparent' : 'rgba(74,144,217,0.15)',
              border: d === '' ? 'none' : '1px solid rgba(74,144,217,0.3)',
            }}
          >
            {d}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default function MovieUpload() {
  const [unlocked, setUnlocked] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadInfo, setUploadInfo] = useState({ speed: '', eta: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [movies, setMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef();
  const uploadStart = useRef(0);

  const loadMovies = useCallback(async () => {
    setLoadingMovies(true);
    const list = await fetchMovies();
    setMovies(list);
    setLoadingMovies(false);
  }, []);

  const onUnlock = () => {
    setUnlocked(true);
    loadMovies();
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('video/')) {
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const onFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setError('Please select a file and enter a title.');
      return;
    }
    setError('');
    setSuccess('');
    setUploading(true);
    setProgress(0);
    setUploadInfo({ speed: '', eta: '' });
    uploadStart.current = Date.now();

    const trackProgress = (pct) => {
      setProgress(pct);
      if (pct > 0 && pct < 100) {
        const elapsed = (Date.now() - uploadStart.current) / 1000;
        const bytesUploaded = (pct / 100) * file.size;
        const speedBps = bytesUploaded / elapsed;
        const bytesLeft = file.size - bytesUploaded;
        const etaSec = speedBps > 0 ? bytesLeft / speedBps : 0;
        setUploadInfo({
          speed: speedBps > 1024 ** 2 ? `${(speedBps / 1024 ** 2).toFixed(1)} MB/s` : `${(speedBps / 1024).toFixed(0)} KB/s`,
          eta: etaSec > 60 ? `${Math.ceil(etaSec / 60)}m left` : `${Math.ceil(etaSec)}s left`,
        });
      }
    };

    try {
      await uploadMovie(file, title.trim(), trackProgress);

      setSuccess(`✅ "${title}" uploaded successfully!`);
      setFile(null);
      setTitle('');
      setProgress(0);
      loadMovies();
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (movie) => {
    if (!confirm(`Delete "${movie.title}"? This cannot be undone.`)) return;
    try {
      await deleteMovie(movie.filename);
      if (editingMovie === movie.filename) {
        setEditingMovie(null);
        setEditTitle('');
      }
      loadMovies();
    } catch (err) {
      setError(`Delete failed: ${err.message}`);
    }
  };

  const startEdit = (movie) => {
    setEditingMovie(movie.filename);
    setEditTitle(movie.title);
    setError('');
    setSuccess('');
  };

  const cancelEdit = () => {
    setEditingMovie(null);
    setEditTitle('');
  };

  const handleSaveTitle = async (movie) => {
    const next = editTitle.trim();
    if (!next) {
      setError('Title cannot be empty.');
      return;
    }

    setSavingTitle(true);
    setError('');
    setSuccess('');

    try {
      await updateMovieTitle(movie.filename, next);
      setSuccess(`✅ Updated title to "${next}"`);
      setEditingMovie(null);
      setEditTitle('');
      await loadMovies();
    } catch (err) {
      setError(`Update failed: ${err.message}`);
    } finally {
      setSavingTitle(false);
    }
  };

  const fmt = (bytes) => {
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  };

  if (!unlocked) return <PinGate onUnlock={onUnlock} />;

  return (
    <div className="min-h-screen py-8 px-4"
      style={{ background: 'linear-gradient(135deg, #0d0b2a 0%, #1a0d2e 100%)' }}>
      {/* Accent top bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50"
        style={{ background: 'linear-gradient(to right, #4A90D9, #9B5DE5, #FF69B4)' }} />

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-lg opacity-70"
              style={{ background: 'linear-gradient(135deg, #4A90D9, #FF69B4)' }} />
            <img src={logo} alt="Empy TV" className="relative h-12 w-12 rounded-full border-2"
              style={{ borderColor: '#FF69B4' }} />
          </div>
          <div>
            <p className="font-display text-xs tracking-widest uppercase" style={{ color: '#4A90D9' }}>
              mvx.empy.my
            </p>
            <h1 className="text-white font-display text-2xl">Movie Upload Portal</h1>
          </div>
        </div>

        {/* Drop Zone */}
        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => !file && fileRef.current?.click()}
          animate={{ borderColor: drag ? '#FF69B4' : file ? '#4A90D9' : 'rgba(255,255,255,0.15)' }}
          className="rounded-3xl p-8 text-center cursor-pointer transition-all mb-5"
          style={{
            border: `2px dashed`,
            background: drag ? 'rgba(255,105,180,0.08)' : 'rgba(255,255,255,0.03)',
          }}
        >
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={onFileSelect} />
          {file ? (
            <div>
              <div className="text-4xl mb-2">🎬</div>
              <p className="text-white font-display text-lg">{file.name}</p>
              <p className="text-white/50 font-body text-sm mt-1">{fmt(file.size)}</p>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); setTitle(''); }}
                className="mt-3 text-xs text-white/40 hover:text-white/70 underline font-body">
                Remove
              </button>
            </div>
          ) : (
            <div>
              <div className="text-5xl mb-3">📤</div>
              <p className="text-white font-display text-lg">Drop a movie file here</p>
              <p className="text-white/50 font-body text-sm mt-1">or click to browse — no size limit</p>
              <p className="text-white/30 font-body text-xs mt-1">MP4, MOV, AVI, MKV, WebM supported</p>
            </div>
          )}
        </motion.div>

        {/* Title Input */}
        <div className="mb-4">
          <label className="block text-white/70 font-display text-sm mb-1">Movie Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter movie title..."
            className="w-full rounded-xl px-4 py-3 text-white font-body placeholder-white/30 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(74,144,217,0.3)',
            }}
            onFocus={e => e.target.style.borderColor = '#FF69B4'}
            onBlur={e => e.target.style.borderColor = 'rgba(74,144,217,0.3)'}
          />
        </div>

        {/* Progress bar */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="flex justify-between text-xs font-display text-white/60 mb-1">
                <span>Uploading to Bunny CDN…</span>
                <span className="flex gap-3">
                  {uploadInfo.speed && <span>{uploadInfo.speed}</span>}
                  {uploadInfo.eta && <span>{uploadInfo.eta}</span>}
                  <span>{progress}%</span>
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(to right, #4A90D9, #FF69B4)' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'linear', duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-body"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-body"
            style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', color: '#86efac' }}>
            {success}
          </div>
        )}

        {/* Upload button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleUpload}
          disabled={uploading || !file}
          className="w-full py-4 rounded-2xl text-white font-display text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #4A90D9, #9B5DE5, #FF69B4)' }}
        >
          {uploading ? `Uploading… ${progress}%` : '🚀 Upload Movie'}
        </motion.button>

        {/* Movie library */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-display text-lg">Uploaded Movies</h2>
            <button onClick={loadMovies} className="text-xs text-white/40 hover:text-white/70 font-body underline">
              Refresh
            </button>
          </div>

          {loadingMovies && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 rounded-full border-2 border-empy-pink border-t-transparent animate-spin" />
            </div>
          )}

          {!loadingMovies && movies.length === 0 && (
            <p className="text-white/30 font-body text-sm text-center py-8">No movies uploaded yet.</p>
          )}

          <div className="flex flex-col gap-3">
            {movies.map(movie => (
              <div key={movie.id}
                className="flex items-center gap-3 rounded-2xl p-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="h-12 w-20 flex items-center justify-center rounded-lg flex-shrink-0 text-2xl"
                  style={{ background: '#1a1040' }}>
                  🎬
                </div>
                <div className="flex-1 min-w-0">
                  {editingMovie === movie.filename ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-lg px-2 py-1 text-white text-sm font-display outline-none"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)' }}
                      maxLength={80}
                    />
                  ) : (
                    <p className="text-white font-display text-sm truncate">{movie.title}</p>
                  )}
                  <p className="text-white/40 font-body text-xs">
                    {movie.addedAt ? new Date(movie.addedAt).toLocaleDateString() : ''}
                    {movie.size ? ` · ${fmt(movie.size)}` : ''}
                  </p>
                </div>
                {editingMovie === movie.filename ? (
                  <div className="flex-shrink-0 flex items-center gap-1">
                    <button
                      onClick={() => handleSaveTitle(movie)}
                      disabled={savingTitle}
                      className="text-emerald-300/90 hover:text-emerald-200 transition-colors font-body text-xs px-2 py-1 rounded-lg hover:bg-emerald-500/10 disabled:opacity-40"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={savingTitle}
                      className="text-white/50 hover:text-white/80 transition-colors font-body text-xs px-2 py-1 rounded-lg hover:bg-white/10 disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex-shrink-0 flex items-center gap-1">
                    <button
                      onClick={() => startEdit(movie)}
                      className="text-blue-300/80 hover:text-blue-200 transition-colors font-body text-xs px-2 py-1 rounded-lg hover:bg-blue-500/10"
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDelete(movie)}
                      className="text-red-400/60 hover:text-red-400 transition-colors font-body text-xs px-2 py-1 rounded-lg hover:bg-red-500/10">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
