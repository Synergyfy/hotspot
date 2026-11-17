import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Check,
  Globe,
  Image as ImageIcon,
  MousePointerClick,
  Share2,
  Smartphone,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

const STEPS = [
  {
    icon: ImageIcon,
    title: 'Upload one image',
    body: 'A product shot, a lookbook page or a whole catalogue — one image is your scene.',
  },
  {
    icon: MousePointerClick,
    title: 'Drop hotspots on it',
    body: 'Tap the image to place dots. Each one can reveal a product, a video, a note or a sign-up form.',
  },
  {
    icon: Share2,
    title: 'Share one link',
    body: 'Publish, then paste the link or iframe into your site, bio or campaign email. Nothing to install.',
  },
];

const FEATURES = [
  {
    icon: Smartphone,
    title: 'Made for phones',
    body: 'Taps, swipes and full-screen viewing work the same on a phone as on a desktop.',
  },
  {
    icon: Users,
    title: 'Leads built in',
    body: 'Form hotspots save every submission, so an image can collect emails while you sleep.',
  },
  {
    icon: BarChart3,
    title: 'Know what works',
    body: 'Views, hotspot clicks, click-through rate and where your campaign is being seen.',
  },
  {
    icon: Globe,
    title: 'Embed anywhere',
    body: 'Creative, but only verified domains may embed your work. The preview link always works.',
  },
  {
    icon: Zap,
    title: 'No code, no setup',
    body: 'Style it in the browser and publish in minutes — no developer, no plugin, no rebuild.',
  },
  {
    icon: Check,
    title: 'One campaign, many products',
    body: 'Stack as many hotspots as you like on a single image and keep editing after you share.',
  },
];

const HOTSPOTS = [
  { id: 1, x: '26%', y: '38%', label: 'Sun dress · $89' },
  { id: 2, x: '62%', y: '58%', label: 'Linen shirt · $54' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 sm:h-8 sm:w-8">
              <Sparkles className="h-4 w-4 text-white sm:h-5 sm:w-5" />
            </span>
            <span className="text-[15px] font-black tracking-tight text-slate-900 sm:text-xl">ClickSIP</span>
          </Link>

          <nav className="flex items-center gap-1.5 sm:gap-3">
            <a
              href="#how-it-works"
              className="hidden rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-600 sm:block"
            >
              How it works
            </a>
            <a
              href="#features"
              className="hidden rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-600 md:block"
            >
              Features
            </a>
            <Link
              to="/login"
              className="rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-600 sm:px-3 sm:py-2 sm:text-sm"
            >
              Sign in
            </Link>
            <Link
              to="/login?mode=register"
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
            >
              Get started <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-2 lg:gap-14 lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-blue-700">
              <Zap className="h-3 w-3" /> Interactive images
            </span>
            <h1 className="mt-4 text-4xl font-black leading-[1.08] tracking-tight text-slate-900 sm:mt-5 sm:text-5xl lg:text-6xl">
              Turn one image into something people can <span className="text-blue-600">tap</span>.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-600 sm:mt-5 sm:text-lg">
              Place hotspots on a product photo, a lookbook or a menu. Visitors tap to explore, buy or leave their
              email — then share it all with one link. No code, no website required.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:items-center sm:gap-3">
              <Link
                to="/login?mode=register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-[13px] font-black text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.99] sm:px-6 sm:py-3.5 sm:text-sm"
              >
                Create your first campaign <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[13px] font-bold text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-700 sm:px-6 sm:py-3.5 sm:text-sm"
              >
                I already have an account
              </Link>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-slate-500 sm:mt-8 sm:text-xs">
              {['Free to start', 'Works on any site', 'Leads and analytics included'].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Demo visual */}
          <div className="relative min-w-0">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-2xl shadow-slate-200 sm:rounded-[2rem]">
              <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white px-3 py-2 sm:px-4">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="ml-2 truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  clicksip.app / summer-collection
                </span>
              </div>
              <div className="relative">
                <img
                  src="/demo-scene.svg"
                  alt="Example storefront image with tappable product hotspots"
                  className="h-full w-full object-cover"
                  loading="eager"
                />
                {HOTSPOTS.map((hotspot) => (
                  <div key={hotspot.id} className="group absolute" style={{ left: hotspot.x, top: hotspot.y }}>
                    <span className="absolute -inset-2 animate-ping rounded-full bg-blue-500/20" />
                    <span className="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[10px] font-black text-white shadow-lg sm:h-7 sm:w-7">
                      {hotspot.id}
                    </span>
                    <span className="absolute left-8 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900/90 px-2 py-1 text-[10px] font-bold text-white sm:block">
                      {hotspot.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-black text-slate-900 sm:text-xs">Summer Collection</p>
                  <p className="text-[10px] font-medium text-slate-500">2 hotspots · shared today</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black text-white">
                  <MousePointerClick className="h-3 w-3" /> 14% CTR
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-16 border-y border-slate-100 bg-slate-50/70 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-widest text-blue-600">How it works</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Three steps from a flat image to a live campaign
            </h2>
            <p className="mt-2 text-sm text-slate-600 sm:mt-3 sm:text-base">
              Most people publish their first campaign in under ten minutes. Everything happens in the browser.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, index) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:h-11 sm:w-11 sm:rounded-2xl">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-2xl font-black text-slate-100 sm:text-3xl">0{index + 1}</span>
                </div>
                <h3 className="mt-4 text-sm font-black text-slate-900 sm:text-base">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 sm:text-sm">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-widest text-blue-600">Everything included</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Built for campaigns, not for developers
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-slate-100 bg-white p-5 transition-colors hover:border-blue-100 sm:p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="mt-3 text-[13px] font-black text-slate-900 sm:text-sm">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 sm:text-sm">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-slate-900 px-5 py-10 text-white sm:rounded-[2rem] sm:px-12 sm:py-14">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                Your next campaign is one image away.
              </h2>
              <p className="mt-2 max-w-xl text-[13px] text-slate-300 sm:text-sm">
                Create an account, upload a photo and add your first hotspot. Visitors only ever see the experience —
                never a login.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
              <Link
                to="/login?mode=register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-[13px] font-black text-slate-900 transition-colors hover:bg-slate-100"
              >
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-[13px] font-bold text-white transition-colors hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <span className="text-sm font-black tracking-tight text-slate-900">ClickSIP</span>
          </div>
          <p className="text-[11px] font-medium text-slate-400 sm:text-xs">
            Interactive images for products, catalogues and campaigns.
          </p>
          <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 sm:text-xs">
            <a href="#how-it-works" className="hover:text-blue-600">
              How it works
            </a>
            <Link to="/login" className="hover:text-blue-600">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
