import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Image as ImageIcon, Mail, MousePointerClick, Share2, ShieldCheck, Smartphone, X } from 'lucide-react';

const STEPS = [
  {
    icon: ImageIcon,
    title: '1. Start with one image',
    body: 'Upload a product shot, lifestyle photo or catalogue page. This image is the scene your customers explore.',
  },
  {
    icon: MousePointerClick,
    title: '2. Drop hotspots on it',
    body: 'Click the image to place a dot, then choose what it reveals: a product, a video, a note or a sign-up form.',
  },
  {
    icon: Share2,
    title: '3. Publish and share',
    body: 'Hit “Publish & share” to get a link or iframe. Paste it into your site, bio or campaign email.',
  },
];

const FAQS = [
  {
    q: 'What exactly is a hotspot?',
    a: 'A tappable dot on your image. Visitors hover or tap it to open the card you designed — a product, video, text or form.',
  },
  {
    q: 'Will it work on phones?',
    a: 'Yes. Hover cards need a mouse, so use the “Click” trigger if most of your visitors are on mobile. In the live view, tapping a dot always opens it.',
  },
  {
    q: 'How do I collect emails or leads?',
    a: 'Add a “Form” hotspot. Name and email fields are pre-filled — edit, add or remove fields as you like. Submissions appear under Leads.',
  },
  {
    q: 'Why do I need to add a domain?',
    a: 'Domains control which websites can embed your campaign. Add the site’s hostname and verify it before embedding there. Your preview link always works.',
  },
  {
    q: 'Can I use my own images and video?',
    a: 'Yes — upload files directly or paste an image URL. You can also add a watermark and a click sound to a campaign.',
  },
  {
    q: 'Where do I see performance?',
    a: 'Open a campaign’s Analytics to see views, hotspot clicks, click-through rate, leads and the sites your campaign is viewed on.',
  },
];

export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="How ClickSIP works"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 p-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900">How ClickSIP works</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Three steps from a flat image to something customers can explore.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close help"
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid gap-4 md:grid-cols-3">
                {STEPS.map(({ icon: Icon, title, body }) => (
                  <div key={title} className="rounded-3xl border border-slate-100 bg-slate-50/60 p-5">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900">{title}</h3>
                    <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">{body}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {FAQS.map(({ q, a }) => (
                  <div key={q} className="rounded-2xl border border-slate-100 p-5">
                    <h4 className="text-sm font-black text-slate-900">{q}</h4>
                    <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500">{a}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl bg-blue-50 p-5 text-blue-700">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <p className="text-xs font-bold leading-relaxed">
                  Tip: preview any campaign in a new tab before sharing. What you see there is exactly what your audience gets.
                </p>
                <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                  <Smartphone className="h-3.5 w-3.5" /> Mobile friendly
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 p-5">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-black text-white transition-all hover:bg-slate-800 active:scale-[0.99]"
              >
                Got it, let’s build <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function HelpInlineLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 transition-colors hover:text-blue-700"
    >
      <Mail className="h-3 w-3" /> How it works
    </button>
  );
}
