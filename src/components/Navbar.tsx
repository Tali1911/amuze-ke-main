import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown, Download, User, LogOut, Settings, Baby, Shield, ClipboardList } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import amuseLogo from "@/assets/amuse-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { navigationService, NavigationSetting } from "@/services/navigationService";
import { useClientAuth } from "@/hooks/useClientAuth";
const Navbar = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>(null);
  const [scheduleUrl, setScheduleUrl] = useState<string | null>(null);
  const [navSettings, setNavSettings] = useState<Record<string, boolean>>({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { isSignedIn, profile: clientProfile, signOut: clientSignOut, isLoading: authLoading, signInWithGoogle } = useClientAuth();

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    loadScheduleUrl();
    loadNavigationSettings();
  }, []);
  const loadNavigationSettings = async () => {
    const settings = await navigationService.getNavigationSettings();
    const visibilityMap = settings.reduce((acc, setting) => {
      acc[setting.nav_key] = setting.is_visible;
      return acc;
    }, {} as Record<string, boolean>);
    setNavSettings(visibilityMap);
    setSettingsLoaded(true);
  };
  const loadScheduleUrl = async () => {
    try {
      const {
        data
      } = await (supabase as any).from("content_items").select("metadata").eq("type", "site_settings").eq("status", "published").maybeSingle();
      if (data?.metadata?.schedule_url) {
        setScheduleUrl(data.metadata.schedule_url);
      }
    } catch (err) {
      console.error("Error loading schedule URL:", err);
    }
  };
  const handleScheduleDownload = () => {
    if (scheduleUrl) {
      window.open(scheduleUrl, "_blank");
    } else {
      toast({
        title: "Schedule Not Available",
        description: "The schedule is currently being updated. Please check back soon.",
        variant: "destructive"
      });
    }
  };
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  const handleDropdownToggle = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };
  const toggleMobileSection = (section: string) => {
    setMobileExpandedSection(mobileExpandedSection === section ? null : section);
  };
  const programDropdowns = {
    camps: {
      "Holiday Camps": [{
        name: "Easter Camp",
        path: "/camps/easter"
      }, {
        name: "Summer Camp",
        path: "/camps/summer"
      }, {
        name: "End Year Camp",
        path: "/camps/end-year"
      }],
      "Mid-Term Camps": [{
        name: "Feb/March Camp",
        path: "/camps/mid-term/feb-march"
      }, {
        name: "May/June Camp",
        path: "/camps/mid-term/may-june"
      }, {
        name: "October Camp",
        path: "/camps/mid-term/october"
      }]
      // 'Day Camps': [
      //   { name: 'Nairobi Day Camps', path: '/camps/day-camps' }
      // ]
    },
    schools: [{
      name: "Homeschooling Program",
      path: "/programs/homeschooling"
    }, {
      name: "Little Forest Explorers",
      path: "/programs/little-forest"
    }, {
      name: "School Adventures",
      path: "/programs/school-experience"
    }],
    groups: [{
      name: "Team Building",
      path: "/group-activities/team-building"
    }, {
      name: "Parties",
      path: "/group-activities/parties"
    }],
    about: [{
      name: "Meet Our Team",
      path: "/about/team"
    }, {
      name: "Who We Are",
      path: "/about/who-we-are"
    }, {
      name: "What We Do",
      path: "/about/what-we-do"
    }]
  };
  return <nav className={cn("fixed top-0 w-full z-50 transition-all duration-300 px-4 md:px-8", isScrolled || !isHomePage ? "py-2 glass-card bg-white/90 shadow-sm" : "py-4 bg-transparent")}>
      <div className="container mx-auto max-w-[1400px]">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={amuseLogo} alt="Amuse Kenya Logo" className="h-10 md:h-12 w-auto object-contain" />
          </Link>

          <ul className="hidden lg:flex items-center flex-1 justify-evenly gap-4 ml-12">
            {settingsLoaded && navSettings.home !== false && <li>
                <Link to="/" className={cn("font-medium hover-lift", isScrolled || !isHomePage ? "text-gray-700 hover:text-forest-600" : "text-white hover:text-forest-100")}>
                  Home
                </Link>
              </li>}
            {settingsLoaded && navSettings.announcements !== false && <li>
                <Link to="/announcements" className={cn("font-medium hover-lift", isScrolled || !isHomePage ? "text-gray-700 hover:text-forest-600" : "text-white hover:text-forest-100")}>
                  Announcements
                </Link>
              </li>}
            {/* About Dropdown */}
            {settingsLoaded && navSettings.about !== false && <li className="relative group">
                <button className={cn("font-medium hover-lift flex items-center gap-1", isScrolled || !isHomePage ? "text-gray-700 hover:text-forest-600" : "text-white hover:text-forest-100")} onMouseEnter={() => setActiveDropdown("about")}>
                  About Us
                  <ChevronDown size={16} />
                </button>
                <div className={cn("absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border opacity-0 invisible transition-all duration-200 z-50", activeDropdown === "about" && "opacity-100 visible")} onMouseEnter={() => setActiveDropdown("about")} onMouseLeave={() => setActiveDropdown(null)}>
                  {programDropdowns.about.map(item => <Link key={item.path} to={item.path} className="block px-4 py-3 text-gray-700 hover:bg-forest-50 hover:text-forest-600 first:rounded-t-lg last:rounded-b-lg">
                      {item.name}
                    </Link>)}
                </div>
              </li>}

            {/* Camps Mega Menu */}
            {settingsLoaded && navSettings.camps !== false && <li className="relative group">
                <button className={cn("font-medium hover-lift flex items-center gap-1", isScrolled || !isHomePage ? "text-gray-700 hover:text-forest-600" : "text-white hover:text-forest-100")} onMouseEnter={() => setActiveDropdown("camps")}>
                  Camps
                  <ChevronDown size={16} />
                </button>
                <div className={cn("absolute top-full left-0 mt-2 w-[600px] bg-white rounded-lg shadow-lg border opacity-0 invisible transition-all duration-200 z-50", activeDropdown === "camps" && "opacity-100 visible")} onMouseEnter={() => setActiveDropdown("camps")} onMouseLeave={() => setActiveDropdown(null)}>
                  <div className="grid grid-cols-2 gap-4 p-4">
                    {Object.entries(programDropdowns.camps).map(([category, items]) => <div key={category}>
                        <h3 className="font-semibold text-gray-900 mb-2 px-2">{category}</h3>
                        <div className="space-y-1">
                          {items.map(item => <Link key={item.path} to={item.path} className="block px-2 py-2 text-sm text-gray-700 hover:bg-forest-50 hover:text-forest-600 rounded">
                              {item.name}
                            </Link>)}
                        </div>
                      </div>)}
                  </div>
                </div>
              </li>}

            {/* Experiences Link */}
            {settingsLoaded && navSettings.experiences !== false && <li>
                <Link to="/experiences/kenyan-experiences" className={cn("font-medium hover-lift", isScrolled || !isHomePage ? "text-gray-700 hover:text-forest-600" : "text-white hover:text-forest-100")}>
                  Experiences
                </Link>
              </li>}

            {/* Schools Dropdown */}
            {settingsLoaded && navSettings.schools !== false && <li className="relative group">
                <button className={cn("font-medium hover-lift flex items-center gap-1", isScrolled || !isHomePage ? "text-gray-700 hover:text-forest-600" : "text-white hover:text-forest-100")} onMouseEnter={() => setActiveDropdown("schools")}>
                  Schools
                  <ChevronDown size={16} />
                </button>
                <div className={cn("absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border opacity-0 invisible transition-all duration-200 z-50", activeDropdown === "schools" && "opacity-100 visible")} onMouseEnter={() => setActiveDropdown("schools")} onMouseLeave={() => setActiveDropdown(null)}>
                  {programDropdowns.schools.map(item => <Link key={item.path} to={item.path} className="block px-4 py-3 text-gray-700 hover:bg-forest-50 hover:text-forest-600 first:rounded-t-lg last:rounded-b-lg">{item.name}
                    </Link>)}
                </div>
              </li>}

            {/* Group Activities Dropdown */}
            {settingsLoaded && navSettings.groups !== false && <li className="relative group">
                <button className={cn("font-medium hover-lift flex items-center gap-1", isScrolled || !isHomePage ? "text-gray-700 hover:text-forest-600" : "text-white hover:text-forest-100")} onMouseEnter={() => setActiveDropdown("groups")}>
                  Group Activities
                  <ChevronDown size={16} />
                </button>
                <div className={cn("absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border opacity-0 invisible transition-all duration-200 z-50", activeDropdown === "groups" && "opacity-100 visible")} onMouseEnter={() => setActiveDropdown("groups")} onMouseLeave={() => setActiveDropdown(null)}>
                  {programDropdowns.groups.map(item => <Link key={item.path} to={item.path} className="block px-4 py-3 text-gray-700 hover:bg-forest-50 hover:text-forest-600 first:rounded-t-lg last:rounded-b-lg">
                      {item.name}
                    </Link>)}
                </div>
              </li>}

            {settingsLoaded && navSettings.gallery !== false && <li>
                <Link to="/gallery" className={cn("font-medium hover-lift", isScrolled || !isHomePage ? "text-gray-700 hover:text-forest-600" : "text-white hover:text-forest-100")}>
                  Gallery
                </Link>
              </li>}
            {settingsLoaded && navSettings.contact !== false && <li>
                <Link to="/contact" className={cn("font-medium hover-lift", isScrolled || !isHomePage ? "text-gray-700 hover:text-forest-600" : "text-white hover:text-forest-100")}>
                  Contact
                </Link>
              </li>}
            {settingsLoaded && navSettings.schedules !== false && <li>
                <button onClick={handleScheduleDownload} className={cn("font-medium hover-lift flex items-center gap-2 px-4 py-2 rounded-lg transition-colors", isScrolled || !isHomePage ? "bg-forest-600 text-white hover:bg-forest-700" : "bg-white/20 text-white hover:bg-white/30 border border-white/40")}>
                  <Download size={16} />
                  Download Schedules
                </button>
              </li>}
          </ul>

          {/* Profile dropdown (desktop) - only when signed in */}
          <div className="flex items-center gap-3">
            {!authLoading && isSignedIn && clientProfile && (
              <div className="hidden lg:block relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors border",
                    isScrolled || !isHomePage
                      ? "border-gray-200 hover:bg-gray-50 text-gray-700"
                      : "border-white/30 hover:bg-white/10 text-white"
                  )}
                >
                  {clientProfile.avatar_url ? (
                    <img
                      src={clientProfile.avatar_url}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-forest-600 flex items-center justify-center text-white text-xs font-semibold">
                      {(clientProfile.full_name || clientProfile.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium max-w-[120px] truncate">
                    {clientProfile.full_name || clientProfile.email?.split('@')[0] || 'Account'}
                  </span>
                  <ChevronDown size={14} className={cn("transition-transform", profileDropdownOpen && "rotate-180")} />
                </button>

                {/* Dropdown */}
                <div className={cn(
                  "absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border overflow-hidden transition-all duration-200 z-50",
                  profileDropdownOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1"
                )}>
                  <div className="px-4 py-3 bg-forest-50 border-b">
                    <p className="text-sm font-semibold text-gray-900 truncate">{clientProfile.full_name || 'Welcome'}</p>
                    <p className="text-xs text-gray-500 truncate">{clientProfile.email}</p>
                  </div>
                  
                  <div className="py-1">
                    <Link
                      to="/my-profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User size={16} className="text-gray-400" />
                      My Profile
                    </Link>
                    <Link
                      to="/my-profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Baby size={16} className="text-gray-400" />
                      Manage Children
                    </Link>
                    <Link
                      to="/my-registrations"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <ClipboardList size={16} className="text-gray-400" />
                      My Registrations
                    </Link>
                    <Link
                      to="/privacy-policy"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Shield size={16} className="text-gray-400" />
                      Privacy & Data
                    </Link>
                  </div>

                  <div className="border-t">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        clientSignOut();
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button className="lg:hidden" onClick={toggleMobileMenu} aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}>
              {mobileMenuOpen ? <X className={isScrolled || !isHomePage ? "text-gray-800" : "text-white"} size={24} /> : <Menu className={isScrolled || !isHomePage ? "text-gray-800" : "text-white"} size={24} />}
            </button>
          </div>
        </div>

        <div className={cn("lg:hidden absolute left-0 right-0 top-full px-4 py-2 transition-all duration-300 ease-in-out transform origin-top", mobileMenuOpen ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0 pointer-events-none", "bg-white shadow-lg mt-2 rounded-lg")}>
          <ul className="py-2 space-y-1">
            {settingsLoaded && navSettings.home !== false && <li>
                <Link to="/" className="block py-2 px-4 font-medium text-gray-800 hover:text-forest-600 hover:bg-gray-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>
                  Home
                </Link>
              </li>}
            {settingsLoaded && navSettings.announcements !== false && <li>
                <Link to="/announcements" className="block py-2 px-4 font-medium text-gray-800 hover:text-forest-600 hover:bg-gray-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>
                  Announcements
                </Link>
              </li>}
            {/* About Submenu */}
            {settingsLoaded && navSettings.about !== false && <li>
                <button onClick={() => toggleMobileSection("about")} className="w-full flex items-center justify-between py-2 px-4 font-medium text-gray-800 hover:bg-gray-50 rounded-md">
                  <span>About</span>
                  <ChevronDown size={16} className={cn("transition-transform duration-200", mobileExpandedSection === "about" && "rotate-180")} />
                </button>
                <div className={cn("overflow-hidden transition-all duration-200", mobileExpandedSection === "about" ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}>
                  {programDropdowns.about.map(item => <Link key={item.path} to={item.path} className="block py-2 px-8 text-sm text-gray-700 hover:text-forest-600 hover:bg-gray-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>
                      {item.name}
                    </Link>)}
                </div>
              </li>}

            {/* Camps Submenu */}
            {settingsLoaded && navSettings.camps !== false && <li>
                <button onClick={() => toggleMobileSection("camps")} className="w-full flex items-center justify-between py-2 px-4 font-medium text-gray-800 hover:bg-gray-50 rounded-md">
                  <span>Camps</span>
                  <ChevronDown size={16} className={cn("transition-transform duration-200", mobileExpandedSection === "camps" && "rotate-180")} />
                </button>
                <div className={cn("overflow-hidden transition-all duration-200", mobileExpandedSection === "camps" ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0")}>
                  {Object.entries(programDropdowns.camps).map(([category, items]) => <div key={category} className="ml-4 mb-2">
                      <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">{category}</div>
                      {items.map(item => <Link key={item.path} to={item.path} className="block py-2 px-8 text-sm text-gray-700 hover:text-forest-600 hover:bg-gray-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>
                          {item.name}
                        </Link>)}
                    </div>)}
                </div>
              </li>}

            {/* Experiences */}
            {settingsLoaded && navSettings.experiences !== false && <li>
                <Link to="/experiences/kenyan-experiences" className="block py-2 px-4 font-medium text-gray-800 hover:text-forest-600 hover:bg-gray-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>
                  Experiences
                </Link>
              </li>}

            {/* Schools Submenu */}
            {settingsLoaded && navSettings.schools !== false && <li>
                <button onClick={() => toggleMobileSection("schools")} className="w-full flex items-center justify-between py-2 px-4 font-medium text-gray-800 hover:bg-gray-50 rounded-md">
                  <span>Schools</span>
                  <ChevronDown size={16} className={cn("transition-transform duration-200", mobileExpandedSection === "schools" && "rotate-180")} />
                </button>
                <div className={cn("overflow-hidden transition-all duration-200", mobileExpandedSection === "schools" ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}>
                  {programDropdowns.schools.map(item => <Link key={item.path} to={item.path} className="block py-2 px-8 text-sm text-gray-700 hover:text-forest-600 hover:bg-gray-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>
                      {item.name}
                    </Link>)}
                </div>
              </li>}

            {/* Group Activities Submenu */}
            {settingsLoaded && navSettings.groups !== false && <li>
                <button onClick={() => toggleMobileSection("groups")} className="w-full flex items-center justify-between py-2 px-4 font-medium text-gray-800 hover:bg-gray-50 rounded-md">
                  <span>Group Activities</span>
                  <ChevronDown size={16} className={cn("transition-transform duration-200", mobileExpandedSection === "groups" && "rotate-180")} />
                </button>
                <div className={cn("overflow-hidden transition-all duration-200", mobileExpandedSection === "groups" ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}>
                  {programDropdowns.groups.map(item => <Link key={item.path} to={item.path} className="block py-2 px-8 text-sm text-gray-700 hover:text-forest-600 hover:bg-gray-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>
                      {item.name}
                    </Link>)}
                </div>
              </li>}

            {settingsLoaded && navSettings.gallery !== false && <li>
                <Link to="/gallery" className="block py-2 px-4 font-medium text-gray-800 hover:text-forest-600 hover:bg-gray-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>
                  Gallery
                </Link>
              </li>}

            {settingsLoaded && navSettings.contact !== false && <li>
                <Link to="/contact" className="block py-2 px-4 font-medium text-gray-800 hover:text-forest-600 hover:bg-gray-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>
                  Contact
                </Link>
              </li>}

            {settingsLoaded && navSettings.schedules !== false && <li>
                <button onClick={() => {
              handleScheduleDownload();
              setMobileMenuOpen(false);
            }} className="w-full flex items-center justify-center gap-2 py-2 px-4 font-medium text-white bg-forest-600 hover:bg-forest-700 rounded-md">
                  <Download size={16} />
                  Download Schedules
                </button>
              </li>}

            {/* Mobile Profile Section - only when signed in */}
            {!authLoading && isSignedIn && clientProfile && (
              <li className="border-t mt-2 pt-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-4 py-2">
                    {clientProfile.avatar_url ? (
                      <img src={clientProfile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-forest-600 flex items-center justify-center text-white text-sm font-semibold">
                        {(clientProfile.full_name || clientProfile.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{clientProfile.full_name || 'Welcome'}</p>
                      <p className="text-xs text-gray-500 truncate">{clientProfile.email}</p>
                    </div>
                  </div>
                  <Link to="/my-profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-2 px-4 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                    <User size={16} className="text-gray-400" /> My Profile
                  </Link>
                  <Link to="/my-registrations" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-2 px-4 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                    <ClipboardList size={16} className="text-gray-400" /> My Registrations
                  </Link>
                  <button
                    onClick={() => { clientSignOut(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 w-full py-2 px-4 text-sm text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>;
};
export default Navbar;