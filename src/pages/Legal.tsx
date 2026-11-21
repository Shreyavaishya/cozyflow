import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LEGAL } from '@/lib/legal';

const Layout = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="min-h-screen text-foreground">
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back to Cozy Flow
      </Link>
      <h1 className="mt-6 font-serif text-4xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {LEGAL.updated}</p>
      <div className="mt-8 space-y-4 leading-relaxed">{children}</div>
      <nav className="mt-14 pt-6 border-t border-border flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
        <Link to="/refund" className="hover:text-foreground">Refunds</Link>
        <Link to="/contact" className="hover:text-foreground">Contact</Link>
      </nav>
    </div>
  </div>
);

const H = ({ children }: { children: ReactNode }) => <h2 className="font-serif text-xl font-semibold pt-4">{children}</h2>;
const P = ({ children }: { children: ReactNode }) => <p className="text-muted-foreground">{children}</p>;
const UL = ({ items }: { items: ReactNode[] }) => (
  <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">{items.map((i, n) => <li key={n}>{i}</li>)}</ul>
);
const Mail = () => <a href={`mailto:${LEGAL.email}`} className="text-primary underline">{LEGAL.email}</a>;

/* ------------------------------------------------------------------ */
export const Privacy = () => (
  <Layout title="Privacy Policy">
    <P>{LEGAL.product} ("we", "us") is operated by {LEGAL.owner}, based in India. This policy explains what we collect, why, and the choices you have. Questions: <Mail />.</P>

    <H>What we collect</H>
    <UL items={[
      <><strong className="text-foreground">Without an account:</strong> your timer settings, tasks, stats and countdowns stay in your own browser's local storage. We do not receive them.</>,
      <><strong className="text-foreground">With an account:</strong> your email address (for the sign-in link or Google sign-in) and a synced copy of your settings, appearance choices, tasks, countdowns, session counts, focus minutes and daily history.</>,
      <><strong className="text-foreground">Leaderboard (optional):</strong> if you join, your chosen display name and your focus minutes are visible to other users. Your email is never shown. You can leave at any time, which deletes your leaderboard profile.</>,
      <><strong className="text-foreground">Purchases:</strong> payments are processed by Razorpay. We receive and keep your order ID, payment ID, plan, amount and date. We never receive or store your card, UPI or bank details.</>,
      <><strong className="text-foreground">Sponsor cards:</strong> we count how many times a sponsor card is shown and clicked. These counts are not linked to your account.</>,
      <><strong className="text-foreground">Technical data:</strong> our hosting and database providers may log standard connection data such as IP address and browser type for security and reliability.</>,
    ]} />

    <H>How we use it</H>
    <UL items={[
      'To run the app: save and sync your data across your devices.',
      'To show the leaderboard to people who opted in.',
      'To activate and manage Pro after a payment.',
      'To report anonymous totals (impressions, clicks, user counts) to sponsors and on our public sponsor page.',
      'To keep the service secure and fix problems.',
    ]} />
    <P>We do not sell your personal data.</P>

    <H>Who processes your data</H>
    <UL items={[
      'Supabase: database and sign-in (our project is hosted in the Singapore region).',
      'Vercel: website and server hosting.',
      'Razorpay: payment processing.',
      'Google: only if you choose to sign in with Google.',
    ]} />
    <P>Sponsor cards link to third-party websites. Those sites have their own privacy practices, and we are not responsible for them.</P>

    <H>Cookies and local storage</H>
    <P>We use your browser's local storage to keep your app data and sign-in session. We do not currently use third-party analytics or advertising trackers. If that changes, we will update this page.</P>

    <H>How long we keep data</H>
    <P>We keep your account data while your account exists. You can leave the leaderboard yourself in the app. To delete your account and synced data, email us from your registered address and we will delete it within 30 days. We may keep payment records for as long as accounting, tax or legal rules require.</P>

    <H>Your rights</H>
    <P>You can ask to access, correct or delete your personal data, or to withdraw consent, by emailing <Mail />. Under applicable law, including India's Digital Personal Data Protection Act, 2023, you may have additional rights, and you can contact the same address with any grievance.</P>

    <H>Children</H>
    <P>If you are under 18, please create an account only with the involvement of a parent or guardian.</P>

    <H>Security</H>
    <P>Data is sent over HTTPS and protected by access rules so users can only read their own records. No system is perfectly secure, so please use a sign-in email only you control.</P>

    <H>Changes</H>
    <P>We may update this policy and will change the date above when we do.</P>
  </Layout>
);

/* ------------------------------------------------------------------ */
export const Terms = () => (
  <Layout title="Terms of Service">
    <P>By using {LEGAL.product} you agree to these terms. If you do not agree, please do not use the service.</P>

    <H>The service</H>
    <P>{LEGAL.product} is a Pomodoro timer with optional accounts, cloud sync, a leaderboard and a paid Pro tier. The free version has no time limit. We may add, change or remove features.</P>

    <H>Accounts</H>
    <P>You are responsible for your sign-in email and for activity on your account. Give accurate information and keep access to your email secure.</P>

    <H>Acceptable use</H>
    <UL items={[
      'Do not misuse the service, attack it, or try to access other people\'s data.',
      'Display names must not be offensive, misleading or impersonate others.',
      'Do not manipulate the leaderboard or sponsor statistics. We may remove names, entries or accounts that do.',
    ]} />

    <H>Pro and payments</H>
    <UL items={[
      'Prices are shown in Indian rupees (INR) at the time of purchase.',
      'Pro is sold as one-time payments for a period: monthly (30 days), yearly (365 days) or lifetime. There is no automatic renewal.',
      'If you buy again while Pro is active, the new period is added to the end of your current one.',
      '"Lifetime" means for as long as we offer the service.',
      'Payments are processed by Razorpay. Refunds are covered by our Refund Policy.',
      'We may change prices for future purchases.',
    ]} />

    <H>Sponsored content</H>
    <P>Free users may see sponsor cards during breaks. Sponsors are third parties. Showing a card is not an endorsement, and we are not responsible for their products, services or websites.</P>

    <H>Your data</H>
    <P>You keep ownership of what you enter, such as tasks and countdowns. You allow us to store and process it to provide the service. If you join the leaderboard, you agree that your display name and focus minutes are visible to others.</P>

    <H>Availability and disclaimer</H>
    <P>The service is provided "as is" and "as available". We try to keep it running, but we do not promise uninterrupted or error-free service, and we may suspend or change it.</P>

    <H>Limitation of liability</H>
    <P>To the extent permitted by law, we are not liable for indirect or consequential losses, and our total liability for any claim is limited to the amount you paid us in the 12 months before the claim.</P>

    <H>Termination</H>
    <P>You may stop using the service at any time. We may suspend or end access for breaches of these terms.</P>

    <H>Governing law</H>
    <P>These terms are governed by the laws of India. Courts in {LEGAL.city} have jurisdiction, subject to any rights you have under applicable consumer law.</P>

    <H>Contact</H>
    <P>Questions about these terms: <Mail />.</P>
  </Layout>
);

/* ------------------------------------------------------------------ */
export const Refund = () => (
  <Layout title="Refund and Cancellation Policy">
    <H>Cancellation</H>
    <P>Pro is a one-time payment for a fixed period. There is no subscription and no automatic renewal, so there is nothing to cancel and you will never be charged unexpectedly.</P>

    <H>Delivery</H>
    <P>Pro is a digital product. It is activated on your account right after a successful payment, and no physical shipping is involved. If your payment succeeded but Pro does not appear within a few minutes, refresh the app. If it still does not appear, contact us and we will fix it.</P>

    <H>When we refund</H>
    <UL items={[
      <><strong className="text-foreground">Charged but Pro not activated:</strong> if we cannot activate Pro after you were charged, we refund in full.</>,
      <><strong className="text-foreground">Duplicate payment:</strong> if you were charged twice for the same purchase, we refund the extra payment.</>,
      <><strong className="text-foreground">Yearly and Lifetime plans:</strong> full refund if you ask within 7 days of purchase.</>,
      <><strong className="text-foreground">Monthly plan:</strong> not refundable once activated, except in the cases above.</>,
    ]} />
    <P>Outside these cases, payments are not refundable unless the law requires it.</P>

    <H>How to ask</H>
    <P>Email <Mail /> from your registered address with your Razorpay payment ID (it is in your payment receipt) and a short note.</P>

    <H>How refunds are paid</H>
    <P>Approved refunds go back to the original payment method through Razorpay. Banks usually take 5 to 7 business days to show them. After a refund, Pro for that purchase is removed.</P>

    <H>Chargebacks</H>
    <P>Please contact us before starting a dispute with your bank so we can resolve it quickly.</P>
  </Layout>
);

/* ------------------------------------------------------------------ */
export const Contact = () => (
  <Layout title="Contact">
    <P>For support, payment problems, refunds, privacy requests or sponsorship questions, email us. We usually reply within 2 to 3 business days.</P>
    <div className="glass-panel rounded-2xl p-6 space-y-2 text-sm">
      <p><span className="text-muted-foreground">Email:</span> <Mail /></p>
      <p><span className="text-muted-foreground">Operated by:</span> {LEGAL.owner}</p>
      <p><span className="text-muted-foreground">Location:</span> {LEGAL.city}, India</p>
      <p><span className="text-muted-foreground">Grievance contact:</span> same email address</p>
    </div>
    <P>When you write about a payment, include your registered email and the Razorpay payment ID from your receipt.</P>
  </Layout>
);
