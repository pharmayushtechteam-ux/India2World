import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, ExternalLink, Sparkles } from 'lucide-react';
import {
  WHATSAPP_PHONE_NUMBER,
  WHATSAPP_DISPLAY_PHONE,
  DEFAULT_WHATSAPP_MESSAGE,
  WHATSAPP_QUICK_TOPICS,
  getWhatsAppUrl,
} from '../../utils/whatsapp';

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

interface WhatsAppChatWidgetProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export const WhatsAppChatWidget: React.FC<WhatsAppChatWidgetProps> = ({
  phoneNumber = WHATSAPP_PHONE_NUMBER,
  defaultMessage = DEFAULT_WHATSAPP_MESSAGE,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState(defaultMessage);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectTopic = (topicId: string, topicMessage: string) => {
    setSelectedTopicId(topicId);
    setCustomMessage(topicMessage);
  };

  const handleOpenWhatsApp = () => {
    const targetUrl = getWhatsAppUrl(customMessage || defaultMessage, phoneNumber);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div
      ref={popupRef}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-none"
    >
      {/* Interactive Chat Popup Window */}
      {isOpen && (
        <div className="pointer-events-auto mb-3 w-[calc(100vw-2.5rem)] sm:w-[380px] max-w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200 font-['Plus_Jakarta_Sans',sans-serif]">
          {/* Header with WhatsApp Branding */}
          <div className="bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white p-4 sm:p-5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#25D366] shadow-sm">
                  <WhatsAppIcon className="w-7 h-7" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#128C7E] rounded-full" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base leading-tight flex items-center gap-1.5">
                  BoxMyIndia Support
                  <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-medium">WhatsApp</span>
                </h4>
                <p className="text-[11px] sm:text-xs text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <span>Online • {WHATSAPP_DISPLAY_PHONE}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close chat window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Body & Quick Selection */}
          <div className="p-4 sm:p-5 space-y-4 max-h-[460px] overflow-y-auto bg-slate-50/50">
            {/* Greeting Bubble */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#128C7E] text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                BMI
              </div>
              <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-xs border border-slate-100 text-xs sm:text-[13px] text-slate-700 leading-relaxed">
                <p className="font-semibold text-slate-900 mb-1">
                  Hello! Welcome to BoxMyIndia 👋
                </p>
                <p>
                  How can we help you purchase, store, or ship items from India today? Select a quick topic below or type your custom message.
                </p>
                <span className="block text-[10px] text-slate-400 text-right mt-1">Instant reply</span>
              </div>
            </div>

            {/* Quick Topic Buttons */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#128C7E]" />
                Choose a Topic:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {WHATSAPP_QUICK_TOPICS.map((topic) => {
                  const isSelected = selectedTopicId === topic.id;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleSelectTopic(topic.id, topic.message)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl font-semibold transition-all border text-left flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-[#128C7E] text-white border-[#128C7E] shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-[#128C7E] hover:text-[#075E54]'
                      }`}
                    >
                      <span>{topic.icon}</span>
                      <span>{topic.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Message Field */}
            <div className="space-y-1.5">
              <label htmlFor="wa-custom-msg" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Your Custom Message:
              </label>
              <div className="relative">
                <textarea
                  id="wa-custom-msg"
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full p-3 text-xs sm:text-[13px] bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#25D366] focus:border-transparent text-slate-800 placeholder:text-slate-400 resize-none shadow-2xs leading-relaxed"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                You can edit this message before sending. It will open directly in your WhatsApp app or web.
              </p>
            </div>
          </div>

          {/* Footer Action Button */}
          <div className="p-3.5 sm:p-4 bg-white border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <WhatsAppIcon className="w-5 h-5 shrink-0" />
              <span>Start WhatsApp Chat</span>
              <Send className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>Direct line: {WHATSAPP_DISPLAY_PHONE}</span>
              <span className="flex items-center gap-0.5">
                <span>Official WhatsApp API</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="pointer-events-auto flex items-center gap-2.5">
        {/* Helper Tooltip Badge */}
        {!isOpen && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setHasInteracted(true);
            }}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-white/95 backdrop-blur-md text-slate-800 rounded-full shadow-lg border border-slate-200/80 text-xs font-bold hover:shadow-xl hover:text-[#075E54] transition-all cursor-pointer group"
          >
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            <span>Chat on WhatsApp</span>
            <span className="text-[11px] text-slate-400 group-hover:text-[#128C7E] font-medium">
              (+91 97470 23382)
            </span>
          </button>
        )}

        {/* WhatsApp Icon Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setHasInteracted(true);
          }}
          className={`relative w-11 h-11 min-[375px]:w-12 min-[375px]:h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer touch-manipulation ${
            isOpen
              ? 'bg-[#075E54] rotate-90 scale-95'
              : 'bg-[#25D366] hover:bg-[#20ba59] hover:scale-105'
          }`}
          aria-label={isOpen ? 'Close WhatsApp Chat' : 'Open WhatsApp Chat (+91 97470 23382)'}
          title="Chat with us on WhatsApp: +91 97470 23382"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <WhatsAppIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              {/* Notification Pulse Dot */}
              {!hasInteracted && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
