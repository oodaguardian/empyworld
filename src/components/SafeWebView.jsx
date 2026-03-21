import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SAFE_DOMAINS } from '../constants/deeplinks';

function isUrlSafe(url) {
  try {
    const hostname = new URL(url).hostname;
    return SAFE_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
  } catch { return false; }
}

export default function SafeWebView({ url, title, onClose }) {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);

  if (!isUrlSafe(url)) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 gap-4">
        <span className="text-6xl">🚫</span>
        <p className="text-xl font-display text-white">This website is not on our safe list</p>
        <button onClick={onClose} className="btn bg-empy-pink text-white border-empy-pink font-display">Go Back</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center gap-2 px-3 py-2 border-b border-empy-yellow/20 flex-shrink-0">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
          className="btn btn-circle btn-sm bg-empy-pink/20 border-empy-pink/40 text-white">
          ✕
        </motion.button>
        <span className="text-sm text-white/70 font-display truncate flex-1">{title || url}</span>
      </header>
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-2xl animate-spin">⏳</div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={url}
        title={title}
        className={`flex-1 w-full border-0 ${loading ? 'h-0' : ''}`}
        sandbox="allow-scripts allow-same-origin allow-popups"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
