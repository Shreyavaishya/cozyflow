import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Timer, Headphones, ListTodo, Flame, Trophy, Hourglass, Palette, Share2, Check, Menu, X, Moon, Sun, ArrowRight,
} from 'lucide-react';
import SceneBackground from '@/components/SceneBackground';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { PLANS, PRO_FEATURES } from '@/lib/plans';
import { SCENES } from '@/lib/scenes';
import { SITE_URL } from '@/lib/site';

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'Themes', href: '#themes' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const FEATURES = [
  { icon: Timer, title: 'Focus timer', text: 'Pomodoro with any length from 1 to 180 minutes. Short breaks, long breaks, and auto-start when you want it.' },
  { icon: Headphones, title: 'Ambient mixer', text: 'Layer rain, forest, fire, brown and white noise, each with its own volume.' },
  { icon: ListTodo, title: 'Tasks that count', text: 'Pick a task, run a session, and see how many pomodoros each one took.' },
  { icon: Flame, title: 'Streaks and heatmaps', text: 'Daily streaks, weekly charts and a 16-week heatmap show how consistent you really are.' },
  { icon: Trophy, title: 'Leaderboard', text: 'Opt in with a display name and climb the weekly ranking. Nothing is public unless you join.' },
  { icon: Hourglass, title: 'Countdowns', text: 'Keep your exam or deadline in sight with a simple days-left counter.' },
  { icon: Palette, title: 'Make it yours', text: 'Five font styles, accent colors, light and dark mode, and a background that moves with you.' },
  { icon: Share2, title: 'Share your streak', text: 'Turn your week into a clean card and post it in one tap.' },
];

const FREE_FEATURES = [
  'Timer with custom lengths (1 to 180 min)',
  'Rain, forest and fire sounds',
  'Tasks, streaks and weekly chart',
  'Leaderboard and share cards',
  'Cloud sync across devices',
  '1 countdown, 3 accent colors',
];

const FAQ = [
  { q: 'Is Cozy Flow free?', a: 'Yes. The timer, tasks, streaks, sounds, leaderboard and sync are free. Pro adds the heatmap, extra sounds and accent colors, unlimited countdowns, and removes sponsor cards.' },
  { q: 'Do I need an account?', a: 'No. Everything works without signing in and stays in your browser. Sign in with an email link to sync your stats across devices and join the leaderboard.' },
  { q: 'How does Pro billing work?', a: 'Pro is a one-time payment per period (monthly, yearly or lifetime) through Razorpay, with UPI and cards. There is no auto-renewal, so you are never charged unexpectedly.' },
  { q: 'What do sponsor cards look like?', a: 'A small card appears only during breaks, never while you focus. Pro users do not see them.' },
  { q: 'Who can see my data on the leaderboard?', a: 'Only people who join. If you do, others see your display name and focus minutes. Never your email. You can leave any time.' },
  { q: 'Can I change the timer lengths?', a: 'Yes. Tap a preset or type any number of minutes under the timer, for focus, short break or long break.' },
];

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

/* ---------- Navbar ---------- */
const Navbar = () => {
  const { theme, toggleTheme } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-4 pt-4">
      <nav className="glass-panel mx-auto max-w-5xl rounded-2xl px-4 py-2.5">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-serif text-lg font-semibold">
            <span>🍅</span> Cozy Flow
          </Link>

          <div className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            {NAV.map(n => <a key={n.href} href={n.href} className="hover:text-foreground transition-colors">{n.label}</a>)}
            <Link to="/sponsor" className="hover:text-foreground transition-colors">Sponsor</Link>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} aria-label="Toggle theme" className="p-2 rounded-xl text-muted-foreground hover:text-foreground">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <Link to="/app" className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-sm px-4 py-2 hover:opacity-90">
              Open app <ArrowRight size={14} />
            </Link>
            <button onClick={() => setOpen(o => !o)} aria-label="Menu" className="md:hidden p-2 rounded-xl text-muted-foreground">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden mt-3 pt-3 border-t border-border flex flex-col gap-1 text-sm">
            {NAV.map(n => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="px-2 py-2 rounded-lg text-muted-foreground hover:text-foreground">{n.label}</a>
            ))}
            <Link to="/sponsor" className="px-2 py-2 rounded-lg text-muted-foreground hover:text-foreground">Sponsor</Link>
            <Link to="/app" className="mt-1 inline-flex justify-center items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2.5">
              Open app <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
};

/* ---------- Hero preview (live fake timer) ---------- */
const HeroPreview = () => {
  const [left, setLeft] = useState(25 * 60 - 7);
  useEffect(() => {
    const id = setInterval(() => setLeft(l => (l <= 1 ? 25 * 60 : l - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const R = 92, C = 2 * Math.PI * R;
  const progress = left / (25 * 60);
  const heat = [0, 1, 3, 2, 0, 4, 2, 1, 3, 4, 2, 0, 3, 4, 4, 1, 2, 3, 0, 2, 4, 3, 1, 2, 3, 4, 2, 3];

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="glass-panel rounded-3xl p-6 shadow-xl">
        <div className="flex justify-center gap-1 rounded-xl bg-muted/60 p-1 w-fit mx-auto text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground">Focus</span>
          <span className="px-3 py-1.5 text-muted-foreground">Short Break</span>
          <span className="px-3 py-1.5 text-muted-foreground">Long Break</span>
        </div>
        <div className="relative mx-auto my-6 h-56 w-56">
          <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
            <circle cx="100" cy="100" r={R} fill="none" strokeWidth="6" className="stroke-primary/15" />
            <circle cx="100" cy="100" r={R} fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-primary"
              strokeDasharray={C} strokeDashoffset={C * (1 - progress)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-5xl timer-digits text-primary">{mm}:{ss}</span>
            <span className="text-xs text-muted-foreground mt-1">Focus</span>
          </div>
        </div>
        <div className="flex justify-center gap-1.5 flex-wrap">
          {[1, 5, 15, 25, 40, 50].map(m => (
            <span key={m} className={`px-2.5 py-1 rounded-lg text-xs ${m === 25 ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground'}`}>{m}m</span>
          ))}
        </div>
      </div>

      <motion.div
        className="glass-panel rounded-2xl px-4 py-3 absolute -left-4 sm:-left-14 top-10 shadow-lg hidden sm:block"
        animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <p className="text-xs text-muted-foreground">Streak</p>
        <p className="font-serif text-2xl timer-digits">🔥 12 days</p>
      </motion.div>

      <motion.div
        className="glass-panel rounded-2xl p-3 absolute -right-4 sm:-right-14 bottom-24 shadow-lg hidden sm:block"
        animate={{ y: [0, 8, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="grid grid-cols-7 gap-1">
          {heat.map((n, i) => (
            <span key={i} className={`h-3.5 w-3.5 rounded-[4px] ${n === 0 ? 'bg-primary/10' : n === 1 ? 'bg-primary/30' : n === 2 ? 'bg-primary/50' : n === 3 ? 'bg-primary/75' : 'bg-primary'}`} />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Focus heatmap</p>
      </motion.div>

      <motion.div
        className="glass-panel rounded-2xl px-4 py-3 absolute -right-2 sm:-right-10 -top-4 shadow-lg hidden sm:block text-xs"
        animate={{ y: [0, -6, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <p className="text-muted-foreground mb-1">This week</p>
        <p>🥇 Asha <span className="text-muted-foreground">· 14h</span></p>
        <p>🥈 Rohan <span className="text-muted-foreground">· 11h</span></p>
        <p>🥉 Meera <span className="text-muted-foreground">· 9h</span></p>
      </motion.div>
    </div>
  );
};


/* ---------- Embed link box ---------- */
const EmbedLink = () => {
  const [copied, setCopied] = useState(false);
  const link = `${SITE_URL}/embed?scene=sakura&theme=dark`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };
  return (
    <div className="mt-6 mx-auto max-w-xl flex items-center gap-2 rounded-xl bg-muted/60 pl-4 pr-1.5 py-1.5">
      <code className="flex-1 truncate text-left text-xs sm:text-sm text-muted-foreground">{link}</code>
      <button onClick={copy} className="shrink-0 rounded-lg bg-primary text-primary-foreground text-sm px-4 py-2">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
};

/* ---------- Page ---------- */
const Landing = () => {
  const { theme } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => { document.documentElement.style.scrollBehavior = prev; };
  }, []);

  // Magic-link and Google sign-in return to "/": once the session is set, continue into the app.
  useEffect(() => {
    if (!supabase) return;
    const returning = window.location.hash.includes('access_token') || window.location.search.includes('code=');
    if (!returning) return;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) navigate('/app', { replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="relative min-h-screen text-foreground">
      <SceneBackground />
      <Navbar />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-36 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center lg:text-left">
          <span className="inline-block glass-panel rounded-full px-3 py-1 text-xs text-muted-foreground mb-5">
            Aesthetic Pomodoro · Ambient sounds · Streaks · Leaderboard
          </span>
          <h1 className="font-serif text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            Focus that feels <span className="text-primary">cozy</span>.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
            An aesthetic Pomodoro timer with cozy scenes, ambient sounds, streaks and heatmaps. Set any length, make it yours, and stay in the zone. Free to start.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
            <Link to="/app" className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-medium hover:opacity-90">
              Start focusing <ArrowRight size={16} />
            </Link>
            <a href="#features" className="inline-flex items-center rounded-xl glass-panel px-6 py-3 font-medium hover:bg-muted/50">
              See features
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No account needed. Works right in your browser.</p>
        </motion.div>
        <HeroPreview />
      </section>


      {/* Aesthetic scenes */}
      <section id="themes" className="scroll-mt-24 max-w-6xl mx-auto px-6 py-20">
        <motion.div {...fade} className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold">Pick your aesthetic</h2>
          <p className="mt-3 text-muted-foreground">Falling petals, a crackling fireplace, twinkling stars. Choose a scene that matches your study mood, in light or dark.</p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {SCENES.filter(sc => sc.id !== 'default').map((sc, i) => (
            <motion.div key={sc.id} {...fade} transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}>
              <Link
                to={sc.pro ? '/app?upgrade=1' : `/app?scene=${sc.id}`}
                className="group relative block h-36 rounded-2xl overflow-hidden border border-border/50 shadow-sm"
                style={{ background: theme === 'dark' ? sc.dark : sc.light, backgroundSize: sc.size }}
              >
                <span className="absolute left-3 top-3 font-serif text-xl timer-digits text-foreground/80">25:00</span>
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/35 px-3 py-2 text-sm text-white backdrop-blur-sm">
                  {sc.label}
                  {sc.pro ? <span className="text-[10px] rounded-full bg-white/25 px-2 py-0.5">Pro</span> : <span className="text-[10px] opacity-80 group-hover:opacity-100">Try it →</span>}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-24 max-w-6xl mx-auto px-6 py-20">
        <motion.div {...fade} className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold">Everything you need to stay consistent</h2>
          <p className="mt-3 text-muted-foreground">Simple on the surface, with the details that keep you coming back.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <motion.div key={title} {...fade} transition={{ duration: 0.5, delay: (i % 4) * 0.06 }} className="glass-panel rounded-2xl p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary mb-4"><Icon size={20} /></span>
              <h3 className="font-serif text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>


      {/* Embed */}
      <section id="embed" className="scroll-mt-24 max-w-3xl mx-auto px-6 py-16">
        <motion.div {...fade} className="glass-panel rounded-3xl p-8 text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold">Works in Notion</h2>
          <p className="mt-3 text-muted-foreground text-sm max-w-xl mx-auto">
            Paste this link into any Notion page and choose "Create embed". You get the full timer with your chosen scene, right in your workspace or on a second screen.
          </p>
          <EmbedLink />
        </motion.div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-24 max-w-4xl mx-auto px-6 py-20">
        <motion.div {...fade} className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold">Simple pricing</h2>
          <p className="mt-3 text-muted-foreground">Start free. Upgrade when you want more. No auto-renewal.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-5">
          <motion.div {...fade} className="glass-panel rounded-3xl p-7 flex flex-col">
            <h3 className="font-serif text-xl font-semibold">Free</h3>
            <p className="mt-2 font-serif text-4xl timer-digits">₹0</p>
            <ul className="mt-5 space-y-2.5 text-sm flex-1">
              {FREE_FEATURES.map(f => <li key={f} className="flex gap-2"><Check size={16} className="text-primary shrink-0 mt-0.5" />{f}</li>)}
            </ul>
            <Link to="/app" className="mt-7 inline-flex justify-center rounded-xl bg-muted px-5 py-3 text-sm font-medium hover:bg-muted/70">Start free</Link>
          </motion.div>

          <motion.div {...fade} transition={{ duration: 0.5, delay: 0.08 }} className="glass-panel rounded-3xl p-7 flex flex-col ring-2 ring-primary/50 relative">
            <span className="absolute -top-3 left-7 rounded-full bg-primary text-primary-foreground text-xs px-3 py-1">Most popular</span>
            <h3 className="font-serif text-xl font-semibold">Pro</h3>
            <p className="mt-2 font-serif text-4xl timer-digits">₹{PLANS.monthly.price}<span className="text-base font-normal text-muted-foreground">/month</span></p>
            <p className="text-xs text-muted-foreground mt-1">
              or ₹{PLANS.yearly.price}/year · ₹{PLANS.lifetime.price} lifetime
            </p>
            <ul className="mt-5 space-y-2.5 text-sm flex-1">
              <li className="flex gap-2 text-muted-foreground"><Check size={16} className="text-primary shrink-0 mt-0.5" />Everything in Free</li>
              {PRO_FEATURES.map(f => <li key={f} className="flex gap-2"><Check size={16} className="text-primary shrink-0 mt-0.5" />{f}</li>)}
            </ul>
            <Link to="/app?upgrade=1" className="mt-7 inline-flex justify-center rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-medium hover:opacity-90">Get Pro</Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 max-w-2xl mx-auto px-6 py-20">
        <motion.h2 {...fade} className="font-serif text-3xl md:text-4xl font-semibold text-center mb-10">Questions</motion.h2>
        <div className="space-y-3">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group glass-panel rounded-2xl px-5 py-4">
              <summary className="cursor-pointer list-none flex justify-between items-center font-medium">
                {q}
                <span className="text-primary text-xl leading-none transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <motion.div {...fade} className="glass-panel rounded-3xl px-8 py-14 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold">Ready for your first session?</h2>
          <p className="mt-3 text-muted-foreground">Open the timer and start. It takes less than five seconds.</p>
          <Link to="/app" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-7 py-3 font-medium hover:opacity-90">
            Start focusing <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      
<footer className="border-t border-border">
  <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-8 md:items-start md:justify-between">
    <div className="max-w-xs">
      <p className="font-serif text-lg font-semibold">🍅 Cozy Flow</p>
      <p className="mt-2 text-sm text-muted-foreground">
        A calm Pomodoro timer, made with ❤️ by{" "}
        <a
          href="https://shreyacodes.in"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:text-foreground transition-colors"
        >
          Shreya
        </a>.
      </p>
    </div>

    <div className="flex gap-14 text-sm">
      <div className="flex flex-col gap-2">
        <span className="font-medium">Product</span>
        <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
        <a href="#themes" className="text-muted-foreground hover:text-foreground">Themes</a>
        <a href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</a>
        <a href="#faq" className="text-muted-foreground hover:text-foreground">FAQ</a>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-medium">Cozy Flow</span>
        <Link to="/app" className="text-muted-foreground hover:text-foreground">Open app</Link>
        <Link to="/sponsor" className="text-muted-foreground hover:text-foreground">Sponsor us</Link>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-medium">Legal</span>
        <Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link>
        <Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link>
        <Link to="/refund" className="text-muted-foreground hover:text-foreground">Refunds</Link>
        <Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
      </div>
    </div>
  </div>

  <p className="text-center text-xs text-muted-foreground pb-8">
    © {new Date().getFullYear()} Cozy Flow
  </p>
</footer>

    </div>
  );
};

export default Landing;
