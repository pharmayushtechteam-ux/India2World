/**
 * WhatsApp Chat Integration Utilities for BoxMyIndia
 * Primary Phone: +91 97470 23382 (919747023382)
 */

export const WHATSAPP_PHONE_NUMBER = '919747023382';
export const WHATSAPP_DISPLAY_PHONE = '+91 97470 23382';

export const DEFAULT_WHATSAPP_MESSAGE =
  'Hello BoxMyIndia team! I would like to inquire about international shipping and shopping from India.';

export interface WhatsAppQuickTopic {
  id: string;
  label: string;
  icon: string;
  message: string;
}

export const WHATSAPP_QUICK_TOPICS: WhatsAppQuickTopic[] = [
  {
    id: 'buy-for-me',
    label: 'Assisted Purchase (Buy For Me)',
    icon: '🛒',
    message: 'Hello BoxMyIndia! I need assistance with the Buy For Me service to purchase products from an Indian store.',
  },
  {
    id: 'shipping-rates',
    label: 'Shipping Rates & Estimates',
    icon: '✈️',
    message: 'Hello BoxMyIndia! Could you please share the shipping rates and estimated delivery time to my country?',
  },
  {
    id: 'consolidation',
    label: 'Package Consolidation & Locker',
    icon: '📦',
    message: 'Hello BoxMyIndia! I have a question about consolidating multiple packages at your Mumbai warehouse.',
  },
  {
    id: 'customs',
    label: 'Customs & Permitted Items',
    icon: '🛡️',
    message: 'Hello BoxMyIndia! I want to check whether my items are permitted for export and what customs documents are needed.',
  },
  {
    id: 'general',
    label: 'General Inquiry',
    icon: '💬',
    message: 'Hello BoxMyIndia team! I would like to inquire about your international delivery service from India.',
  },
];

/**
 * Builds the official WhatsApp click-to-chat URL
 */
export const getWhatsAppUrl = (
  customMessage: string = DEFAULT_WHATSAPP_MESSAGE,
  phone: string = WHATSAPP_PHONE_NUMBER
): string => {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  const encodedText = encodeURIComponent(customMessage.trim());
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
};

/**
 * Opens WhatsApp click-to-chat in a new tab safely
 */
export const openWhatsApp = (
  customMessage?: string,
  phone?: string
): void => {
  if (typeof window !== 'undefined') {
    const url = getWhatsAppUrl(customMessage, phone);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
