
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";

// Public Pages
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import ContactPage from "./pages/ContactPage";
import BookingPage from "./pages/BookingPage";
import SearchPage from "./pages/SearchPage";
import MemorialPage from "./pages/MemorialPage";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { AdminPayments, AdminUsers, AdminMessages, AdminPackages, AdminPageContent } from "./pages/admin/AdminStubs";
import { AdminServices, AdminBanners, AdminHeroSlides, AdminTestimonials, AdminGallery, AdminSettings, AdminFAQs } from "./pages/admin/AdminCMS";

// Layout Components
import Header from "./components/ui/Header";
import Footer from "./components/ui/Footer";

import NotFound from "./pages/NotFound";
import WhatsAppButton from "./components/ui/WhatsAppButton";

const queryClient = new QueryClient();

// Layout wrapper for public pages
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <WhatsAppButton />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
              <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
              <Route path="/services" element={<PublicLayout><ServicesPage /></PublicLayout>} />
              <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
              <Route path="/book" element={<PublicLayout><BookingPage /></PublicLayout>} />
              <Route path="/search" element={<PublicLayout><SearchPage /></PublicLayout>} />
              <Route path="/memorial/:id" element={<PublicLayout><MemorialPage /></PublicLayout>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/bookings"  element={<AdminDashboard initialTab="bookings" />} />
              <Route path="/admin/memorials" element={<AdminDashboard initialTab="memorials" />} />
              <Route path="/admin/payments"     element={<AdminPayments />} />
              <Route path="/admin/services"     element={<AdminServices />} />
              <Route path="/admin/banners"      element={<AdminBanners />} />
              <Route path="/admin/heroslides"   element={<AdminHeroSlides />} />
              <Route path="/admin/testimonials" element={<AdminTestimonials />} />
              <Route path="/admin/gallery"      element={<AdminGallery />} />
              <Route path="/admin/users"        element={<AdminUsers />} />
              <Route path="/admin/messages"     element={<AdminMessages />} />
              <Route path="/admin/settings"     element={<AdminSettings />} />
              <Route path="/admin/faqs"         element={<AdminFAQs />} />
              <Route path="/admin/packages"     element={<AdminPackages />} />
              <Route path="/admin/page-content"  element={<AdminPageContent />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
