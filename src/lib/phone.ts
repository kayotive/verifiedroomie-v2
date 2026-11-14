// Turns a Nigerian number like 0801 234 5678 into a WhatsApp link
export function whatsappLink(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "234" + digits.slice(1);
  return `https://wa.me/${digits}`;
}