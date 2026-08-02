export const SITE_NAME = "Kharasana Pro";
export const SITE_NAME_AR = "خرسانة برو";

// Demo-only contact number — clearly not a real business line.
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "966500000000";

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
