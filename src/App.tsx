
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

import Contact from "./pages/Contact";
import Gallery from "./pages/Gallery";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/programs/ProgramDetail";
import EasterCamp from "./pages/camps/EasterCamp";
import SummerCamp from "./pages/camps/SummerCamp";
import EndYearCamp from "./pages/camps/EndYearCamp";
import MidTermCamp from "./pages/camps/MidTermCamp";
import DayCamps from "./pages/camps/DayCamps";
import KenyanExperiencesPage from "./pages/experiences/KenyanExperiences";
import TeamBuilding from "./pages/group-activities/TeamBuilding";
import Parties from "./pages/group-activities/Parties";
import Homeschooling from "./pages/programs/Homeschooling";
import Team from "./pages/about/Team";
import WhoWeAre from "./pages/about/WhoWeAre";
import WhatWeDo from "./pages/about/WhatWeDo";
import AnnouncementsPage from "./pages/Announcements";
import RegistrationScan from "./pages/scan/RegistrationScan";
import EmailTestMonitor from "./pages/EmailTestMonitor";
import SendGridTest from "./pages/SendGridTest";
import FunctionStatus from "./pages/FunctionStatus";
import ActivityDetail from "./pages/ActivityDetail";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import ClientProfile from "./pages/ClientProfile";
import MyRegistrations from "./pages/MyRegistrations";
import ResetPassword from "./pages/ResetPassword";
import Unsubscribe from "./pages/Unsubscribe";

import { AuthProvider } from "./hooks/useAuth";
import { ClientAuthProvider } from "./hooks/useClientAuth";
import ProgramRegistration from "./components/ProgramRegistration";
import FloatingFAQ from "./components/FloatingFAQ";
import CookieConsentBanner from "./components/CookieConsentBanner";
import GoogleOneTap from "./components/GoogleOneTap";
import { PageTracker } from "./hooks/usePageTracking";
import { useState } from "react";

function App() {
  const [queryClient] = useState(() => new QueryClient());
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ClientAuthProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/contact" element={<Contact />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/programs/homeschooling" element={<Homeschooling />} />
          <Route path="/programs/homeschooling-outdoor-experiences" element={<Homeschooling />} />
          <Route path="/programs/:programId" element={<ProgramDetail />} />
              
              {/* Camp Routes */}
              <Route path="/camps/easter" element={<EasterCamp />} />
              <Route path="/camps/summer" element={<SummerCamp />} />
              <Route path="/camps/end-year" element={<EndYearCamp />} />
              <Route path="/camps/mid-term/:period" element={<MidTermCamp />} />
              <Route path="/camps/day-camps" element={<DayCamps />} />
              
              {/* Experiences Routes */}
              <Route path="/experiences/kenyan-experiences" element={<KenyanExperiencesPage />} />
              
              {/* Group Activities Routes */}
              <Route path="/group-activities/team-building" element={<TeamBuilding />} />
              <Route path="/group-activities/parties" element={<Parties />} />
          <Route path="/about/team" element={<Team />} />
          <Route path="/about/who-we-are" element={<WhoWeAre />} />
          <Route path="/about/what-we-do" element={<WhatWeDo />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
              
              {/* Registration & Scanning */}
              <Route path="/scan/:qrCode" element={<RegistrationScan />} />
              <Route path="/register/:programId" element={<ProgramRegistration />} />
              <Route path="/register" element={<ProgramRegistration />} />
              
              {/* Testing & Monitoring */}
              <Route path="/test/email-monitor" element={<EmailTestMonitor />} />
              <Route path="/test/sendgrid" element={<SendGridTest />} />
              <Route path="/test/functions" element={<FunctionStatus />} />
              
              {/* Activity Detail Pages */}
              <Route path="/activity/:slug" element={<ActivityDetail />} />
              
              {/* Legal Pages */}
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              
              {/* Client Profile */}
              <Route path="/my-profile" element={<ClientProfile />} />
              <Route path="/my-registrations" element={<MyRegistrations />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/unsubscribe/:token" element={<Unsubscribe />} />
              
              {/* Blog */}
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              
              {/* Legacy URL Redirects for SEO */}
              <Route path="/about-2" element={<Navigate to="/about/who-we-are" replace />} />
              <Route path="/amuse-camp" element={<Navigate to="/camps/day-camps" replace />} />
              <Route path="/school-holiday-camps" element={<Navigate to="/camps/day-camps" replace />} />
              <Route path="/schools" element={<Navigate to="/programs/school-experience" replace />} />
              <Route path="/services" element={<Navigate to="/programs" replace />} />
              <Route path="/book-a-service" element={<Navigate to="/contact" replace />} />
              <Route path="/book-now" element={<Navigate to="/contact" replace />} />
              <Route path="/summer-camp-2" element={<Navigate to="/camps/summer" replace />} />
              <Route path="/activities" element={<Navigate to="/programs" replace />} />

              {/* Legacy sitemap redirects (client-side fallback) */}
              <Route path="/page-sitemap.xml" element={<Navigate to="/sitemap.xml" replace />} />
              <Route path="/wp-sitemap.xml" element={<Navigate to="/sitemap.xml" replace />} />
              <Route path="/sitemap_index.xml" element={<Navigate to="/sitemap.xml" replace />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <PageTracker />
            <GoogleOneTap />
            <FloatingFAQ />
            <CookieConsentBanner />
          </AuthProvider>
          </ClientAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
