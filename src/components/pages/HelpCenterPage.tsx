import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Search, ShieldAlert, Package, PhoneCall } from 'lucide-react';
import { Page } from '../../types';

interface HelpCenterPageProps {
  onNavigate: (page: Page) => void;
}

export const HelpCenterPage: React.FC<HelpCenterPageProps> = ({ onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does Buy For Me work if I do not have an Indian bank card?',
      a: 'That is exactly why Buy For Me exists! Simply paste the product link in our Buy For Me form. We will verify the product, generate an all-inclusive quotation in USD, AED, or your local currency, and you pay us via international cards (Visa, MasterCard, Amex) or PayPal. Our team in Mumbai will purchase the items domestically.',
    },
    {
      q: 'How long can I store items in your Mumbai warehouse?',
      a: 'All customers get 30 days of free warehouse storage starting from the day each package arrives at our Mumbai locker. You can shop across multiple sales over several weeks and consolidate them before shipping.',
    },
    {
      q: 'How much can I save with package consolidation?',
      a: 'International couriers charge high base rates for the first 0.5 kg of each shipment. By removing outer merchant cartons and combining multiple packages into a single sturdy shipping box, customers save between 60% and 80% compared to shipping items individually.',
    },
    {
      q: 'What items are prohibited from international export from India?',
      a: 'Items that cannot be shipped internationally include: perfumes and flammable aerosols, lithium batteries not installed inside equipment, raw gold/silver bullion, perishable fresh food items, and counterfeit goods. Packaged ayurvedic wellness items, books, clothing, handicrafts, and electronics are fully permitted.',
    },
    {
      q: 'How do I track my international parcel?',
      a: 'Once your consolidated box is dispatched from our Mumbai hub, you will receive an international courier tracking number (DHL, FedEx, or Aramex). You can track it live via our website header or inside your Customer Dashboard.',
    },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-10 space-y-12">
      <div className="text-center space-y-3">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#0066FF]">
          Help & Frequently Asked Questions
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Help Centre
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Find answers to common questions about purchasing, shipping, consolidation, and customs.
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-100 space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openFaq === idx;
          return (
            <div
              key={idx}
              className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base hover:bg-slate-50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${
                    isOpen ? 'rotate-180 text-[#0066FF]' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="p-4 sm:p-5 pt-0 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/40">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support CTA */}
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 sm:p-8 text-center space-y-3">
        <h3 className="text-xl font-extrabold text-slate-900">Still have questions?</h3>
        <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto">
          Our international support team in Mumbai is available 7 days a week via Live Support Desk and Email.
        </p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-6 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors"
        >
          Contact Support Desk
        </button>
      </div>
    </div>
  );
};
