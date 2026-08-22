'use client';

import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';

export function ShareButton() {
  const [copied, setCopied] = useState(false);
  async function share() {
    try { if (navigator.share) await navigator.share({ title: document.title, url: window.location.href }); else { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } } catch { /* sharing can be dismissed by the user */ }
  }
  return <button className="share-event" onClick={share}>{copied ? <Check size={15}/> : <Share2 size={15}/>} {copied ? 'Link copied' : 'Share this event'}</button>;
}
