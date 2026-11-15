export function resolveQuizQuestions(article) {
  if (Array.isArray(article.quizQuestions)) return article.quizQuestions;
  if (!article.quizQuestion) return [];

  let options = article.quizOptions;
  if (typeof options === 'string') {
    try {
      options = JSON.parse(options);
    } catch {
      options = [];
    }
  }

  return [{
    question: article.quizQuestion,
    options: Array.isArray(options) ? options : [],
    correctIndex: Number.isInteger(article.quizCorrectIndex) ? article.quizCorrectIndex : 0,
    explanation: article.quizExplanation || '',
  }];
}
