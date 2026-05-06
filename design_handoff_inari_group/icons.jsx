/* ============================================================
   Shared icon + small UI primitives for INARI screens
   Uses inline SVG (no lucide-react in HTML) — same icon set
   ============================================================ */

const icon = (paths, opts = {}) => ({ size = 18, stroke = 2, className = '', style = {} } = {}) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    className={className} style={style}
  >
    {paths}
  </svg>
);

// hand-built lucide-style icons we need across the system
const Icon = {
  Sparkles: icon(<><path d="M12 3l1.9 4.6L18 9.5l-4.1 1.9L12 16l-1.9-4.6L6 9.5l4.1-1.9L12 3z"/><path d="M19 15l.8 1.9L22 18l-2.2 1.1L19 21l-.8-1.9L16 18l2.2-1.1L19 15z"/><path d="M5 14l.5 1.3L7 16l-1.5.7L5 18l-.5-1.3L3 16l1.5-.7L5 14z"/></>),
  Arrow: icon(<><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></>),
  Check: icon(<path d="M5 12l5 5L20 7"/>),
  Calendar: icon(<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/></>),
  Crown: icon(<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8z"/>),
  Building: icon(<><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/></>),
  Heart: icon(<path d="M12 21s-7-4.5-9.5-9C.7 8 3 4 7 4c2 0 3.6 1.2 5 3 1.4-1.8 3-3 5-3 4 0 6.3 4 4.5 8C19 16.5 12 21 12 21z"/>),
  Cake: icon(<><path d="M4 19h16v-7c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v7z"/><path d="M4 15c2 1 4 1 6 0s4-1 6 0 4 1 4 1"/><path d="M12 3v3M9 6c0-1 1-1 1-2 0 1 1 1 1 2"/></>),
  Briefcase: icon(<><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2"/></>),
  Music: icon(<><path d="M9 17V5l11-2v12"/><circle cx="6" cy="17" r="3"/><circle cx="17" cy="15" r="3"/></>),
  Users: icon(<><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M21 19c0-2-1.6-3.5-4-3.8"/></>),
  Zap: icon(<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>),
  ChartBar: icon(<><path d="M3 21h18"/><rect x="6" y="11" width="3" height="8" rx="0.5"/><rect x="11" y="6" width="3" height="13" rx="0.5"/><rect x="16" y="14" width="3" height="5" rx="0.5"/></>),
  Wallet: icon(<><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M16 13h2"/><path d="M3 10h14"/></>),
  Star: icon(<path d="M12 3l2.7 5.7L21 9.6l-4.5 4.4L17.5 21 12 17.8 6.5 21 7.5 14 3 9.6l6.3-.9L12 3z"/>),
  Search: icon(<><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>),
  Filter: icon(<path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/>),
  Plus: icon(<><path d="M12 5v14M5 12h14"/></>),
  Home: icon(<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1v-9z"/>),
  Inbox: icon(<><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3 7v6a2 2 0 01-2 2h-15a2 2 0 01-2-2v-6l3-7z"/></>),
  Settings: icon(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></>),
  Logout: icon(<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></>),
  Mail: icon(<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></>),
  Lock: icon(<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></>),
  Eye: icon(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>),
  Pin: icon(<><path d="M12 22s-7-7.5-7-13a7 7 0 0114 0c0 5.5-7 13-7 13z"/><circle cx="12" cy="9" r="2.5"/></>),
  Clock: icon(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
  Download: icon(<><path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></>),
  Cpu: icon(<><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></>),
  Globe: icon(<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></>),
  Phone: icon(<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.7a2 2 0 01-.5 2.1L8 9.7a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.5c.9.3 1.8.5 2.7.6a2 2 0 011.7 2z"/>),
};

window.IG_Icon = Icon;
