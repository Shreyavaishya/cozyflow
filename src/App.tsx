import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Appearance from "./components/Appearance";
import UpdateToast from "./components/UpdateToast";
import { loadApp } from "./lib/routes";

// Each page is its own file that is downloaded only when it is visited.
const Landing = lazy(() => import("./pages/Landing"));
const Index = lazy(loadApp);
const Embed = lazy(() => import("./pages/Embed"));
const SponsorPage = lazy(() => import("./pages/Sponsor"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Legal").then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import("./pages/Legal").then(m => ({ default: m.Terms })));
const Refund = lazy(() => import("./pages/Legal").then(m => ({ default: m.Refund })));
const Contact = lazy(() => import("./pages/Legal").then(m => ({ default: m.Contact })));

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center text-3xl" role="status" aria-label="Loading">
    <span className="animate-pulse">🍅</span>
  </div>
);

const App = () => (
  <BrowserRouter>
    <Appearance />
    <UpdateToast />
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Index />} />
        <Route path="/embed" element={<Embed />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/sponsor" element={<SponsorPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;