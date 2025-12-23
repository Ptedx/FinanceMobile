// src/services/notificationFilter.ts

// Lista de pacotes (IDs) dos apps bancários
const BANK_PACKAGES = [
  'com.nu.production',      // Nubank
  'br.com.intermedium',     // Inter
  'com.itau',               // Itaú
  'br.com.bb.android',      // Banco do Brasil
  'com.c6bank.app',         // C6 Bank
  'com.whatsapp',            // WhatsApp (Testing)
  'com.android.shell'       // ADB (Testing)
];

// Palavras-chave que indicam transação financeira
const KEYWORDS = ['compra', 'pagamento', 'transferência', 'pix', 'recebido', 'fatura', 'débito', 'você recebeu', 'r$'];

export const shouldProcessNotification = (packageName: string, text: string): boolean => {
  // 1. Verifica se é um app de banco
  if (!BANK_PACKAGES.includes(packageName)) return false;

  // 2. Verifica se o conteúdo parece financeiro
  if (!text) return false;
  const lowerText = text.toLowerCase();
  const hasKeyword = KEYWORDS.some(keyword => lowerText.includes(keyword));

  return hasKeyword;
};
