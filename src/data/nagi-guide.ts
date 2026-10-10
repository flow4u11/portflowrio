import knowledge from './nagi-knowledge.json';
export type NagiLanguage = 'en' | 'th';
export const nagiKnowledge = knowledge;
export const nagiSuggestions = ['secrets', 'minigame', 'halloween', 'projects', 'settings', 'contact'];
export function answerGuide(question: string, preferred: NagiLanguage) {
  const language: NagiLanguage = /[\u0e00-\u0e7f]/.test(question) ? 'th' : preferred;
  const normalized = question.toLocaleLowerCase().trim();
  const ranked = knowledge.topics.map(topic => ({ topic, score: Math.max(0, ...topic.aliases.filter(alias => normalized.includes(alias)).map(alias => alias.length)) }));
  ranked.sort((a, b) => b.score - a.score);
  const topic = ranked[0]?.score ? ranked[0].topic : undefined;
  return { text: topic?.answer[language] ?? knowledge.fallback[language], language, topic: topic?.id };
}
