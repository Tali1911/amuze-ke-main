import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, ArrowUp, MessageCircle, Linkedin, Youtube } from 'lucide-react';
import { cmsService } from '@/services/cmsService';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
};

const Footer = () => {
  const [settings, setSettings] = useState<any>(null);
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    const data = await cmsService.getSiteSettings();
    setSettings(data?.metadata);
  };
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Default values
  const footerDesc = settings?.footer_description || 'Forest adventures and outdoor education for children at Karura Forest. Building character and confidence through nature exploration.';
  const phone = settings?.contact_phone || '0114 705 763';
  const email = settings?.contact_email || 'info@amusekenya.co.ke';
  const address = settings?.contact_address || 'Karura Forest\nGate F, Thigiri Ridge';
  const hours = settings?.contact_hours || 'Monday to Sunday: 08:00am - 05:00pm';
  const copyright = settings?.copyright_text || 'Amuse Kenya. All rights reserved.';

  // Get social links - support both new format and legacy format
  const getSocialLinks = (): SocialLink[] => {
    if (settings?.social_links && Array.isArray(settings.social_links)) {
      return settings.social_links;
    }
    // Convert legacy format
    const legacyLinks: SocialLink[] = [];
    if (settings?.social_instagram) {
      legacyLinks.push({ id: '1', platform: 'instagram', url: settings.social_instagram });
    }
    if (settings?.social_twitter) {
      legacyLinks.push({ id: '2', platform: 'twitter', url: settings.social_twitter });
    }
    if (settings?.social_facebook) {
      legacyLinks.push({ id: '3', platform: 'facebook', url: settings.social_facebook });
    }
    // Return defaults if no links
    return legacyLinks.length > 0 ? legacyLinks : [
      { id: '1', platform: 'instagram', url: '#' },
      { id: '2', platform: 'twitter', url: '#' },
      { id: '3', platform: 'facebook', url: '#' }
    ];
  };

  const socialLinks = getSocialLinks();

  const renderSocialIcon = (platform: string) => {
    if (platform === 'tiktok') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      );
    }
    const IconComponent = PLATFORM_ICONS[platform];
    return IconComponent ? <IconComponent size={20} /> : null;
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">Amuse Kenya</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              {footerDesc}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <a 
                  key={link.id}
                  href={link.url} 
                  className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors duration-300" 
                  aria-label={link.platform}
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {renderSocialIcon(link.platform)}
                </a>
              ))}
              <a 
                href={`https://api.whatsapp.com/send/?phone=${phone.replace(/\s/g, '').replace(/^\+/, '')}&text=Hello! I need assistance from Amuse Kenya&type=phone_number`} 
                className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors duration-300" 
                aria-label="WhatsApp" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <MessageCircle size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: 'Home', path: '/' },
                { label: 'About Us', path: '/about/who-we-are' },
                { label: 'Programs', path: '/programs' },
                { label: 'Gallery', path: '/gallery' },
                { label: 'Blog', path: '/blog' },
                { label: 'Announcements', path: '/announcements' },
                { label: 'Contact', path: '/contact' }
              ].map(item => (
                <li key={item.label}>
                  <Link to={item.path} className="text-gray-300 hover:text-white transition-colors duration-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Camps & Programs</h4>
            <ul className="space-y-2">
              {[
                { label: 'Day Camps', path: '/camps/day-camps' },
                { label: 'Summer Camp', path: '/camps/summer' },
                { label: 'Easter Camp', path: '/camps/easter' },
                { label: 'Mid-Term Camp', path: '/camps/mid-term' },
                { label: 'End of Year Camp', path: '/camps/end-year' },
                { label: 'Birthday Parties', path: '/group-activities/parties' },
                { label: 'Team Building', path: '/group-activities/team-building' },
                { label: 'Homeschooling', path: '/programs/homeschooling' },
                { label: 'Kenyan Experiences', path: '/experiences/kenyan-experiences' }
              ].map(item => (
                <li key={item.label}>
                  <Link to={item.path} className="text-gray-300 hover:text-white transition-colors duration-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <address className="not-italic text-gray-300 leading-relaxed">
              {address.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}<br />
                </React.Fragment>
              ))}
              <strong>Training Hours:</strong> {hours}<br /><br />
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-white transition-colors duration-300">{phone}</a><br />
              <a href={`mailto:${email}`} className="hover:text-white transition-colors duration-300">{email}</a>
            </address>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center gap-2 md:flex md:items-end md:justify-end">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} {copyright}
            </p>
            <div className="flex gap-4 text-sm">
              <Link to="/terms-and-conditions" className="text-gray-400 hover:text-white transition-colors">
                Terms & Conditions
              </Link>
              <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </div>
            <p className="text-gray-500 text-xs">
              Created by{' '}
              <a href="https://nafarrosolutions.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors underline">
                Nafarro Solutions
              </a>
            </p>
          </div>
          <button 
            onClick={scrollToTop} 
            className="bg-forest-600 hover:bg-forest-700 text-white p-2 rounded-full transition-colors duration-300 flex items-center gap-2" 
            aria-label="Scroll to top"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;