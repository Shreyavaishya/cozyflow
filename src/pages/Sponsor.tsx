import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Timer, Flame, MousePointerClick } from 'lucide-react';
import { fetchPublicStats, PublicStats } from '@/lib/sponsors';

// Edit these as the product grows. Only list what is actually live.
const PACKAGES = [
  {
    name: 'Break Card',
    price: '₹999 / month',
    points: [
      'Your brand on the break screen after every focus session',
      'Rotates with up to 2 other sponsors',
      'Monthly report: impressions, clicks, CTR',
    ],
  },
  {
    name: 'Launch Partner',
    price: '₹2,499 / month',
    highlight: true,
    points: [
      'Exclusive: the only sponsor shown on the break screen',
      'Shoutout on our social channels',
      'Monthly report: impressions, clicks, CTR',
    ],
  },
];

const fmt = (n?: number) => (n === undefined ? '—' : n.toLocaleString('en-IN'));

const SponsorPage = () => {
  const [stats, setStats] = useState<PublicStats | null | undefined>(undefined);
  useEffect(() => { fetchPublicStats().then(setStats); }, []);

  const email = import.meta.env.VITE_SPONSOR_EMAIL as string | undefined;
  const mailto = email
    ? `mailto:${email}?subject=${encodeURIComponent('Cozy Flow sponsorship')}&body=${encodeURIComponent('Hi, I would like to sponsor Cozy Flow.\n\nBrand:\nWebsite:\nPackage:')}`
    : undefined;

  const tiles = [
    { icon: Users, label: 'Registered users', value: fmt(stats?.users) },
    { icon: Flame, label: 'Active this week', value: fmt(stats?.weekly_active) },
    { icon: Timer, label: 'Focus hours logged', value: stats ? fmt(Math.round(stats.minutes / 60)) : '—' },
    { icon: MousePointerClick, label: 'Sponsor clicks', value: fmt(stats?.clicks) },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back to Cozy Flow
        </Link>

        <header className="space-y-3">
          <h1 className="text-4xl font-serif font-semibold">Sponsor Cozy Flow 🍅</h1>
          <p className="text-muted-foreground">
            Cozy Flow is a calm Pomodoro timer used by students and early-career people who study and work in focused sessions.
            Sponsors appear only during breaks, when people are relaxed and looking at the screen, never while they focus.
          </p>
        </header>

        <section>
          <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">Live numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tiles.map(({ icon: Icon, label, value }) => (
              <div key={label} className="glass-panel rounded-2xl p-4">
                <Icon size={16} className="text-primary mb-2" />
                <p className="text-2xl font-semibold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Pulled live from our database. No estimates.</p>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          {PACKAGES.map(p => (
            <div key={p.name} className={`glass-panel rounded-2xl p-6 space-y-3 ${p.highlight ? 'ring-2 ring-primary/40' : ''}`}>
              <h3 className="text-lg font-medium">{p.name}</h3>
              <p className="text-2xl font-semibold">{p.price}</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-4">
                {p.points.map(pt => <li key={pt}>{pt}</li>)}
              </ul>
            </div>
          ))}
        </section>

        <section className="glass-panel rounded-2xl p-6 space-y-2">
          <h2 className="text-lg font-medium">Good fits</h2>
          <p className="text-sm text-muted-foreground">
            Stationery and study gear, ed-tech and courses, student apps, tea and coffee, wellness and productivity tools.
          </p>
          {mailto ? (
            <a href={mailto} className="inline-block mt-2 rounded-xl bg-primary text-primary-foreground text-sm px-4 py-2">
              Get in touch
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">Contact email coming soon.</p>
          )}
        </section>

        <footer className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground pt-4 border-t border-border">
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/refund" className="hover:text-foreground">Refunds</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
        </footer>
      </div>
    </div>
  );
};

export default SponsorPage;
