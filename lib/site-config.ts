export const SITE_NAME = "Kharasana Pro";
export const SITE_NAME_AR = "خرسانة برو";

// Shugan's real WhatsApp Business contact number, overridable via env var
// (e.g. to point at a different number per deploy environment).
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "966554974814";

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
