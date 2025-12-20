// aiService.ts
// Centralized AI interface (stubs). Replace implementations if you reintroduce an AI provider.

export const generateClientResponse = async (clientName: string, note: string, date: string, time: string): Promise<string> => {
  // Stub: return a short template for the therapist to use
  return `Bonjour ${clientName || 'Client'},\n\nMerci pour votre message. Votre rendez-vous du ${date} à ${time} est confirmé.\n\nCordialement,\nVotre thérapeute`;
};

export const generateReminderEmail = async (clientName: string, date: string, time: string): Promise<string> => {
  // Stub: simple reminder template
  return `Bonjour ${clientName || 'Client'},\n\nRappel : vous avez un rendez-vous le ${date} à ${time}. Merci de confirmer votre présence.\n\nÀ bientôt.`;
};

export const summarizeClientNote = async (note: string): Promise<string> => {
  if (!note) return 'Aucun contenu à résumer.';
  // Very small heuristic summary: first 200 chars
  const trimmed = note.trim();
  return trimmed.length <= 200 ? trimmed : trimmed.slice(0, 200) + '...';
};
