import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  HelpCircle,
  ExternalLink,
  Briefcase,
  FileCheck
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Astronix Realty | Real Estate Management Platform',
  description: 'Explore the Astronix Realty platform for real estate projects, property management and builder services.',
  alternates: {
    canonical: 'https://builder.astronixrealty.com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Astronix Realty | Real Estate Management Platform',
    description: 'Explore the Astronix Realty platform for real estate projects, property management and builder services.',
    url: 'https://builder.astronixrealty.com',
    siteName: 'Astronix Realty',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: 'https://builder.astronixrealty.com/og-image.png',
        secureUrl: 'https://builder.astronixrealty.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Astronix Realty | Real Estate Management Platform',
        type: 'image/png',
      },
      {
        url: 'https://builder.astronixrealty.com/og-image.jpg',
        secureUrl: 'https://builder.astronixrealty.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Astronix Realty | Real Estate Management Platform',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Astronix Realty | Real Estate Management Platform',
    description: 'Explore the Astronix Realty platform for real estate projects, property management and builder services.',
    images: ['https://builder.astronixrealty.com/og-image.png'],
  },
};

const FAQ_ITEMS = [
  {
    q: 'Who is eligible to register on the Astronix Builder & Mandate Portal?',
    a: 'Registration is open to RERA-registered real estate builders, developers, and recognized exclusive sales mandate agencies operating in Mumbai, Thane, Kalyan, Dombivli, and the broader MMR region.',
  },
  {
    q: 'What is the difference between Builder registration and Mandate registration?',
    a: 'Builder accounts provide master control over real estate projects, towers, wing approvals, pricing sheets, and direct lead pipelines. Mandate accounts are tailored for sole-selling agencies managing assigned developer inventory with team leader lead distribution and agent analytics.',
  },
  {
    q: 'How does Astronix Realty eliminate duplicate and fake property listings?',
    a: 'Astronix operates a strict single-listing verification standard. Each property has one official verified listing tied directly to developer sanction records and MahaRERA numbers, preventing chaotic broker spam and bait pricing.',
  },
  {
    q: 'What documents are required for developer onboarding?',
    a: 'Developers must provide their MahaRERA Project Registration Certificate, Commencement Certificate (CC), sanctioned architectural floor layouts, and authorized signatory contact details for verification.',
  },
  {
    q: 'How does the ₹111 Price Lock guarantee benefit builders?',
    a: 'The ₹111 price lock allows serious buyers to freeze a unit price for up to 72 hours while completing site visits. This filters out casual window-shoppers and delivers genuine, high-intent buyers ready for booking.',
  },
  {
    q: 'Is developer inventory and client lead data kept private and secure?',
    a: 'Yes. All developer dashboards, proprietary cost sheets, and buyer CRM records are protected behind Edge JWT session authentication, strict Role-Based Access Control (RBAC), and encrypted database storage.',
  },
];

export default async function HomePage() {
  // If an active session exists, seamlessly redirect to the respective dashboard
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
        const payload = JSON.parse(payloadJson);
        const isBuilder = payload.userType === 'builder' || payload.role === 'builder';
        const isTeamLeader = payload.userType === 'teamLeader' || payload.role === 'teamLeader';
        if (isTeamLeader) redirect('/team-panel');
        redirect(isBuilder ? '/builder-dashboard' : '/mandate-dashboard');
      }
    } catch {
      // In case of invalid/expired token, proceed to render the public landing page
    }
  }

  // Structured Data (JSON-LD)
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://builder.astronixrealty.com/#webapp',
        name: 'Astronix Realty Builder & Mandate Portal',
        url: 'https://builder.astronixrealty.com',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        description: 'Enterprise developer and mandate management portal for real estate project distribution, lead management, and inventory synchronization across MMR.',
        provider: {
          '@type': 'Organization',
          '@id': 'https://astronixrealty.com/#organization',
          name: 'Astronix Realty',
          legalName: 'Astronix Realty Private Limited',
          url: 'https://astronixrealty.com',
          logo: 'https://builder.astronixrealty.com/astronix-logo.png',
          telephone: '+918657225993',
          email: 'contact@astronixrealty.com',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Astronix Premium Hub, Sonarpada Main Road',
            addressLocality: 'Dombivli East',
            addressRegion: 'Maharashtra',
            postalCode: '421201',
            addressCountry: 'IN',
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://builder.astronixrealty.com/#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Astronix Realty',
            item: 'https://astronixrealty.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Builder & Mandate Portal',
            item: 'https://builder.astronixrealty.com',
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://builder.astronixrealty.com/#faq',
        mainEntity: FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-[#1A3C8C] selection:text-white">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* ── HEADER / NAVIGATION ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center p-1.5 transition-transform duration-300 group-hover:scale-105">
              <img src="/astronix-logo.png" alt="Astronix Realty Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-[#0F172A] text-lg font-bold tracking-tight block leading-tight">Astronix Realty</span>
              <span className="text-[#1A3C8C] text-[10px] uppercase font-bold tracking-widest block">Builder & Mandate Network</span>
            </div>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-4">
            <a 
              href="https://astronixrealty.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#1A3C8C] font-semibold transition-colors px-3 py-2"
            >
              Consumer Marketplace <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#1A3C8C] px-4 py-2 rounded-xl transition-colors hover:bg-slate-100"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs sm:text-sm font-semibold bg-[#1A3C8C] hover:bg-[#152E6D] text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-md shadow-blue-900/10 hover:shadow-lg transition-all hover:scale-[1.02]"
            >
              Register Partner
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {/* ── HERO SECTION ── */}
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-blue-50/70 via-slate-50 to-white">
          {/* Subtle Ambient Brand Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-blue-200/40 via-indigo-100/30 to-amber-100/30 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#1A3C8C] text-xs font-semibold uppercase tracking-wider mb-8 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#1A3C8C]" /> Official Enterprise Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
              Empowering Real Estate Builders & Mandate Agencies Across{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A3C8C] via-blue-700 to-indigo-800">
                Mumbai MMR
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Distribute RERA-registered inventory directly on India&apos;s cleanest real estate marketplace. Eliminate duplicate listings, access verified homebuyer leads, and control project inventory in real time.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register?type=builder"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#1A3C8C] hover:bg-[#152E6D] text-white font-semibold text-sm shadow-lg shadow-blue-900/15 hover:scale-[1.02] transition-all"
              >
                <Building2 className="w-4 h-4" /> Register as Builder
              </Link>
              <Link
                href="/register?type=mandate"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm shadow-lg shadow-blue-800/15 hover:scale-[1.02] transition-all"
              >
                <Users className="w-4 h-4" /> Register as Mandate
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-all shadow-xs hover:border-slate-400"
              >
                Partner Login <ArrowRight className="w-4 h-4 text-[#1A3C8C]" />
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                <div className="text-3xl font-extrabold text-[#1A3C8C]">100%</div>
                <div className="text-xs font-medium text-slate-600 mt-1">MahaRERA Audited</div>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                <div className="text-3xl font-extrabold text-[#1A3C8C]">Zero</div>
                <div className="text-xs font-medium text-slate-600 mt-1">Fake & Duplicate Listings</div>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                <div className="text-3xl font-extrabold text-[#EA580C]">₹111</div>
                <div className="text-xs font-medium text-slate-600 mt-1">Token Lock Commitment</div>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                <div className="text-3xl font-extrabold text-[#1A3C8C]">MMR Focus</div>
                <div className="text-xs font-medium text-slate-600 mt-1">Dombivli, Kalyan, Thane</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TWO DEDICATED PARTNER PILLARS ── */}
        <section className="py-20 bg-slate-100/60 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900">Built Specifically for Developers & Mandates</h2>
              <p className="mt-4 text-slate-600 text-sm sm:text-base">
                Whether you are an established developer launching an integrated township or an exclusive mandate agency scaling sales velocity, Astronix Realty provides dedicated toolsets.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Builder Card */}
              <div className="rounded-3xl p-8 lg:p-10 bg-white border border-slate-200/90 shadow-md relative overflow-hidden transition-all hover:shadow-lg hover:border-blue-200">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1A3C8C] mb-6 shadow-xs">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">For Real Estate Developers</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Gain master control over your residential townships, towers, and unit-level inventory with complete pricing transparency.
                </p>
                <ul className="space-y-3.5 mb-8 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Direct Inventory Control:</strong> Publish master layouts, wing progress, and carpet area cost sheets without broker adulteration.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Real-Time Verified Buyer Leads:</strong> Engage verified buyers directly through automated enquiry and site-visit scheduling.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>₹111 Price Lock Safeguard:</strong> Serious home seekers lock units for 72 hours, delivering commitment-backed leads.</span>
                  </li>
                </ul>
                <Link
                  href="/register?type=builder"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A3C8C] hover:text-blue-800 transition-colors"
                >
                  Join as Developer Partner <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Mandate Card */}
              <div className="rounded-3xl p-8 lg:p-10 bg-white border border-slate-200/90 shadow-md relative overflow-hidden transition-all hover:shadow-lg hover:border-blue-200">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-6 shadow-xs">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">For Exclusive Mandates & Sole Selling Agencies</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Arm your sales team with an institutional platform to manage exclusive projects, route leads efficiently, and track closing velocity.
                </p>
                <ul className="space-y-3.5 mb-8 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Exclusive Inventory Allocation:</strong> Manage assigned developer stock with live availability updates and booking locks.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Lead Routing & Team Leader Hierarchy:</strong> Automatically assign incoming buyer enquiries to agents and track closing rates.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Collaborative Offer Management:</strong> Coordinate festive subventions, spot discounts, and group buying pools seamlessly.</span>
                  </li>
                </ul>
                <Link
                  href="/register?type=mandate"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A3C8C] hover:text-blue-800 transition-colors"
                >
                  Join as Mandate Agency <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── ONBOARDING ROADMAP ── */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900">How Onboarding Works</h2>
              <p className="mt-3 text-slate-600 text-sm">
                A simple, 3-step verification process to ensure zero compromise on legal compliance and listing authenticity.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8">
              <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 text-center relative shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 text-[#1A3C8C] flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Partner Registration</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Submit company details, contact person credentials, and select your entity type (Developer or Mandate).
                </p>
              </div>

              <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 text-center relative shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">MahaRERA & Legal Audit</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Our legal desk verifies project registration numbers, Commencement Certificates (CC), and title clearances.
                </p>
              </div>

              <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 text-center relative shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Inventory Sync & Go-Live</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Upload towers, wing floor plans, and pricing sheets. Your verified inventory goes live to thousands of MMR buyers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── VISIBLE FAQ SECTION (Matches Schema.org FAQPage) ── */}
        <section className="py-20 bg-slate-50 border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1A3C8C] text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs">
                <HelpCircle className="w-3.5 h-3.5" /> Frequently Asked Questions
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Everything You Need to Know</h2>
              <p className="mt-3 text-slate-600 text-sm">
                Common questions regarding the Astronix Realty Developer & Mandate network.
              </p>
            </div>

            <div className="space-y-4">
              {FAQ_ITEMS.map((item, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                  <h3 className="text-base font-semibold text-slate-900 mb-2 flex items-start gap-3">
                    <span className="text-[#1A3C8C] font-bold">Q{idx + 1}.</span> {item.q}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed pl-8">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BOTTOM CALL TO ACTION ── */}
        <section className="py-20 text-center bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-blue-900 via-[#1A3C8C] to-slate-900 text-white shadow-xl">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready to Scale Your Property Distribution?</h2>
              <p className="mt-4 text-blue-100 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                Join verified developers and top sales mandates driving clean, transparent real estate across Mumbai MMR.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-[#1A3C8C] font-bold text-sm hover:bg-slate-100 shadow-md transition-all hover:scale-[1.02]"
                >
                  Create Partner Account
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all"
                >
                  Existing Partner Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER / ENTITY CITATION ── */}
      <footer className="border-t border-slate-200 bg-white py-12 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-bold text-slate-900 text-sm mb-3">Astronix Realty</div>
              <p className="text-slate-600 leading-relaxed">
                Astronix Realty Private Limited<br />
                Astronix Premium Hub, Sonarpada Main Road<br />
                Dombivli East, Maharashtra 421201, India
              </p>
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm mb-3">Partner Access</div>
              <ul className="space-y-2">
                <li><Link href="/login" className="hover:text-[#1A3C8C] transition-colors">Partner Sign In</Link></li>
                <li><Link href="/register?type=builder" className="hover:text-[#1A3C8C] transition-colors">Developer Registration</Link></li>
                <li><Link href="/register?type=mandate" className="hover:text-[#1A3C8C] transition-colors">Mandate Agency Registration</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm mb-3">Public Marketplace</div>
              <ul className="space-y-2">
                <li><a href="https://astronixrealty.com/properties" target="_blank" rel="noopener noreferrer" className="hover:text-[#1A3C8C] transition-colors">Verified Properties</a></li>
                <li><a href="https://astronixrealty.com/block-property" target="_blank" rel="noopener noreferrer" className="hover:text-[#1A3C8C] transition-colors">₹111 Price Lock</a></li>
                <li><a href="https://astronixrealty.com/about" target="_blank" rel="noopener noreferrer" className="hover:text-[#1A3C8C] transition-colors">About & Legal Audit</a></li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm mb-3">Support & Legal</div>
              <p className="text-slate-600 leading-relaxed">
                Email: contact@astronixrealty.com<br />
                Phone: +91 86572 25993<br />
                Strict compliance with MahaRERA provisions.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
            <p>© {new Date().getFullYear()} Astronix Realty Private Limited. All rights reserved.</p>
            <p className="flex items-center gap-1.5 font-medium text-slate-600">
              <Lock className="w-3.5 h-3.5 text-[#1A3C8C]" /> Enterprise Secured Partner Gateway
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
