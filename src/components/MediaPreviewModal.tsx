'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';

interface Props {
  open: boolean;
  url?: string;
  title?: string;
  onClose: () => void;
}

type Parsed =
  | { type: 'youtube'; embedSrc: string }
  | { type: 'instagram' }
  | { type: 'other' };

function parseUrl(url: string): Parsed {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return { type: 'youtube', embedSrc: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0` };
  if (/instagram\.com\/(?:p|reel|tv)\/[a-zA-Z0-9_-]+/.test(url)) return { type: 'instagram' };
  return { type: 'other' };
}

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

export default function MediaPreviewModal({ open, url, title, onClose }: Props) {
  const parsed: Parsed | null = url ? parseUrl(url) : null;

  // Instagram embed.js 로드 + 처리
  useEffect(() => {
    if (!open || !parsed || parsed.type !== 'instagram') return;
    const existing = document.querySelector<HTMLScriptElement>('script[src*="instagram.com/embed.js"]');
    if (existing) {
      // 이미 로드되어 있으면 process만 다시 호출
      try { window.instgrm?.Embeds.process(); } catch {}
      return;
    }
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.instagram.com/embed.js';
    s.onload = () => { try { window.instgrm?.Embeds.process(); } catch {} };
    document.body.appendChild(s);
  }, [open, parsed, url]);

  return (
    <AnimatePresence>
      {open && url && parsed && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-[28px] w-full max-w-md overflow-hidden shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]">
              <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100 shrink-0">
                <h3 className="text-[15px] font-bold text-slate-800 truncate pr-3">{title || '미리보기'}</h3>
                <button onClick={onClose} className="p-1.5 bg-slate-50 rounded-full text-slate-500 hover:bg-slate-100 transition-colors shrink-0">
                  <X size={18} />
                </button>
              </div>

              {parsed.type === 'youtube' && (
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={parsed.embedSrc}
                    title={title || 'YouTube'}
                    className="w-full h-full block"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              )}

              {parsed.type === 'instagram' && (
                <div className="p-3 overflow-y-auto bg-slate-50">
                  <blockquote
                    key={url /* 새 url마다 재마운트 */}
                    className="instagram-media"
                    data-instgrm-permalink={url}
                    data-instgrm-version="14"
                    style={{ background: '#fff', border: 0, margin: 0, padding: 0, minWidth: '100%' }}
                  >
                    <a href={url} target="_blank" rel="noopener noreferrer" className="block py-6 text-center text-sm text-slate-500">
                      인스타그램에서 열기
                    </a>
                  </blockquote>
                </div>
              )}

              {parsed.type === 'other' && (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                    이 사이트는 인앱 미리보기를 지원하지 않아요.<br />
                    외부 브라우저에서 열어볼게요.
                  </p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-full text-sm font-bold shadow-[0_4px_16px_rgba(16,185,129,0.25)]"
                  >
                    <ExternalLink size={16} /> 외부에서 열기
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
