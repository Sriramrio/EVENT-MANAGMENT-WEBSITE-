import React, {
  useState,
  useEffect,
  useCallback,
  type FormEvent,
  type MouseEvent,
} from "react";
import lubLogo from "../../assets/images/lub-logo.jpg";
import msmeSangamam from "../../assets/images/msme-sangamam.png";
import page1 from "../../assets/p1.jpeg";

import page2 from "../../assets/p2.jpeg";
import page3 from "../../assets/page6.jpeg";
import page4 from "../../assets/p4.jpeg";
import minsiter from "../../assets/Inaugated.jpeg";
import mathanImg from "../../assets/MATHAN RAJA.png";
import muruganImg from "../../assets/MURUGAN L.png";
// SPONSORS LOGOS
import crpIndiaLogo from "../../assets/SPONSORS/CRP INDIA.png";
import cubLogo from "../../assets/SPONSORS/City-Union-Bank-01.png";
import enerpacLogo from "../../assets/SPONSORS/ENERPAC.png";
import sidbiUpdatedLogo from "../../assets/SPONSORS/SIDBI UPDATED LOGO.jpg";
import srimukhaLogo from "../../assets/SPONSORS/SRIMUKHA.png";
import sundaramLogo from "../../assets/SPONSORS/SUNDARMHLD.NS_BIG (1).png";
import venkateswaraLogo from "../../assets/SPONSORS/VENKATESWARA.png";
import gemSponsorLogo from "../../assets/SPONSORS/gem.png";

// SUPPORTED BY LOGOS
import fameTnLogo from "../../assets/SUPPORTED BY/Fame TN Logo.jpg";
import msmeDiLogo from "../../assets/SUPPORTED BY/MSME DI LOGO.png";

// SUPPORTING INDUSTRY ASSOCIATION LOGOS
import aiemaLogo from "../../assets/SUPPORTING INDUSTRY ASSOCIATION/AIEMA.png";
import biaLogo from "../../assets/SUPPORTING INDUSTRY ASSOCIATION/BIA.png";
import elcinaLogo from "../../assets/SUPPORTING INDUSTRY ASSOCIATION/ELCINA.png";
import tiemaLogo from "../../assets/SUPPORTING INDUSTRY ASSOCIATION/TIEMA LOGO.png";
import hiaLogo from "../../assets/SUPPORTING INDUSTRY ASSOCIATION/hosur_industries_association_logo.jpeg";

// EVENT PARTNERS LOGOS
import adhiyamaanLogo from "../../assets/EVENT PARTNERS/ADHIYAMAN ENGG COLLEGE.jpeg";
import arhaLogo from "../../assets/EVENT PARTNERS/ARHA HOISPITAL.png";
import janamTvLogo from "../../assets/EVENT PARTNERS/JANAM TV.jpg";
import nammaHosurLogo from "../../assets/EVENT PARTNERS/NAMMA HOSUR.png";
import rameshwaramLogo from "../../assets/EVENT PARTNERS/RAMESHWARAM CAFE.png";
import atribsLogo from "../../assets/atribs_consulting_logo.jpg";

type BrochurePage = "p0" | "p1" | "p2" | "p3" | "p4";
type BrochurePlaceholderKey = "p2" | "p3" | "p4";
type BookingStep = 1 | 2 | 3;
type StallType = "Platinum" | "Gold" | "Silver";
import { Link, useNavigate } from "react-router-dom";
import { BRAND } from "../../config/brand";
import { StallSizeOption } from "../../features/stalls/StallMasterPage";
import { apiClient } from "../../data/api/apiClient";
import { appConfig } from "../../config/appConfig";
import { FloatingSupportFooter } from "../../components/BaseComponents/FloatingSupportFooter";
interface Countdown {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

interface SelectedStall {
  id: string;
  type: StallType;
  rate: number;
}

interface SuccessData {
  id: string;
  stall: string;
  company: string;
}

interface MatchResultItem {
  buyer: string;
  fit: string;
  requirement: string;
}

interface MatchResults {
  companyName: string;
  data: MatchResultItem[];
}

const ASSETS = {
  lubLogo,
  msmeSangamam,
  page1,
  page2,
  page3,
  page4,
} as const;

const BROCHURE_PLACEHOLDERS: Record<BrochurePlaceholderKey, string> = {
  p2: "https://placehold.co/600x800/F4F7FA/0054A6?text=Layout+Page+2",
  p3: "https://placehold.co/600x800/F4F7FA/0054A6?text=Layout+Page+3",
  p4: "https://placehold.co/600x800/F4F7FA/0054A6?text=Payment+Guide+Page+4",
};

const TARGET_DATE = new Date("2026-09-18T09:00:00").getTime();
const CUSTOM_STYLES = `
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: #E8EFF6; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #F05A28, #0054A6); border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: #009245; }

        .glass-panel {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(0, 84, 166, 0.08);
        }

        .enterprise-bg {
            background-color: #F4F7FA;
            background-image:
                radial-gradient(at 10% 20%, rgba(240, 90, 40, 0.04) 0px, transparent 50%),
                radial-gradient(at 90% 10%, rgba(0, 84, 166, 0.05) 0px, transparent 50%),
                radial-gradient(at 50% 80%, rgba(0, 146, 69, 0.03) 0px, transparent 50%);
            background-attachment: fixed;
        }

        @keyframes pulse-ring {
            0% { transform: scale(0.95); opacity: 0.6; }
            50% { transform: scale(1.05); opacity: 0.2; }
            100% { transform: scale(0.95); opacity: 0.6; }
        }
        .glow-ring-orange { animation: pulse-ring 4s infinite ease-in-out; }

        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
        }
        .float-anim { animation: float 6s infinite ease-in-out; }

        .enterprise-card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            transition: all 0.3s ease;
        }
        .enterprise-card:hover {
            border-color: rgba(0, 84, 166, 0.3);
            box-shadow: 0 12px 40px rgba(0, 84, 166, 0.1);
            transform: translateY(-4px);
        }

        @keyframes marquee-left {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0%); }
        }
        .marquee-track-left {
            display: flex;
            width: max-content;
            animation: marquee-left 36s linear infinite;
        }
        .marquee-track-right {
            display: flex;
            width: max-content;
            animation: marquee-right 36s linear infinite;
        }
        .marquee-container:hover .marquee-track-left,
        .marquee-container:hover .marquee-track-right {
            animation-play-state: paused;
        }
`;

const TAILWIND_CONFIG = {
  theme: {
    extend: {
      colors: {
        lub: {
          orange: "#F05A28",
          blue: "#0054A6",
          green: "#009245",
          deepNavy: "#0F172A",
          slateCard: "#FFFFFF",
          gold: "#D4AF37",
          enterpriseBg: "#F4F7FA",
          enterpriseAlt: "#EBF0F7",
          enterpriseDark: "#1E3A5F",
          enterpriseMid: "#2C5282",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
        heritage: ["Cinzel", "serif"],
      },
      boxShadow: {
        "glow-orange": "0 10px 40px rgba(240, 90, 40, 0.2)",
        "glow-blue": "0 10px 40px rgba(0, 84, 166, 0.2)",
        "glow-green": "0 10px 40px rgba(0, 146, 69, 0.15)",
        card: "0 4px 20px rgba(30, 58, 95, 0.06)",
        "card-hover": "0 12px 40px rgba(0, 84, 166, 0.1)",
        nav: "0 4px 30px rgba(30, 58, 95, 0.08)",
      },
    },
  },
} as const;

declare global {
  interface Window {
    tailwind?: {
      config: typeof TAILWIND_CONFIG;
    };
  }
}
type AvailableStallSizeGroup = {
  stallSizeId: string;
  code: string;
  displayName: string;
  baseAmount: number;
  totalAmount: number;
  availableStalls: StallPreferenceOption[];
};
type StallPreferenceOption = {
  id: string;
  stallNumber: string;
  hallName?: string | null;
  zoneName?: string | null;
  isSponsor: boolean;
};

type PartnerItem = {
  name: string;
  src: string;
  role?: string;
};

const PARTNER_SLIDES = [
  {
    id: "supported",
    slideNumber: "01",
    title: "Supported By",
    badge: "Government & Institutional Support",
    badgeColor: "bg-blue-50 text-lub-blue border-blue-200",
    direction: "left",
    items: [
      { name: "MSME Development & Facilitation Office", src: msmeDiLogo },
      { name: "FaME TN", src: fameTnLogo },
    ],
  },
  {
    id: "associations",
    slideNumber: "02",
    title: "Supporting Industry Associations",
    badge: "Apex Industry Bodies & Councils",
    badgeColor: "bg-emerald-50 text-lub-green border-emerald-200",
    direction: "left",
    items: [
      { name: "Hosur Industries Association (HIA)", src: hiaLogo },
      { name: "BIA", src: biaLogo },
      { name: "AIEMA", src: aiemaLogo },
      { name: "ELCINA", src: elcinaLogo },
      { name: "TIEMA", src: tiemaLogo },
    ],
  },
  {
    id: "sponsors",
    slideNumber: "03",
    title: "Sponsors",
    badge: "Official Sponsors",
    badgeColor: "bg-orange-50 text-lub-orange border-orange-200",
    direction: "left",
    items: [
      { name: "GeM Portal", src: gemSponsorLogo },
      { name: "SIDBI", src: sidbiUpdatedLogo },
      { name: "City Union Bank", src: cubLogo },
      { name: "Sundaram Finance", src: sundaramLogo },
      { name: "Venkateswara Steels & Springs", src: venkateswaraLogo },
      { name: "Srimukha Precision", src: srimukhaLogo },
      { name: "CRP India", src: crpIndiaLogo },
      { name: "Enerparc", src: enerpacLogo },
    ],
  },
  {
    id: "partners",
    slideNumber: "04",
    title: "Event Partners",
    badge: "Ecosystem & Media Collaborators",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    direction: "left",
    items: [
      {
        name: "Adhiyamaan College of Engineering",
        src: adhiyamaanLogo,
        role: "Academia Partner",
      },
      {
        name: "The Rameshwaram Cafe",
        src: rameshwaramLogo,
        role: "Hospitality Partner",
      },
      {
        name: "Arha Multi Speciality Hospital",
        src: arhaLogo,
        role: "Medical Partner",
      },
      { name: "Janam TV", src: janamTvLogo, role: "Media Partner" },
      { name: "Atribs Global", src: atribsLogo, role: "Digital Partner" },
    ],
  },
] as const;

function getRepeatedMarqueeItems(items: readonly PartnerItem[]) {
  let repeated = [...items];
  while (repeated.length < 10) {
    repeated = [...repeated, ...items];
  }
  return [...repeated, ...repeated];
}

export function NotFoundPage(): React.JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePartnerSlide, setActivePartnerSlide] = useState<
    "all" | "sponsors" | "supported" | "associations" | "partners"
  >("all");
  const [activeBrochureTab, setActiveBrochureTab] =
    useState<BrochurePage>("p0");
  const [brochureSrc, setBrochureSrc] = useState<Record<BrochurePage, string>>({
    p0: ASSETS.page1,
    p1: ASSETS.msmeSangamam,
    p2: ASSETS.page2,
    p3: ASSETS.page3,
    p4: ASSETS.page4,
  });
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState<Countdown>({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<BookingStep>(1);
  const [modalProgress, setModalProgress] = useState("33%");
  const [selectedStall, setSelectedStall] = useState<SelectedStall>({
    id: "A1",
    type: "Platinum",
    rate: 63000,
  });
  const [formCompany, setFormCompany] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formSector, setFormSector] = useState("");
  const [formUtr, setFormUtr] = useState("");
  const [platLeft, setPlatLeft] = useState(12);
  const [goldLeft, setGoldLeft] = useState(40);
  const [silverLeft, setSilverLeft] = useState(130);
  const [matchCompany, setMatchCompany] = useState("");
  const [matchProduct, setMatchProduct] = useState("");
  const [matchResults, setMatchResults] = useState<MatchResults | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [warningToast, setWarningToast] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SuccessData>({
    id: "LUB-TN-8911",
    stall: "A1",
    company: "Example",
  });
  const [showPromoPopup, setShowPromoPopup] = useState(false);
  const [stallSizes, setStallSizes] = useState<StallSizeOption[]>([]);
  const [allAvailableStalls, setAllAvailableStalls] = useState<
    AvailableStallSizeGroup[]
  >([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    document.documentElement.classList.add("scroll-smooth");

    const fontPreconnect1 = document.createElement("link");
    fontPreconnect1.rel = "preconnect";
    fontPreconnect1.href = "https://fonts.googleapis.com";
    document.head.appendChild(fontPreconnect1);

    const fontPreconnect2 = document.createElement("link");
    fontPreconnect2.rel = "preconnect";
    fontPreconnect2.href = "https://fonts.gstatic.com";
    fontPreconnect2.crossOrigin = "anonymous";
    document.head.appendChild(fontPreconnect2);

    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Cinzel:wght@600;700;800&display=swap";
    document.head.appendChild(fontLink);

    const faLink = document.createElement("link");
    faLink.rel = "stylesheet";
    faLink.href =
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    document.head.appendChild(faLink);

    const tailwindScript = document.createElement("script");
    tailwindScript.src = "https://cdn.tailwindcss.com";
    tailwindScript.onload = () => {
      if (window.tailwind) {
        window.tailwind.config = TAILWIND_CONFIG;
      }
    };
    document.head.appendChild(tailwindScript);

    return () => {
      document.documentElement.classList.remove("scroll-smooth");
    };
  }, []);
  useEffect(() => {
    const openTimer = setTimeout(() => {
      setShowPromoPopup(true);
    }, 1500);

    return () => clearTimeout(openTimer);
  }, []);
  useEffect(() => {
    if (!showPromoPopup) return;

    const closeTimer = setTimeout(() => {
      setShowPromoPopup(false);
    }, 40000);

    return () => clearTimeout(closeTimer);
  }, [showPromoPopup]);
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = TARGET_DATE - now;
      if (difference > 0) {
        setCountdown({
          days: String(Math.floor(difference / (1000 * 60 * 60 * 24))).padStart(
            2,
            "0",
          ),
          hours: String(
            Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          ).padStart(2, "0"),
          minutes: String(
            Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          ).padStart(2, "0"),
          seconds: String(
            Math.floor((difference % (1000 * 60)) / 1000),
          ).padStart(2, "0"),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    apiClient
      .get<StallSizeOption[]>(
        `/public/events/${appConfig.defaultEventCode}/stall-sizes`,
      )
      .then(setStallSizes)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (stallSizes.length === 0) return;

    async function loadAvailableStalls() {
      setLoading(true);

      try {
        const groups = await Promise.all(
          stallSizes.map(async (size) => {
            try {
              const availableStalls = await apiClient.get<
                StallPreferenceOption[]
              >(
                `/public/events/${appConfig.defaultEventCode}/stalls?stallSizeId=${size.id}`,
              );

              return {
                stallSizeId: size.id,
                code: size.code,
                displayName: size.displayName,
                baseAmount: size.baseAmount,
                totalAmount: size.totalAmount,
                availableStalls,
              };
            } catch {
              return {
                stallSizeId: size.id,
                code: size.code,
                displayName: size.displayName,
                baseAmount: size.baseAmount,
                totalAmount: size.totalAmount,
                availableStalls: [],
              };
            }
          }),
        );

        setAllAvailableStalls(groups);
      } finally {
        setLoading(false);
      }
    }

    loadAvailableStalls();
  }, [stallSizes]);

  useEffect(() => {
    if (!warningToast) return undefined;
    const timeout = setTimeout(() => setWarningToast(null), 3000);
    return () => clearTimeout(timeout);
  }, [warningToast]);

  const totalAvailableStalls = allAvailableStalls.reduce(
    (sum, group) =>
      sum + group.availableStalls.filter((s) => !s.isSponsor).length,
    0,
  );

  const handleSmoothScroll = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, href: string) => {
      event.preventDefault();
      const target = document.querySelector(href);
      if (target instanceof HTMLElement) {
        window.scrollTo({ top: target.offsetTop - 120, behavior: "smooth" });
      }
      setMobileMenuOpen(false);
    },
    [],
  );

  const switchBrochureTab = useCallback((activePage: BrochurePage) => {
    setActiveBrochureTab(activePage);
  }, []);

  const handleBrochureError = useCallback((page: BrochurePlaceholderKey) => {
    setBrochureSrc((prev: Record<BrochurePage, string>) => ({
      ...prev,
      [page]: BROCHURE_PLACEHOLDERS[page],
    }));
  }, []);

  const selectStall = useCallback(
    (id: string, type: StallType, rate: number) => {
      setSelectedStall({ id, type, rate });
      setModalProgress("33%");
      setBookingStep(1);
      setModalOpen(true);
    },
    [],
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const submitBooking = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setModalProgress("66%");
    setBookingStep(2);
  }, []);

  const confirmPayment = useCallback(() => {
    if (!formUtr || formUtr.trim() === "") {
      setWarningToast("Please submit a valid reference code first.");
      return;
    }

    setSuccessData({
      id: `LUB-TN-${Math.floor(Math.random() * 90000 + 10000)}`,
      stall: `${selectedStall.id} (${selectedStall.type})`,
      company: formCompany,
    });

    if (selectedStall.type === "Platinum") {
      setPlatLeft((count: number) => (count > 0 ? count - 1 : count));
    } else if (selectedStall.type === "Gold") {
      setGoldLeft((count: number) => (count > 0 ? count - 1 : count));
    } else {
      setSilverLeft((count: number) => (count > 0 ? count - 1 : count));
    }

    setModalProgress("100%");
    setBookingStep(3);
  }, [formUtr, formCompany, selectedStall]);

  const simulateMatchmaking = useCallback(() => {
    const companyName = matchCompany || "Your Enterprise";

    if (!matchProduct) {
      setMatchResults(null);
      setMatchError("Please select a primary sector focus first!");
      return;
    }

    let data: MatchResultItem[] = [];
    if (matchProduct === "cnc") {
      data = [
        {
          buyer: "Ashok Leyland Sourcing Division",
          fit: "98% Fit",
          requirement: "Transmission housings & gear blanks",
        },
        {
          buyer: "Ather Energy Hosur Assembly",
          fit: "92% Fit",
          requirement: "Chassis brackets & mounting panels",
        },
      ];
    } else if (matchProduct === "pcb") {
      data = [
        {
          buyer: "TVS Motor EV Division",
          fit: "95% Fit",
          requirement: "Power controller boards & circuit setups",
        },
        {
          buyer: "BEL Aerospace Sourcing Unit",
          fit: "90% Fit",
          requirement: "Interconnect looms & wiring harnesses",
        },
      ];
    } else if (matchProduct === "textiles") {
      data = [
        {
          buyer: "Co-optex State Export Unit",
          fit: "99% Fit",
          requirement: "Organic weaves & technical safety uniforms",
        },
      ];
    }

    setMatchError(null);
    setMatchResults({ companyName, data });
  }, [matchCompany, matchProduct]);

  const handleModalBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        closeModal();
      }
    },
    [closeModal],
  );

  const getBrochureTabClass = (page: BrochurePage): string => {
    const isActive = activeBrochureTab === page;
    return `brochure-tab flex-1 min-w-[150px] px-6 py-5 text-center font-extrabold text-sm uppercase tracking-wider transition focus:outline-none border-b-2 ${
      isActive
        ? "border-lub-blue text-lub-blue"
        : "border-transparent text-slate-400 hover:text-slate-700"
    }`;
  };

  return (
    <>
      <style>{CUSTOM_STYLES}</style>
      {warningToast && (
        <div className="fixed top-32 right-6 bg-lub-orange text-white px-6 py-3 rounded-xl shadow-lg z-50 text-sm font-bold border border-orange-300">
          {warningToast}
        </div>
      )}

      <div className="enterprise-bg text-slate-800 font-sans selection:bg-lub-blue selection:text-white overflow-x-hidden">
        {/* ===== NAVIGATION ===== */}
        <nav className="fixed top-0 left-0 w-full z-50 bg-white/98 backdrop-blur-xl border-b border-slate-200/80 shadow-nav">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 h-20 sm:h-24">
              {/* Dual Logo Composite */}
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href="#"
                  className="flex shrink-0 items-center justify-center p-1.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition"
                >
                  <img
                    src={ASSETS.lubLogo}
                    alt="Laghu Udyog Bharati Official Logo"
                    className="h-11 sm:h-14 w-auto object-contain block"
                  />
                </a>
                <a
                  href="#"
                  className="flex shrink-0 items-center justify-center p-1.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition"
                >
                  <img
                    src={BRAND.msmeLogoUrl}
                    alt="MSME Sangamam Connect"
                    className="h-11 sm:h-14 w-auto object-contain block"
                  />
                </a>
              </div>

              {/* Desktop Nav */}
              <div className="hidden xl:flex items-center gap-8 shrink-0">
                <a
                  href="#about"
                  onClick={(e) => handleSmoothScroll(e, "#about")}
                  className="text-slate-700 hover:text-lub-blue transition duration-200 text-sm font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-lub-orange shrink-0"></span>{" "}
                  About
                </a>
                <a
                  href="#sectors"
                  onClick={(e) => handleSmoothScroll(e, "#sectors")}
                  className="text-slate-700 hover:text-lub-blue transition duration-200 text-sm font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-lub-blue shrink-0"></span>{" "}
                  Focus Sectors
                </a>
                <a
                  href="#heritage"
                  onClick={(e) => handleSmoothScroll(e, "#heritage")}
                  className="text-slate-700 hover:text-lub-blue transition duration-200 text-sm font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-lub-green shrink-0"></span>{" "}
                  Heritage Hub
                </a>
                <a
                  href="#supported-sponsored"
                  onClick={(e) => handleSmoothScroll(e, "#supported-sponsored")}
                  className="text-slate-700 hover:text-lub-blue transition duration-200 text-sm font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-lub-orange shrink-0"></span>{" "}
                  Supported &amp; Sponsored By
                </a>
                <a
                  href="#brochure"
                  onClick={(e) => {
                    handleSmoothScroll(e, "#brochure");
                    switchBrochureTab("p2");
                  }}
                  className="text-slate-700 hover:text-lub-blue transition duration-200 text-sm font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>{" "}
                  Stall Map
                </a>
              </div>

              {/* CTA */}
              <div className="hidden sm:flex items-center gap-3 shrink-0">
                <Link
                  to="/stall-booking"
                  className="px-5 py-3 rounded-lg text-sm font-extrabold uppercase tracking-wider bg-gradient-to-r from-lub-blue to-lub-enterpriseMid text-white hover:shadow-glow-blue transition duration-300 transform hover:-translate-y-0.5 shadow-md whitespace-nowrap"
                >
                  <i className="fa-solid fa-hotel mr-2"></i>Book Stall
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-3 rounded-lg text-sm font-extrabold uppercase tracking-wider border-2 border-lub-blue text-lub-blue hover:bg-lub-blue hover:text-white transition duration-300 transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                  <i className="fa-solid fa-right-to-bracket mr-2"></i>Login
                </Link>
                {/* <Link to="/exhibitor/login" className="px-5 py-3 rounded-lg text-sm font-extrabold uppercase tracking-wider border-2 border-lub-blue text-lub-blue hover:bg-lub-blue hover:text-white transition duration-300 transform hover:-translate-y-0.5 whitespace-nowrap">
                                    <i className="fa-solid fa-right-to-bracket mr-2"></i>Exhibitor
                                </Link> */}
              </div>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="xl:hidden shrink-0 text-slate-700 hover:text-lub-blue focus:outline-none p-2 rounded-xl bg-slate-100 border border-slate-200"
              >
                <i className="fa-solid fa-bars text-2xl"></i>
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          <div
            className={`${mobileMenuOpen ? "" : "hidden "}xl:hidden bg-white border-b border-slate-200 py-8 px-8 space-y-5 shadow-inner`}
          >
            <a
              href="#about"
              onClick={(e) => handleSmoothScroll(e, "#about")}
              className="block text-slate-800 hover:text-lub-blue font-extrabold text-lg py-2"
            >
              About Expo
            </a>
            <a
              href="#sectors"
              onClick={(e) => handleSmoothScroll(e, "#sectors")}
              className="block text-slate-800 hover:text-lub-blue font-extrabold text-lg py-2"
            >
              Focus Sectors
            </a>
            <a
              href="#heritage"
              onClick={(e) => handleSmoothScroll(e, "#heritage")}
              className="block text-slate-800 hover:text-lub-blue font-extrabold text-lg py-2"
            >
              Heritage Hub
            </a>
            <a
              href="#supported-sponsored"
              onClick={(e) => handleSmoothScroll(e, "#supported-sponsored")}
              className="block text-slate-800 hover:text-lub-blue font-extrabold text-lg py-2"
            >
              Supported &amp; Sponsored By
            </a>
            <a
              href="#brochure"
              onClick={(e) => {
                handleSmoothScroll(e, "#floorplan");
                switchBrochureTab("p2");
              }}
              className="block text-slate-800 hover:text-lub-blue font-extrabold text-lg py-2"
            >
              Stall Map
            </a>
            <Link
              to="/stall-booking"
              className="block text-center py-4 bg-gradient-to-r from-lub-blue to-lub-enterpriseMid text-white rounded-xl font-extrabold text-lg shadow-md mt-4"
            >
              <i className="fa-solid fa-hotel mr-2"></i>Book a Stall Now
            </Link>
            <Link
              to="/login"
              className="block text-center py-4 border-2 border-lub-blue text-lub-blue rounded-xl font-extrabold text-lg mt-4"
            >
              <i className="fa-solid fa-right-to-bracket mr-2"></i>Login
            </Link>
            {/* <Link to="/exhibitor/login" className="block text-center py-4 border-2 border-lub-blue text-lub-blue rounded-xl font-extrabold text-lg mt-4">
                            <i className="fa-solid fa-right-to-bracket mr-2"></i>Exhibitor Login
                        </Link> */}
          </div>
        </nav>

        {/* Inourgaion */}
        {/* ===== HERO SECTION 2: INAUGURATION & EVENT HIGHLIGHTS ===== */}
        <section className="relative overflow-hidden bg-white pt-33 py-22 sm:py-24 lg:py-28 border-y border-slate-100">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-lub-orange/10 blur-3xl"></div>
            <div className="absolute -bottom-32 -right-32 w-[430px] h-[430px] rounded-full bg-lub-blue/10 blur-3xl"></div>

            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #0054A6 1px, transparent 1px), linear-gradient(to bottom, #0054A6 1px, transparent 1px)",
                backgroundSize: "42px 42px",
              }}
            ></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top Dignitaries Section (Our Chief Guests) */}
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="inline-flex items-center gap-2.5 px-7 py-2.5 rounded-full bg-slate-900 text-white text-base sm:text-lg font-black uppercase tracking-wider shadow-md">
                <i className="fa-solid fa-award text-amber-400"></i>
                Our Chief Guests
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-6xl mx-auto">
              {/* Member 1: Sushri Shobha Karandlaje */}
              <div className="relative group flex flex-col">
                <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-lub-orange/20 via-white to-lub-blue/15 blur-lg opacity-70 group-hover:opacity-100 transition duration-300"></div>

                <div className="relative flex-1 flex flex-col justify-between overflow-hidden rounded-[2rem] bg-white border border-slate-200 shadow-card hover:shadow-card-hover transition duration-300">
                  <div className="relative bg-gradient-to-br from-blue-50 via-white to-orange-50 px-6 pt-7">
                    <div className="mx-auto w-full max-w-[240px] aspect-[4/4.2] overflow-hidden rounded-t-[2rem]">
                      <img
                        src={minsiter}
                        alt="Sushri Shobha Karandlaje"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  </div>

                  <div className="p-6 text-center flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                        Sushri
                        <span className="block text-lub-blue">
                          Shobha Karandlaje
                        </span>
                      </h3>

                      <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                        Hon&apos;ble Minister of State for MSME and Labour &amp;
                        Employment, Government of India
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex justify-center">
                      <div className="inline-flex items-center gap-2 text-xs font-bold text-lub-green">
                        <i className="fa-solid fa-circle-check"></i>
                        Supported by MSME
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Member 2: Thiru. Dr.L.Murugan */}
              <div className="relative group flex flex-col">
                <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-lub-blue/20 via-white to-lub-green/15 blur-lg opacity-70 group-hover:opacity-100 transition duration-300"></div>

                <div className="relative flex-1 flex flex-col justify-between overflow-hidden rounded-[2rem] bg-white border border-slate-200 shadow-card hover:shadow-card-hover transition duration-300">
                  <div className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100/50 px-6 pt-7">
                    <div className="mx-auto w-full max-w-[240px] aspect-[4/4.2] overflow-hidden rounded-t-[2rem]">
                      <img
                        src={muruganImg}
                        alt="Thiru. Dr.L.Murugan"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  </div>

                  <div className="p-6 text-center flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                        Thiru. Dr.
                        <span className="block text-lub-blue">L.Murugan</span>
                      </h3>

                      <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                        Hon&apos;ble Minister of State for Information &amp;
                        Broadcasting and Parliamentary Affairs Government of
                        India
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex justify-center">
                      <div className="inline-flex items-center gap-2 text-xs font-bold text-lub-blue">
                        <i className="fa-solid fa-building-columns"></i>
                        Government of India
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Member 3: Thiru. P.Mathan Raja */}
              <div className="relative group flex flex-col">
                <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-lub-green/20 via-white to-lub-orange/15 blur-lg opacity-70 group-hover:opacity-100 transition duration-300"></div>

                <div className="relative flex-1 flex flex-col justify-between overflow-hidden rounded-[2rem] bg-white border border-slate-200 shadow-card hover:shadow-card-hover transition duration-300">
                  <div className="relative bg-gradient-to-br from-emerald-50 via-white to-green-100/40 px-6 pt-7">
                    <div className="mx-auto w-full max-w-[240px] aspect-[4/4.2] overflow-hidden rounded-t-[2rem]">
                      <img
                        src={mathanImg}
                        alt="Thiru. P.Mathan Raja"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  </div>

                  <div className="p-6 text-center flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                        Thiru.
                        <span className="block text-lub-blue">
                          P.Mathan Raja
                        </span>
                      </h3>

                      <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                        Hon&apos;ble Minister for MSME Government of Tamil Nadu
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex justify-center">
                      <div className="inline-flex items-center gap-2 text-xs font-bold text-lub-orange">
                        <i className="fa-solid fa-landmark"></i>
                        Govt of Tamil Nadu
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Text & Actions Section (Moved to bottom) */}
            <div className="mt-14 lg:mt-16 text-center max-w-4xl mx-auto flex flex-col items-center">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-lub-blue text-xs sm:text-sm font-extrabold uppercase tracking-widest">
                <span className="w-2.5 h-2.5 rounded-full bg-lub-green animate-pulse"></span>
                Tamil Nadu B2B MSME Exhibition 2026
              </div>

              <div className="mt-6 space-y-4">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-slate-900 tracking-tight">
                  MSME Sangamam{" "}
                  <span className="block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-lub-blue via-lub-orange to-lub-green">
                    Connect 2026
                  </span>
                </h2>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium max-w-3xl mx-auto">
                  Join Tamil Nadu&apos;s premier B2B MSME exhibition and
                  buyer–seller meet at{" "}
                  <strong className="text-slate-900">Hotel Hills, Hosur</strong>{" "}
                  on{" "}
                  <strong className="text-lub-orange">
                    18 &amp; 19 September 2026
                  </strong>
                  . Meet buyers, industry leaders, government organizations, and
                  manufacturing partners under one platform.
                </p>
              </div>

              {/* Tagline */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-base sm:text-lg font-extrabold">
                <span className="text-lub-blue">Connect</span>
                <span className="w-1.5 h-1.5 rounded-full bg-lub-orange"></span>
                <span className="text-lub-orange">Collaborate</span>
                <span className="w-1.5 h-1.5 rounded-full bg-lub-green"></span>
                <span className="text-lub-green">Grow</span>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <button
                  onClick={() => navigate("/stall-booking")}
                  className="group relative px-8 sm:px-10 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-lub-blue to-lub-enterpriseMid text-white font-extrabold text-base sm:text-lg uppercase tracking-wider shadow-lg hover:scale-105 transition duration-300 flex items-center gap-3 cursor-pointer"
                >
                  <i className="fa-solid fa-shop text-xl"></i>
                  Book Your Stall
                </button>
                <button
                  onClick={() => navigate("/visitor")}
                  className="group relative px-8 sm:px-10 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-lub-blue to-lub-enterpriseMid text-white font-extrabold text-base sm:text-lg uppercase tracking-wider shadow-lg hover:scale-105 transition duration-300 flex items-center gap-3 cursor-pointer"
                >
                  <i className="fa-solid fa-users text-xl"></i>
                  Visitor Form
                </button>
                <button
                  onClick={() => navigate("/buyer/register")}
                  className="group relative px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-lub-orange to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:scale-105 transition duration-300 flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-user-tie text-base"></i>
                  Register as Buyer
                </button>
                <button
                  onClick={() => navigate("/seller/register")}
                  className="group relative px-6 py-4 rounded-2xl bg-gradient-to-r from-lub-green via-emerald-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:scale-105 transition duration-300 flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-industry text-base"></i>
                  Register as Seller
                </button>
              </div>
            </div>

            {/* Bottom focus areas */}
            <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="enterprise-card rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <i className="fa-solid fa-handshake text-xl"></i>
                </div>
                <h4 className="mt-4 text-lg font-extrabold text-slate-900">
                  Buyer–Seller Meet
                </h4>
                <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed">
                  Direct business meetings with industrial and institutional
                  buyers.
                </p>
              </div>

              <div className="enterprise-card rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-lub-blue/10 text-lub-blue flex items-center justify-center">
                  <i className="fa-solid fa-jet-fighter text-xl"></i>
                </div>
                <h4 className="mt-4 text-lg font-extrabold text-slate-900">
                  Defence &amp; Aerospace
                </h4>
                <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed">
                  Connect with defence, aerospace, automotive and PSU
                  procurement teams.
                </p>
              </div>

              <div className="enterprise-card rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-lub-green/10 text-lub-green flex items-center justify-center">
                  <i className="fa-solid fa-industry text-xl"></i>
                </div>
                <h4 className="mt-4 text-lg font-extrabold text-slate-900">
                  MSME Showcase
                </h4>
                <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed">
                  Present products, manufacturing capability and innovation to
                  buyers.
                </p>
              </div>

              <div className="enterprise-card rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <i className="fa-solid fa-person-dress text-xl"></i>
                </div>
                <h4 className="mt-4 text-lg font-extrabold text-slate-900">
                  Mahila Products
                </h4>
                <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed">
                  A dedicated platform for women-led MSMEs and product
                  innovators.
                </p>
              </div>
            </div>

            {/* Sponsor & Key Partners 4 Slides with 4 Headings and Moving Cards */}
            <div
              id="supported-sponsored"
              className="mt-16 pt-10 border-t border-slate-200 scroll-mt-28"
            >
              <div className="text-center max-w-3xl mx-auto mb-8">
                <p className="text-xs font-extrabold uppercase tracking-widest text-lub-orange">
                  Supported &amp; Sponsored By
                </p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  Key Institutional &amp; Industry Partners
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">
                  Proudly backed by prestigious sponsors, governmental bodies,
                  apex industry associations, and ecosystem partners.
                </p>
              </div>

              {/* Slide Switcher Navigation */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
                <button
                  type="button"
                  onClick={() => setActivePartnerSlide("all")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    activePartnerSlide === "all"
                      ? "bg-lub-blue text-white shadow-md scale-105"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <i className="fa-solid fa-layer-group mr-1.5"></i>
                  All Slides (4)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePartnerSlide("supported")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    activePartnerSlide === "supported"
                      ? "bg-lub-blue text-white shadow-md scale-105"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="opacity-70 mr-1">1.</span> Supported By
                </button>
                <button
                  type="button"
                  onClick={() => setActivePartnerSlide("associations")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    activePartnerSlide === "associations"
                      ? "bg-lub-green text-white shadow-md scale-105"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="opacity-70 mr-1">2.</span> Supporting
                  Industry Associations
                </button>
                <button
                  type="button"
                  onClick={() => setActivePartnerSlide("sponsors")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    activePartnerSlide === "sponsors"
                      ? "bg-lub-orange text-white shadow-md scale-105"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="opacity-70 mr-1">3.</span> Sponsors
                </button>
                <button
                  type="button"
                  onClick={() => setActivePartnerSlide("partners")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    activePartnerSlide === "partners"
                      ? "bg-purple-600 text-white shadow-md scale-105"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="opacity-70 mr-1">4.</span> Event Partners
                </button>
              </div>

              {/* 4 Responsive Marquee / Showcase Slides */}
              <div className="space-y-10">
                {PARTNER_SLIDES.filter(
                  (slide) =>
                    activePartnerSlide === "all" ||
                    activePartnerSlide === slide.id,
                ).map((slide) => {
                  const isSupported = slide.id === "supported";
                  const marqueeItems = isSupported
                    ? []
                    : getRepeatedMarqueeItems(slide.items);
                  return (
                    <div
                      key={slide.id}
                      className="rounded-3xl bg-slate-50/70 border border-slate-200/80 p-5 sm:p-7 shadow-xs"
                    >
                      {/* Slide Heading */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-200/60">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-700 shadow-2xs">
                            {slide.slideNumber}
                          </span>
                          <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            {slide.title}
                          </h4>
                        </div>
                        <span
                          className={`inline-flex items-center self-start sm:self-auto px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${slide.badgeColor}`}
                        >
                          {slide.badge}
                        </span>
                      </div>

                      {/* Supported By: Only 2 images, added once without infinite repeat */}
                      {isSupported ? (
                        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 py-3">
                          {slide.items.map((item) => (
                            <div
                              key={item.name}
                              className="group relative flex items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl hover:shadow-lg hover:border-lub-blue/40 transition-all duration-300 w-64 sm:w-72 h-32 sm:h-36 shrink-0 cursor-pointer shadow-xs"
                            >
                              <img
                                src={item.src}
                                alt={item.name}
                                title={item.name}
                                className="max-h-20 max-w-[200px] w-auto object-contain group-hover:scale-105 transition-all duration-300"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Moving Cards Marquee Track */
                        <div className="relative w-full overflow-hidden marquee-container py-2">
                          {/* Left Edge Fade Mask */}
                          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-24 bg-gradient-to-r from-slate-50/90 via-slate-50/60 to-transparent z-10" />

                          {/* Marquee Track */}
                          <div
                            className={`flex gap-6 ${
                              slide.direction === "left"
                                ? "marquee-track-left"
                                : "marquee-track-right"
                            }`}
                          >
                            {marqueeItems.map((item, idx) => (
                              <div
                                key={`${item.name}-${idx}`}
                                className="group relative flex flex-col items-center justify-center p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-lg hover:border-lub-blue/40 transition-all duration-300 w-60 sm:w-64 h-32 sm:h-36 shrink-0 cursor-pointer"
                              >
                                <img
                                  src={item.src}
                                  alt={item.name}
                                  title={item.name}
                                  className="max-h-16 sm:max-h-18 max-w-[190px] w-auto object-contain group-hover:scale-105 transition-all duration-300"
                                />
                                {"role" in item && item.role && (
                                  <span className="mt-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 group-hover:text-lub-blue transition-colors text-center line-clamp-1">
                                    {item.role}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Right Edge Fade Mask */}
                          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-24 bg-gradient-to-l from-slate-50/90 via-slate-50/60 to-transparent z-10" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ===== HERO SECTION ===== */}
        <section className="relative min-h-screen pt-40 pb-28 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0a162806_1px,transparent_1px),linear-gradient(to_bottom,#0a162806_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

          <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-lub-orange/8 rounded-full blur-[140px] glow-ring-orange"></div>
          <div className="absolute bottom-20 right-1/4 w-[700px] h-[700px] bg-lub-blue/8 rounded-full blur-[160px]"></div>
          <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-lub-green/5 rounded-full blur-[100px]"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Left Info Block */}
            <div className="lg:col-span-7 space-y-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-sm font-bold tracking-widest text-lub-blue uppercase shadow-card">
                <span className="flex h-2.5 w-2.5 rounded-full bg-lub-green animate-ping"></span>
                Laghu Udyog Bharati • Voice of Indian MSMEs
              </div>

              <div className="space-y-5">
                <span className="text-sm uppercase font-extrabold tracking-widest text-lub-orange block">
                  TAMIL NADU STATE B2B CONCLAVE 2026
                </span>
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-tight text-slate-900">
                  Where Ancient{" "}
                  <span className="text-lub-gold font-heritage">Heritage</span>
                  <br />
                  Meets{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-lub-blue via-lub-orange to-lub-green">
                    Industrial Future
                  </span>
                </h1>
              </div>

              <p className="text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
                Welcome to{" "}
                <strong className="text-slate-900 font-bold">
                  MSME Sangamam Connect 2026
                </strong>
                . Hosted at{" "}
                <span className="text-lub-orange font-bold underline decoration-lub-green decoration-2 underline-offset-4">
                  Hosur
                </span>
                , the industrial powerhouse gateway of South India, connecting
                local MSMEs directly to PSU procurement cells and global defense
                supply ecosystems.
              </p>

              {/* Meta Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div className="flex items-center space-x-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
                  <div className="p-4 bg-lub-orange/10 rounded-xl text-lub-orange">
                    <i className="fa-solid fa-calendar-days text-2xl"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-slate-500 font-bold tracking-wider uppercase">
                      EXPO DATES
                    </div>
                    <div className="text-lg font-extrabold text-slate-900">
                      18 & 19 September 2026
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
                  <div className="p-4 bg-lub-blue/10 rounded-xl text-lub-blue">
                    <i className="fa-solid fa-location-dot text-2xl"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-slate-500 font-bold tracking-wider uppercase">
                      PREMIUM VENUE
                    </div>
                    <div className="text-lg font-extrabold text-slate-900">
                      Hotel Hills, Hosur, TN
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-2">
                <a
                  href="#floorplan"
                  onClick={(e) => {
                    handleSmoothScroll(e, "#brochure");
                    switchBrochureTab("p2");
                  }}
                  className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-lub-blue to-lub-enterpriseMid rounded-xl font-extrabold text-white shadow-glow-blue hover:scale-105 transition duration-300 text-center flex items-center justify-center gap-2 text-lg"
                >
                  <i className="fa-solid fa-compass-drafting"></i> Floor Planner
                </a>
                <a
                  href="#b2b-matcher"
                  onClick={(e) => handleSmoothScroll(e, "#b2b-matcher")}
                  className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-slate-200 rounded-xl font-extrabold text-lub-blue hover:bg-lub-blue/5 hover:border-lub-blue/40 transition duration-300 text-center flex items-center justify-center gap-2 text-lg"
                >
                  <i className="fa-solid fa-bolt"></i> Matchmaking
                </a>
              </div>

              {/* Countdown */}
              <div className="pt-6 border-t border-slate-200">
                <div className="text-xs tracking-widest text-slate-500 uppercase font-extrabold mb-4 text-center lg:text-left">
                  CONGRESS COUNTDOWN
                </div>
                <div className="grid grid-cols-4 gap-4 max-w-md mx-auto lg:mx-0">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-card">
                    <div className="text-3xl font-extrabold text-lub-orange">
                      {countdown.days}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-extrabold mt-1">
                      Days
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-card">
                    <div className="text-3xl font-extrabold text-lub-blue">
                      {countdown.hours}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-extrabold mt-1">
                      Hours
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-card">
                    <div className="text-3xl font-extrabold text-lub-green">
                      {countdown.minutes}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-extrabold mt-1">
                      Mins
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-card">
                    <div className="text-3xl font-extrabold text-slate-800">
                      {countdown.seconds}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-extrabold mt-1">
                      Secs
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <div className="relative w-full max-w-lg bg-white p-6 rounded-3xl shadow-card-hover border border-slate-200 overflow-hidden transform hover:scale-[1.01] transition duration-500">
                <div className="absolute top-3 right-3 bg-gradient-to-r from-lub-blue to-lub-enterpriseMid text-white py-1.5 px-4 rounded-lg text-xs font-extrabold uppercase tracking-wider shadow-md">
                  OFFICIAL VERIFIED PORTAL
                </div>
                <img
                  src={ASSETS.msmeSangamam}
                  alt="Official LUB MSME Sangamam"
                  className="w-full h-auto object-contain rounded-xl"
                />

                <div className="mt-5 p-5 bg-blue-50 rounded-xl border border-blue-100 text-slate-800">
                  <div className="flex items-center justify-between text-sm font-bold mb-3">
                    <span className="text-lub-blue">
                      Exhibitor Space Allocation
                    </span>
                    <span className="text-lub-green flex items-center gap-1">
                      <i className="fa-solid fa-shield-check"></i> Certified
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    Promoted under Laghu Udyog Bharati, reinforcing domestic
                    enterprise capabilities, localization setups, and high
                    engineering compliance globally.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== ABOUT SECTION ===== */}
        <section
          id="about"
          className="py-28 relative bg-white border-t border-slate-100"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-3xl overflow-hidden border-2 border-lub-orange/20 shadow-glow-orange bg-white p-4">
                  <img
                    src={ASSETS.msmeSangamam}
                    alt="MSME Sangamam Connect Official Invitation"
                    className="w-full h-auto object-cover rounded-2xl shadow-xl"
                  />
                </div>
              </div>

              <div className="lg:col-span-7 space-y-8">
                <span className="text-lub-orange font-extrabold uppercase tracking-widest text-sm">
                  INDUSTRIAL EMPOWERMENT
                </span>
                <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
                  Empowering Indian Small &amp; Micro Industries
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed font-medium">
                  Laghu Udyog Bharati stands as India's premier organization
                  committed strictly to assisting micro and small manufacturing
                  units. This major physical assembly at{" "}
                  <strong className="text-slate-900 font-bold">
                    Hotel Hills, Hosur
                  </strong>{" "}
                  directly serves as a B2B procurement match-point.
                </p>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-lub-orange/5 to-lub-blue/5 border border-slate-200 space-y-4">
                  <h4 className="text-base font-bold text-lub-gold font-heritage flex items-center gap-2">
                    <i className="fa-solid fa-dharmachakra text-xl"></i>{" "}
                    Heritage of Precision Craftsmanship
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    Tamil Nadu's industry didn't start in the 20th century.
                    Centuries ago, Chola merchant networks exported premium
                    steel and rich fabrics across global maritime routes. This
                    legacy lives on today through advanced CNC tooling, smart EV
                    hubs, and technical defense corridors.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-card space-y-3 hover:shadow-card-hover transition">
                    <i className="fa-solid fa-users text-lub-orange text-2xl"></i>
                    <h4 className="text-slate-900 font-extrabold text-lg">
                      5,500+ Trade Visitors
                    </h4>
                    <p className="text-sm text-slate-600 font-medium">
                      Engineers, industrial buyers, and defense procurement
                      decision makers.
                    </p>
                  </div>
                  <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-card space-y-3 hover:shadow-card-hover transition">
                    <i className="fa-solid fa-link text-lub-blue text-2xl"></i>
                    <h4 className="text-slate-900 font-extrabold text-lg">
                      Direct Vendor Linkages
                    </h4>
                    <p className="text-sm text-slate-600 font-medium">
                      Structured vendor enrollment paths for major tier-1
                      automotive companies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTORS SECTION ===== */}
        <section id="sectors" className="py-28 relative bg-lub-enterpriseBg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-lub-orange font-extrabold uppercase tracking-widest text-sm">
                SECTORS OF PRIDE
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-3 leading-tight">
                Tamil Nadu's Global Engineering Hegemony
              </h2>
              <p className="text-lg text-slate-600 mt-5 font-medium">
                Connecting highly specialized small-scale manufacturers directly
                to multi-modal regional logistics grids.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-8 enterprise-card rounded-3xl p-10 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-lub-orange/5 rounded-full blur-3xl transition-transform group-hover:scale-110"></div>
                <div className="flex justify-between items-start">
                  <div className="p-5 bg-lub-orange/10 rounded-2xl text-lub-orange">
                    <i className="fa-solid fa-gears text-4xl"></i>
                  </div>
                  <span className="text-xs text-lub-orange tracking-widest uppercase font-extrabold px-3 py-1.5 bg-lub-orange/8 rounded-full border border-lub-orange/15">
                    Manufacturing Core
                  </span>
                </div>
                <div className="mt-10 space-y-4">
                  <h3 className="text-3xl font-extrabold text-slate-900">
                    Automotive &amp; Electric Vehicle Machining
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed font-medium">
                    Hosur leads South Asia's EV ecosystem. This category binds
                    regional component factories with global heavy OEMs,
                    securing precision components.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-8 text-sm text-slate-500 font-semibold">
                  <span>
                    <strong className="text-lub-orange">1,500+</strong> Local
                    MSMEs
                  </span>
                  <span>
                    <strong className="text-lub-orange">ZED</strong> Certified
                    Standards
                  </span>
                </div>
              </div>

              <div className="md:col-span-4 enterprise-card rounded-3xl p-10 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-lub-blue/5 rounded-full blur-3xl"></div>
                <div className="flex justify-between items-start">
                  <div className="p-5 bg-lub-blue/10 rounded-2xl text-lub-blue">
                    <i className="fa-solid fa-shield-halved text-4xl"></i>
                  </div>
                  <span className="text-xs text-lub-blue tracking-widest uppercase font-extrabold px-3 py-1.5 bg-lub-blue/8 rounded-full border border-lub-blue/15">
                    Defense Corridor
                  </span>
                </div>
                <div className="mt-10 space-y-4">
                  <h3 className="text-2xl font-extrabold text-slate-900">
                    Aerospace &amp; CNC Precision
                  </h3>
                  <p className="text-base text-slate-600 leading-relaxed font-medium">
                    Active integration into Tamil Nadu's strategically
                    designated aerospace corridors, onboarding high-grade
                    military suppliers.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 text-sm text-slate-500 font-semibold">
                  Direct onboarding opportunities during the expo.
                </div>
              </div>

              <div className="md:col-span-4 enterprise-card rounded-3xl p-10 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-lub-gold/5 rounded-full blur-3xl"></div>
                <div className="flex justify-between items-start">
                  <div className="p-5 bg-lub-gold/10 rounded-2xl text-lub-gold">
                    <i className="fa-solid fa-vest text-4xl"></i>
                  </div>
                  <span className="text-xs text-lub-gold tracking-widest uppercase font-extrabold px-3 py-1.5 bg-lub-gold/8 rounded-full border border-lub-gold/15">
                    Legacy Weaves
                  </span>
                </div>
                <div className="mt-10 space-y-4">
                  <h3 className="text-2xl font-extrabold text-slate-900">
                    Textiles &amp; Technical Fibers
                  </h3>
                  <p className="text-base text-slate-600 leading-relaxed font-medium">
                    Preserving Tamil Nadu's iconic heritage weaving lines while
                    pivoting into exports, showcasing highly skilled women-led
                    micro businesses.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 text-sm text-slate-500 font-semibold">
                  Focusing on advanced high-strength technical fibers.
                </div>
              </div>

              <div className="md:col-span-8 enterprise-card rounded-3xl p-10 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-lub-green/5 rounded-full blur-3xl"></div>
                <div className="flex justify-between items-start">
                  <div className="p-5 bg-lub-green/10 rounded-2xl text-lub-green">
                    <i className="fa-solid fa-bolt text-4xl"></i>
                  </div>
                  <span className="text-xs text-lub-green tracking-widest uppercase font-extrabold px-3 py-1.5 bg-lub-green/8 rounded-full border border-lub-green/15">
                    Smart Panel
                  </span>
                </div>
                <div className="mt-10 space-y-4">
                  <h3 className="text-3xl font-extrabold text-slate-900">
                    Automation, Smart Tooling &amp; Panels
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed font-medium">
                    Specialized machine manufacturers exhibiting smart power
                    grid systems, automated PCB routers, and high-strength
                    casting setups.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-8 text-sm text-slate-500 font-semibold">
                  <span>
                    <strong className="text-lub-green">100%</strong> Local
                    Manufacturing
                  </span>
                  <span>IoT Integrated Solutions</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== HERITAGE SECTION ===== */}
        <section id="heritage" className="py-28 relative bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-lub-gold font-heritage font-extrabold uppercase tracking-widest text-sm">
                THE JOURNEY OF CRAFT
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-3 leading-tight">
                Tamil Nadu's Industrial Legacy Node
              </h2>
              <p className="text-lg text-slate-600 mt-5 font-medium">
                Tracing our transition from ancient international maritime trade
                channels to premier South-Asian multi-modal manufacturing hubs.
              </p>
            </div>

            <div className="relative border-l-2 border-lub-orange/30 md:border-l-0 md:grid md:grid-cols-4 gap-8 pl-8 md:pl-0">
              <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-lub-orange/30 via-lub-blue/30 to-lub-green/30 -z-10"></div>

              <div className="relative enterprise-card p-8 rounded-2xl mb-10 md:mb-0">
                <div className="text-sm font-extrabold text-lub-orange uppercase mb-2">
                  Chola Merchant Guilds
                </div>
                <h4 className="text-xl font-extrabold text-slate-900 mb-3">
                  Maritime Wootz Trade
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Historical records trace advanced iron metallurgy and
                  high-grade weaves exported across global oceans, forming the
                  roots of regional merchant self-reliance.
                </p>
              </div>

              <div className="relative enterprise-card p-8 rounded-2xl mb-10 md:mb-0">
                <div className="text-sm font-extrabold text-lub-blue uppercase mb-2">
                  Engineering Foundation
                </div>
                <h4 className="text-xl font-extrabold text-slate-900 mb-3">
                  Industrial Estates Evolve
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Setting up industrial centers post-independence built the
                  robust infrastructure and highly skilled workforce that paved
                  the way for automated tooling.
                </p>
              </div>

              <div className="relative enterprise-card p-8 rounded-2xl mb-10 md:mb-0">
                <div className="text-sm font-extrabold text-lub-green uppercase mb-2">
                  Detroit of South Asia
                </div>
                <h4 className="text-xl font-extrabold text-slate-900 mb-3">
                  Hosur-Chennai Auto Hub
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Hosur transforms into a massive manufacturing core, housing
                  Tier-1 auto majors, aerospace facilities, and advanced
                  precision components.
                </p>
              </div>

              <div className="relative bg-white p-8 rounded-2xl border-2 border-lub-orange/30 shadow-glow-orange mb-10 md:mb-0">
                <div className="text-sm font-extrabold text-lub-orange uppercase mb-2">
                  2026 &amp; Beyond
                </div>
                <h4 className="text-xl font-extrabold text-slate-900 mb-3">
                  The EV &amp; Defense Pivot
                </h4>
                <p className="text-sm text-slate-800 leading-relaxed font-bold">
                  Focusing on sustainable smart mobility and localization
                  corridors, ensuring small manufacturers drive the next
                  generation of industrial growth.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== BROCHURE SECTION ===== */}
        <section
          id="brochure"
          className="py-28 bg-lub-enterpriseBg relative border-t border-slate-100"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="text-center max-w-3xl
                         mx-auto mb-20"
            >
              <span className="text-lub-orange font-extrabold uppercase tracking-widest text-sm">
                EVENT DOCUMENT GALLERY
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-3 leading-tight">
                Interactive Event Brochure
              </h2>
              <p className="text-lg text-slate-600 mt-5 font-medium">
                Preview official flyer layers, layout diagrams, bank channels,
                and organizing coordinators directly.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card-hover">
              <div className="flex flex-wrap border-b border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => switchBrochureTab("p0")}
                  className={getBrochureTabClass("p0")}
                >
                  <i className="fa-solid fa-file-invoice mr-2"></i> Event
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => switchBrochureTab("p2")}
                  className={getBrochureTabClass("p2")}
                >
                  <i className="fa-solid fa-table-cells mr-2"></i> Hall Layout
                </button>
                <button
                  type="button"
                  onClick={() => switchBrochureTab("p3")}
                  className={getBrochureTabClass("p3")}
                >
                  <i className="fa-solid fa-sitemap mr-2"></i> Stall Categories
                </button>
                <button
                  type="button"
                  onClick={() => switchBrochureTab("p4")}
                  className={getBrochureTabClass("p4")}
                >
                  <i className="fa-solid fa-money-check-dollar mr-2"></i>{" "}
                  Official Payments
                </button>
              </div>

              <div className="p-6 sm:p-10 flex flex-col md:flex-row items-center gap-10">
                <div className="w-full md:w-3/5 bg-slate-50 rounded-2xl overflow-hidden p-3 border border-slate-200 flex justify-center items-center">
                  <div className="relative group cursor-pointer w-full bg-slate-50 min-h-[400px] flex justify-center items-center">
                    <img
                      src={brochureSrc.p0}
                      alt="Official brochure banner page 1"
                      className={`brochure-image w-full h-auto max-h-[600px] object-contain rounded-xl transition duration-300${activeBrochureTab === "p0" ? "" : " hidden"}`}
                    />
                    <img
                      src={brochureSrc.p2}
                      alt="Floorplan categories layout page 2"
                      onError={() => handleBrochureError("p2")}
                      className={`brochure-image w-full h-auto max-h-[600px] object-contain rounded-xl transition duration-300${activeBrochureTab === "p2" ? "" : " hidden"}`}
                    />
                    <img
                      src={brochureSrc.p3}
                      alt="Exhibition floor stall scheme page 3"
                      onError={() => handleBrochureError("p3")}
                      className={`brochure-image w-full h-auto max-h-[600px] object-contain rounded-xl transition duration-300${activeBrochureTab === "p3" ? "" : " hidden"}`}
                    />
                    <img
                      src={brochureSrc.p4}
                      alt="Organizers contacts and registration details page 4"
                      onError={() => handleBrochureError("p4")}
                      className={`brochure-image w-full h-auto max-h-[600px] object-contain rounded-xl transition duration-300${activeBrochureTab === "p4" ? "" : " hidden"}`}
                    />

                    <div className="absolute inset-0 bg-lub-blue/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200 rounded-xl">
                      <span className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-lg text-sm font-bold text-lub-blue border border-slate-200">
                        <i className="fa-solid fa-expand mr-2"></i> Preserved
                        Official Material
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`brochure-meta w-full md:w-2/5 space-y-7${
                    activeBrochureTab === "p0" ? "" : " hidden"
                  }`}
                >
                  <div className="space-y-3">
                    <span className="text-sm font-extrabold text-lub-orange uppercase tracking-widest">
                      Event Overview
                    </span>

                    <h3 className="text-3xl font-extrabold text-slate-900">
                      MSME Sangamam Connect – Tamil Nadu 2026
                    </h3>
                  </div>

                  <p className="text-base text-slate-600 leading-relaxed font-medium">
                    Join Tamil Nadu's premier B2B MSME Exhibition & Buyer–Seller
                    Meet on
                    <strong className="text-slate-900">
                      {" "}
                      18 &amp; 19 September 2026{" "}
                    </strong>
                    at
                    <strong className="text-slate-900">
                      {" "}
                      Hotel Hills, Hosur
                    </strong>
                    . Connect with industry leaders, government organizations,
                    institutional buyers, defence & aerospace companies, and
                    MSMEs to explore new business opportunities and strategic
                    partnerships.
                  </p>

                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <div className="flex items-center gap-3 text-base text-slate-700 font-semibold">
                      <i className="fa-solid fa-calendar-days text-lub-green text-lg"></i>
                      <span>
                        18 &amp; 19 September 2026 • Hotel Hills, Hosur
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-base text-slate-700 font-semibold">
                      <i className="fa-solid fa-users text-lub-green text-lg"></i>
                      <span>5,500+ Expected Visitors & Business Delegates</span>
                    </div>

                    <div className="flex items-center gap-3 text-base text-slate-700 font-semibold">
                      <i className="fa-solid fa-handshake text-lub-green text-lg"></i>
                      <span>
                        Exclusive Buyer–Seller Meetings & Business Networking
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-base text-slate-700 font-semibold">
                      <i className="fa-solid fa-industry text-lub-green text-lg"></i>
                      <span>
                        MSME Product Showcase & Manufacturing Excellence
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-base text-slate-700 font-semibold">
                      <i className="fa-solid fa-jet-fighter text-lub-green text-lg"></i>
                      <span>
                        Defence, Aerospace, Auto & PSU Buyer Participation
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-base text-slate-700 font-semibold">
                      <i className="fa-solid fa-globe text-lub-green text-lg"></i>
                      <span>
                        International Buyers & Global Business Opportunities
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-r from-lub-blue to-lub-enterpriseMid text-white p-5 shadow-lg">
                    <div className="flex items-center gap-3">
                      <i className="fa-solid fa-star text-yellow-300 text-xl"></i>

                      <div>
                        <h4 className="font-extrabold text-lg">Chief Guest</h4>

                        <p className="text-sm text-blue-100 mt-1">
                          Hon'ble Sushri Shobha Karandlaje
                          <br />
                          Union Minister of State for MSME & Labour and
                          Employment
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/stall-booking"
                    // onClick={(e) => handleSmoothScroll(e, "#stall-booking")}
                    className="inline-block w-full py-4 bg-gradient-to-r from-lub-orange to-orange-500 text-center text-white rounded-xl font-extrabold text-base uppercase tracking-wider hover:brightness-110 transition shadow-md"
                  >
                    <i className="fa-solid fa-store mr-2"></i>
                    Book Your Stall Today
                  </Link>
                </div>

                <div
                  className={`brochure-meta w-full md:w-2/5 space-y-7${
                    activeBrochureTab === "p2" ? "" : " hidden"
                  }`}
                >
                  <div className="space-y-3">
                    <span className="text-sm font-extrabold text-lub-blue uppercase tracking-widest">
                      Exhibition Layout
                    </span>

                    <h3 className="text-3xl font-extrabold text-slate-900">
                      Hall Layout & Stall Plan
                    </h3>
                  </div>

                  <p className="text-base text-slate-600 leading-relaxed font-medium">
                    Explore the complete exhibition layout of
                    <strong className="text-slate-900">
                      {" "}
                      Hotel Hills Convention Centre, Hosur
                    </strong>
                    . The floor plan provides stall locations, sponsor zones,
                    meeting rooms, registration counters, entry & exit points,
                    and visitor movement to help exhibitors choose the best
                    business location.
                  </p>

                  <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <span className="font-bold text-slate-700">
                        Total Exhibition Stalls
                      </span>

                      <span className="font-extrabold text-lub-blue text-lg">
                        189
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-700">
                        Sponsor Pavilion
                      </span>

                      <span className="text-lub-orange font-bold">
                        6m × 6m & 4m × 3m
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-700">
                        Premium Stalls
                      </span>

                      <span className="text-lub-green font-bold">
                        3m × 3m (37 Stalls)
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-700">
                        Standard Stalls
                      </span>

                      <span className="text-lub-gold font-bold">
                        3m × 2m (49 Stalls)
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-700">
                        Economy Stalls
                      </span>

                      <span className="text-lub-orange font-bold">
                        2m × 2m (100 Stalls)
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <div className="flex items-center gap-3 text-base text-slate-700 font-semibold">
                      <i className="fa-solid fa-map-location-dot text-lub-green"></i>
                      <span>Complete Hall 1 & Hall 2 Layout</span>
                    </div>

                    <div className="flex items-center gap-3 text-base text-slate-700 font-semibold">
                      <i className="fa-solid fa-handshake text-lub-green"></i>
                      <span>Dedicated Buyer–Seller Meeting Room</span>
                    </div>

                    <div className="flex items-center gap-3 text-base text-slate-700 font-semibold">
                      <i className="fa-solid fa-door-open text-lub-green"></i>
                      <span>
                        Clearly Marked Entry, Exit & Registration Areas
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-base text-slate-700 font-semibold">
                      <i className="fa-solid fa-star text-lub-green"></i>
                      <span>Sponsor Zones & Premium Stall Locations</span>
                    </div>

                    <div className="flex items-center gap-3 text-base text-slate-700 font-semibold">
                      <i className="fa-solid fa-wheelchair text-lub-green"></i>
                      <span>Accessible Walkways & Visitor Navigation</span>
                    </div>
                  </div>

                  <a
                    href="#stall-booking"
                    onClick={(e) => handleSmoothScroll(e, "#stall-booking")}
                    className="inline-block w-full py-4 bg-gradient-to-r from-lub-blue to-lub-enterpriseMid text-center text-white rounded-xl font-extrabold text-base uppercase tracking-wider hover:brightness-110 transition shadow-md"
                  >
                    <i className="fa-solid fa-store mr-2"></i>
                    View Available Stall Locations
                  </a>
                </div>

                <div
                  className={`brochure-meta w-full md:w-2/5 space-y-7${activeBrochureTab === "p3" ? "" : " hidden"}`}
                >
                  <div className="space-y-3">
                    <span className="text-sm font-extrabold text-lub-blue uppercase tracking-widest">
                      Document Layer 3
                    </span>
                    <h3 className="text-3xl font-extrabold text-slate-900">
                      Stall Categories &amp; Pricing
                    </h3>
                  </div>
                  <p className="text-base text-slate-600 leading-relaxed font-medium">
                    Detailed layout structure highlighting regional
                    categorizations. Complete pricing rates with customized
                    fascia and booth fixtures provided.
                  </p>
                  <div className="space-y-3 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div className="flex justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 font-extrabold uppercase">
                      <span>CATEGORY</span>
                      <span>RATE (INR)</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-slate-900">
                      <span>Silver Stall (2m x 2m)</span>
                      <span className="text-lub-orange">₹28,000</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-slate-900">
                      <span>Gold Stall (2m x 3m)</span>
                      <span className="text-lub-orange">₹42,000</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-slate-900">
                      <span>Platinum Stall (3m x 3m)</span>
                      <span className="text-lub-orange">₹63,000</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`brochure-meta w-full md:w-2/5 space-y-7${activeBrochureTab === "p4" ? "" : " hidden"}`}
                >
                  <div className="space-y-3">
                    <span className="text-sm font-extrabold text-lub-gold uppercase tracking-widest">
                      Document Layer 4
                    </span>
                    <h3 className="text-3xl font-extrabold text-slate-900">
                      Official Payments &amp; Escrow
                    </h3>
                  </div>
                  <p className="text-base text-slate-600 leading-relaxed font-medium">
                    Official financial channels managed through Laghu Udyog
                    Bharati Canara Bank accounts. Real-time coordinator
                    telephone listing is detailed below.
                  </p>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3 text-sm font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account Name:</span>{" "}
                      <span className="text-slate-900">
                        Laghu Udyog Bharati
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank Name:</span>{" "}
                      <span className="text-slate-900">Canara Bank</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">IFSC Code:</span>{" "}
                      <span className="text-lub-orange font-mono">
                        CNRB0000936
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FLOORPLAN SECTION ===== */}
        <div className="flex justify-center py-10">
          <button
            onClick={() => navigate("/stall-booking")}
            className="group relative px-10 py-5 rounded-2xl bg-gradient-to-r from-lub-blue to-lub-enterpriseMid text-white font-extrabold text-lg uppercase tracking-wider shadow-lg hover:scale-105 transition duration-300 flex items-center gap-3"
          >
            <i className="fa-solid fa-shop text-xl"></i>
            Book Your Stall
            <span className="absolute -top-3 -right-3 bg-lub-orange text-white text-[10px] px-2 py-1 rounded-full font-bold animate-pulse">
              Closed
            </span>
          </button>
        </div>

        {/* ===== BOOKING MODAL ===== */}
        <div
          onClick={handleModalBackdropClick}
          className={`fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4${modalOpen ? "" : " hidden"}`}
        >
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-lub-green animate-ping"></span>
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">
                  Secure Booth Escrow Hold
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-700 transition focus:outline-none"
              >
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>

            <div className="w-full bg-slate-100 h-1.5">
              <div
                style={{ width: modalProgress }}
                className="bg-gradient-to-r from-lub-blue via-lub-orange to-lub-green h-1.5 transition-all duration-300"
              ></div>
            </div>

            <div
              className={`p-8 space-y-6${bookingStep === 1 ? "" : " hidden"}`}
            >
              <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 space-y-2">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">
                  CHOSEN EXHIBITION GRID NODE
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {selectedStall.id}
                  </span>
                  <span className="text-sm font-extrabold uppercase px-3 py-1 bg-lub-orange/10 text-lub-orange rounded-lg border border-lub-orange/20">
                    {selectedStall.type}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-blue-100 text-sm">
                  <span className="text-slate-600 font-semibold">
                    Escrow Transfer Total:
                  </span>
                  <span className="font-extrabold text-lub-gold text-xl">{`₹${selectedStall.rate.toLocaleString("en-IN")}`}</span>
                </div>
              </div>

              <form
                id="stall-booking-form"
                onSubmit={submitBooking}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="text-xs text-slate-600 font-extrabold uppercase">
                    Enterprise Registered Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-slate-900 focus:outline-none focus:border-lub-blue text-base font-medium transition"
                    placeholder="e.g., Hosur Engineering Gears Ltd"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-600 font-extrabold uppercase">
                      Coordinator Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-slate-900 focus:outline-none focus:border-lub-blue text-base font-medium transition"
                      placeholder="Full Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-600 font-extrabold uppercase">
                      WhatsApp Mobile *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-slate-900 focus:outline-none focus:border-lub-blue text-base font-medium transition"
                      placeholder="10 Digit Number"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-600 font-extrabold uppercase">
                    Industrial Sector Match *
                  </label>
                  <select
                    required
                    value={formSector}
                    onChange={(e) => setFormSector(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-slate-700 focus:outline-none focus:border-lub-blue text-base font-medium transition"
                  >
                    <option value="">Choose Industry Track</option>
                    <option value="Automotive & Ancillary">
                      Automotive &amp; EV Ancillaries
                    </option>
                    <option value="Aerospace & Defense">
                      Aerospace &amp; Defense Corridors
                    </option>
                    <option value="Electricals & Automation">
                      Electricals, Panels &amp; PLC Systems
                    </option>
                    <option value="Textiles & Handloom">
                      Technical Silks &amp; Handloom Heritage
                    </option>
                  </select>
                </div>
                <div className="pt-4 flex gap-5">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-4 bg-slate-100 text-center rounded-xl font-extrabold text-sm uppercase tracking-wider text-slate-500 hover:bg-slate-200 transition"
                  >
                    Dismiss
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-gradient-to-r from-lub-blue to-lub-enterpriseMid text-center rounded-xl text-white font-extrabold text-sm uppercase tracking-wider hover:brightness-110 transition shadow-md"
                  >
                    Proceed to Escrow
                  </button>
                </div>
              </form>
            </div>

            <div
              className={`p-8 space-y-7${bookingStep === 2 ? "" : " hidden"}`}
            >
              <div className="text-center space-y-2">
                <h4 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">
                  Canara Bank Verification Routing
                </h4>
                <p className="text-sm text-slate-600 font-medium">
                  Generate UPI route pattern or copy bank account coordinates
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="bg-white p-3 rounded-xl h-36 w-36 flex items-center justify-center shadow-md border border-slate-100">
                  <svg
                    className="h-32 w-32"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="100" height="100" fill="white" />
                    <rect x="5" y="5" width="25" height="25" fill="#0054A6" />
                    <rect x="10" y="10" width="15" height="15" fill="white" />
                    <rect x="13" y="13" width="9" height="9" fill="#F05A28" />
                    <rect x="70" y="5" width="25" height="25" fill="#0054A6" />
                    <rect x="75" y="10" width="15" height="15" fill="white" />
                    <rect x="78" y="13" width="9" height="9" fill="#F05A28" />
                    <rect x="5" y="70" width="25" height="25" fill="#0054A6" />
                    <rect x="10" y="75" width="15" height="15" fill="white" />
                    <rect x="13" y="78" width="9" height="9" fill="#F05A28" />
                    <rect x="40" y="10" width="5" height="5" fill="#1E3A5F" />
                    <rect x="45" y="25" width="10" height="5" fill="#1E3A5F" />
                    <rect x="55" y="15" width="5" height="10" fill="#1E3A5F" />
                    <rect x="40" y="40" width="10" height="15" fill="#1E3A5F" />
                    <rect x="60" y="50" width="15" height="15" fill="#1E3A5F" />
                    <rect x="80" y="45" width="10" height="10" fill="#1E3A5F" />
                    <rect x="45" y="80" width="15" height="5" fill="#1E3A5F" />
                  </svg>
                </div>
                <div className="flex-1 space-y-3 text-sm text-slate-700 font-semibold">
                  <div>
                    <strong className="text-lub-blue">Account:</strong> Laghu
                    Udyog Bharati
                  </div>
                  <div>
                    <strong className="text-lub-blue">Bank Name:</strong> Canara
                    Bank
                  </div>
                  <div>
                    <strong className="text-lub-blue">Account No:</strong>{" "}
                    0908201005559
                  </div>
                  <div>
                    <strong className="text-lub-blue">IFSC Routing:</strong>{" "}
                    CNRB0000936
                  </div>
                  <p className="text-xs text-slate-500 border-t border-slate-200 pt-2 font-medium">
                    *Transfer exact total and input transaction reference code
                    (UTR) below.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-600 font-extrabold uppercase">
                    Transaction Reference (UTR) *
                  </label>
                  <input
                    type="text"
                    value={formUtr}
                    onChange={(e) => setFormUtr(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 font-mono text-base focus:outline-none focus:border-lub-blue"
                    placeholder="e.g., CNRB1234567890"
                  />
                </div>
                <button
                  type="button"
                  onClick={confirmPayment}
                  className="w-full py-4 bg-gradient-to-r from-lub-green to-emerald-500 text-white font-extrabold text-base uppercase tracking-wider rounded-xl hover:brightness-110 transition shadow-lg"
                >
                  Submit Slip &amp; Request Hold
                </button>
              </div>
            </div>

            <div
              className={`p-10 text-center space-y-7${bookingStep === 3 ? "" : " hidden"}`}
            >
              <div className="w-20 h-20 bg-lub-green/10 text-lub-green rounded-full flex items-center justify-center mx-auto text-4xl animate-bounce">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <div className="space-y-3">
                <h4 className="text-2xl font-extrabold text-slate-900 uppercase tracking-wider">
                  Registration Logged
                </h4>
                <p className="text-base text-slate-600 max-w-sm mx-auto font-medium leading-relaxed">
                  Our regional LUB district secretary will verify the bank slip
                  coordinates within 24 working hours to issue your credential
                  pack.
                </p>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-left text-sm text-slate-700 space-y-3 font-mono font-semibold">
                <div>
                  <strong>Registration Token:</strong>{" "}
                  <span className="text-lub-orange">{successData.id}</span>
                </div>
                <div>
                  <strong>Selected Stall:</strong>{" "}
                  <span className="text-lub-orange">{successData.stall}</span>
                </div>
                <div>
                  <strong>Registered Entity:</strong>{" "}
                  <span className="text-slate-900">{successData.company}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-full py-4 bg-gradient-to-r from-lub-blue to-lub-enterpriseMid text-white font-extrabold text-base uppercase tracking-wider rounded-xl hover:brightness-110 transition"
              >
                Return to Floorplan Map
              </button>
            </div>
          </div>
        </div>

        {/* ===== B2B MATCHER SECTION ===== */}
        <section
          id="b2b-matcher"
          className="py-28 relative bg-lub-enterpriseBg border-t border-slate-100"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-card-hover relative overflow-hidden">
              <div className="text-center space-y-6">
                <span className="text-lub-green uppercase font-extrabold tracking-widest text-sm">
                  SMART MATCHMAKING NETWORKS
                </span>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                  LUB B2B Sourcing Matchboard
                </h2>

                <div className="inline-flex items-center gap-3 px-6 py-3 bg-lub-orange/10 text-lub-orange rounded-full border border-lub-orange/20 font-bold uppercase tracking-wide text-sm">
                  <i className="fa-solid fa-clock"></i>
                  Coming Soon
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* ===== CONTACTS SECTION ===== */}
        <section id="contacts" className="py-28 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-5 space-y-10">
                <div className="space-y-4">
                  <span className="text-lub-orange uppercase font-extrabold tracking-widest text-sm"></span>
                  <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
                    Hotel Hills, Hosur
                  </h2>
                  <p className="text-lg text-slate-600 font-medium leading-relaxed">
                    Perfect geographic placement directly off the
                    Bengaluru-Chennai highway corridor, facilitating easy
                    multi-modal freight integration.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 h-72 bg-slate-50 flex items-center justify-center text-center p-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:16px_16px] opacity-40"></div>
                  <div className="space-y-5 relative z-10">
                    <div className="text-lub-blue text-5xl float-anim">
                      <i className="fa-solid fa-map-location-dot"></i>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-lg">
                        Hotel Hills Exhibition Arena
                      </h4>
                      <p className="text-sm text-slate-600 mt-2 font-medium">
                        Sipcot Phase 1 Corridor Adjacent, Hosur, Tamil Nadu.
                      </p>
                    </div>
                    <a
                      href="https://maps.google.com"
                      target="_blank"
                      className="inline-block text-sm text-lub-blue hover:underline font-bold"
                    >
                      <i className="fa-solid fa-compass mr-2"></i> Open Google
                      Navigation Guide
                    </a>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-8 rounded-2xl border border-slate-200 text-sm text-slate-700">
                  <h4 className="font-extrabold text-slate-900 mb-3 uppercase tracking-wider text-lub-blue text-base">
                    LUB Tamil Nadu Secretariat Address
                  </h4>
                  <p className="leading-relaxed font-semibold">
                    <strong className="text-slate-900">
                      Laghu Udyog Bharati - Tamil Nadu State Headquarters
                    </strong>
                    <br />
                    Plot No 63A, First Floor, 9th Street,
                    <br />
                    SIDCO Industrial Estate, Ambattur, Chennai - 600058
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-4">
                  <span className="text-lub-green uppercase font-extrabold tracking-widest text-sm">
                    EXECUTIVE SECRETARIAT DIRECTORY
                  </span>
                  <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
                    Convenors &amp; Office Bearers
                  </h2>
                  <p className="text-lg text-slate-600 font-medium">
                    Reach out directly to district and chapter convenors to
                    complete your registration process.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Expo Chairman */}
                  <div className="enterprise-card p-6 rounded-xl flex items-start gap-4">
                    <div className="p-4 bg-purple-100 rounded-xl text-purple-600">
                      <i className="fa-solid fa-crown text-xl"></i>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-extrabold text-slate-900">
                        Kumar Chandrasekar
                      </h4>
                      <p className="text-xs text-purple-500 uppercase font-extrabold font-mono">
                        Expo Chairman
                      </p>
                      <a
                        href="tel:+919840097614"
                        className="text-sm text-lub-blue hover:underline flex items-center gap-2 font-bold mt-1"
                      >
                        <i className="fa-solid fa-phone"></i> +91 98400 97614
                      </a>
                    </div>
                  </div>

                  {/* Expo Vice Chairman */}
                  <div className="enterprise-card p-6 rounded-xl flex items-start gap-4">
                    <div className="p-4 bg-green-100 rounded-xl text-green-600">
                      <i className="fa-solid fa-user-tie text-xl"></i>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-extrabold text-slate-900">
                        Jayendran K
                      </h4>
                      <p className="text-xs text-green-500 uppercase font-extrabold font-mono">
                        Expo Vice Chairman
                      </p>
                      <a
                        href="tel:+919884209989"
                        className="text-sm text-lub-blue hover:underline flex items-center gap-2 font-bold mt-1"
                      >
                        <i className="fa-solid fa-phone"></i> +91 63803 23145
                      </a>
                    </div>
                  </div>

                  {/* Convener Expo */}
                  <div className="enterprise-card p-6 rounded-xl flex items-start gap-4">
                    <div className="p-4 bg-blue-100 rounded-xl text-blue-600">
                      <i className="fa-solid fa-user-tie text-xl"></i>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-extrabold text-slate-900">
                        R. Vaidyanathan
                      </h4>
                      <p className="text-xs text-blue-500 uppercase font-extrabold font-mono">
                        Convenor Expo
                      </p>
                      <a
                        href="tel:+919840236534"
                        className="text-sm text-lub-blue hover:underline flex items-center gap-2 font-bold mt-1"
                      >
                        <i className="fa-solid fa-phone"></i> +91 98402 36534
                      </a>
                    </div>
                  </div>
                  <div className="enterprise-card p-6 rounded-xl flex items-start gap-4">
                    <div className="p-4 bg-orange-100 rounded-xl text-orange-600">
                      <i className="fa-solid fa-user text-xl"></i>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-extrabold text-slate-900">
                        Senthil Kumar N
                      </h4>
                      <p className="text-xs text-orange-500 uppercase font-extrabold font-mono">
                        Convenor - BSM
                      </p>
                      <a
                        href="tel:+919940243428"
                        className="text-sm text-lub-blue hover:underline flex items-center gap-2 font-bold mt-1"
                      >
                        <i className="fa-solid fa-phone"></i> +91 94429 04321
                      </a>
                    </div>
                  </div>
                  {/* Co Convener Expo */}
                  <div className="enterprise-card p-6 rounded-xl flex items-start gap-4">
                    <div className="p-4 bg-orange-100 rounded-xl text-orange-600">
                      <i className="fa-solid fa-user text-xl"></i>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-extrabold text-slate-900">
                        T.R. Manoz Kumar
                      </h4>
                      <p className="text-xs text-orange-500 uppercase font-extrabold font-mono">
                        Co Convenor Expo
                      </p>
                      <a
                        href="tel:+919940243428"
                        className="text-sm text-lub-blue hover:underline flex items-center gap-2 font-bold mt-1"
                      >
                        <i className="fa-solid fa-phone"></i> +91 99402 43428
                      </a>
                    </div>
                  </div>

                  {/* Expo Event Head */}
                  <div className="enterprise-card p-6 rounded-xl flex items-start gap-4">
                    <div className="p-4 bg-green-100 rounded-xl text-green-600">
                      <i className="fa-solid fa-briefcase text-xl"></i>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-extrabold text-slate-900">
                        K. Sivakumar
                      </h4>
                      <p className="text-xs text-green-500 uppercase font-extrabold font-mono">
                        Expo Event Head
                      </p>
                      <a
                        href="tel:+919362310612"
                        className="text-sm text-lub-blue hover:underline flex items-center gap-2 font-bold mt-1"
                      >
                        <i className="fa-solid fa-phone"></i> +91 93623 10612
                      </a>
                    </div>
                  </div>

                  {/* Event Coordinator */}
                  <div className="enterprise-card p-6 rounded-xl flex items-start gap-4">
                    <div className="p-4 bg-purple-100 rounded-xl text-purple-600">
                      <i className="fa-solid fa-calendar-check text-xl"></i>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-extrabold text-slate-900">
                        Siddharth Kumaran K
                      </h4>
                      <p className="text-xs text-purple-500 uppercase font-extrabold font-mono">
                        Event Coordinator
                      </p>
                      <a
                        href="tel:+917550265099"
                        className="text-sm text-lub-blue hover:underline flex items-center gap-2 font-bold mt-1"
                      >
                        <i className="fa-solid fa-phone"></i> +91 75502 65099
                      </a>
                    </div>
                  </div>

                  {/* Treasurer */}
                  <div className="enterprise-card p-6 rounded-xl flex items-start gap-4">
                    <div className="p-4 bg-red-100 rounded-xl text-red-600">
                      <i className="fa-solid fa-wallet text-xl"></i>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-extrabold text-slate-900">
                        Balaji R
                      </h4>
                      <p className="text-xs text-red-500 uppercase font-extrabold font-mono">
                        Treasurer
                      </p>
                      <a
                        href="tel:+919600881442"
                        className="text-sm text-lub-blue hover:underline flex items-center gap-2 font-bold mt-1"
                      >
                        <i className="fa-solid fa-phone"></i> +91 96000 81442
                      </a>
                    </div>
                  </div>

                  {/* Digital Support */}
                  <div className="enterprise-card p-6 rounded-xl flex items-start gap-4">
                    <div className="p-4 bg-amber-100 rounded-xl text-amber-700">
                      <i className="fa-solid fa-laptop-code text-xl"></i>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-extrabold text-slate-900">
                        Sriram Hariharan
                      </h4>
                      <p className="text-xs text-amber-600 uppercase font-extrabold font-mono">
                        Digital Support
                      </p>
                      <a
                        href="tel:+919840727309"
                        className="text-sm text-lub-blue hover:underline flex items-center gap-2 font-bold mt-1"
                      >
                        <i className="fa-solid fa-phone"></i> +91 98407 27309
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="bg-lub-enterpriseDark py-16 border-t border-slate-700 text-slate-300 space-y-10">
          {/* Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm uppercase tracking-wider font-bold">
            <a
              href="#about"
              onClick={(e) => handleSmoothScroll(e, "#about")}
              className="hover:text-white transition"
            >
              About
            </a>
            <a
              href="#sectors"
              onClick={(e) => handleSmoothScroll(e, "#sectors")}
              className="hover:text-white transition"
            >
              Focus Sectors
            </a>
            <a
              href="#heritage"
              onClick={(e) => handleSmoothScroll(e, "#heritage")}
              className="hover:text-white transition"
            >
              Heritage Hub
            </a>
            <a
              href="#supported-sponsored"
              onClick={(e) => handleSmoothScroll(e, "#supported-sponsored")}
              className="hover:text-white transition"
            >
              Supported &amp; Sponsored By
            </a>
            <a
              href="#floorplan"
              onClick={(e) => {
                handleSmoothScroll(e, "#brochure");
                switchBrochureTab("p2");
              }}
              className="hover:text-white transition"
            >
              Live Floorplan
            </a>
          </div>

          {/* Logos */}
          <div className="flex items-center justify-center gap-6 py-2">
            <img
              src={ASSETS.lubLogo}
              alt="LUB Logo"
              className="h-16 w-auto object-contain opacity-80 hover:opacity-100 transition"
            />
            <img
              src={ASSETS.msmeSangamam}
              alt="MSME Sangamam"
              className="h-16 w-auto object-contain opacity-80 hover:opacity-100 transition"
            />
          </div>

          {/* Disclaimer */}
          <p className="max-w-lg mx-auto text-xs sm:text-sm leading-relaxed text-slate-400 font-medium text-center">
            Disclaimer: This portal works as the official interactive digital
            interface of Laghu Udyog Bharati's MSME Sangamam Connect Expo,
            scheduled on Sep 18 &amp; 19, 2026, at Hotel Hills, Hosur, Tamil
            Nadu.
          </p>

          {/* Copyright & Published By */}
          <div className="pt-6 border-t border-slate-700/80 max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-slate-100 text-xs sm:text-sm font-bold px-4 text-center">
            <span className="font-bold text-slate-100">
              &copy; 2026 Laghu Udyog Bharati - Tamil Nadu State. All Rights
              Reserved.
            </span>
            <span className="hidden sm:inline text-slate-400 font-bold">
              &bull;
            </span>
            <span className="font-bold text-slate-100">
              Digital Support by{" "}
              <a
                href="https://www.atribsglobal.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-black underline underline-offset-4 decoration-cyan-400 hover:decoration-cyan-300 transition-colors duration-200"
              >
                Atribs (ATRIBS GLOBAL)
              </a>
            </span>
          </div>
        </footer>

        {/* Floating "Digital Support by Atribs" Element */}
        <FloatingSupportFooter />
      </div>
    </>
  );
}
