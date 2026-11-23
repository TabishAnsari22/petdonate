import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SanctuaryProvider } from './context/SanctuaryContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import EmergencyAssistancePage from './pages/EmergencyAssistancePage';
import ApplyPage from './pages/ApplyPage';
import DonatePage from './pages/DonatePage';
import CampaignsPage from './pages/CampaignsPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import SuccessStoriesPage from './pages/SuccessStoriesPage';
import GetInvolvedPage from './pages/GetInvolvedPage';
import VeterinaryPartnersPage from './pages/VeterinaryPartnersPage';
import TransparencyPage from './pages/TransparencyPage';
import ContactPage from './pages/ContactPage';
import FaqsPage from './pages/FaqsPage';
import LegalPage from './pages/LegalPage';

gsap.registerPlugin(ScrollTrigger);

function ScrollManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  }, [pathname]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <SanctuaryProvider>
        <BrowserRouter>
          <ScrollManager />
          <div className="min-h-screen flex flex-col bg-[#F7F4EE] text-[#242824]">
          <Navbar />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/emergency-assistance" element={<EmergencyAssistancePage />} />
              <Route path="/apply" element={<ApplyPage />} />
              <Route path="/donate" element={<DonatePage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
              <Route path="/success-stories" element={<SuccessStoriesPage />} />
              <Route path="/get-involved" element={<GetInvolvedPage />} />
              <Route path="/veterinary-partners" element={<VeterinaryPartnersPage />} />
              <Route path="/transparency" element={<TransparencyPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/faqs" element={<FaqsPage />} />
              <Route path="/privacy" element={<LegalPage mode="privacy" />} />
              <Route path="/terms" element={<LegalPage mode="terms" />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </SanctuaryProvider>
    </MotionConfig>
  );
}
