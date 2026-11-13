import fs from 'fs';

const file = 'app/dashboard/admin/AdminDashboardClient.jsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Update newArticle state default
const oldNewArticle = `  const [newArticle, setNewArticle] = useState({
    title: '',
    slug: '',
    categoryId: categories[0]?.id || 1,
    introduction: '',
    content: '',
    learningObjectives: '',
    practicalExercises: '',
    criticalThinkingQuestions: '',
    reflectionActivity: '',
    readingTimeMinutes: 5,
    coverImageUrl: '',
    videoUrl: '',
    status: 'published',
  });`;

const updatedNewArticle = `  const [newArticle, setNewArticle] = useState({
    title: '',
    slug: '',
    categoryId: categories[0]?.id || 1,
    introduction: '',
    content: '',
    learningObjectives: '',
    practicalExercises: '',
    criticalThinkingQuestions: '',
    reflectionActivity: '',
    readingTimeMinutes: 5,
    coverImageUrl: '',
    videoUrl: '',
    status: 'published',
    quizQuestion: '',
    quizOptions: ['', '', '', ''],
    quizCorrectIndex: 0,
    quizExplanation: '',
  });`;

if (content.includes(oldNewArticle)) {
  content = content.replace(oldNewArticle, updatedNewArticle);
}

// 2. Update handleEditArticle
const editTarget = `      videoUrl: article.video_url || '',
      status: article.status,
    });`;

const editReplacement = `      videoUrl: article.video_url || '',
      status: article.status,
      quizQuestion: article.quiz_question || '',
      quizOptions: Array.isArray(article.quiz_options) ? article.quiz_options : (article.quiz_options ? JSON.parse(article.quiz_options) : ['', '', '', '']),
      quizCorrectIndex: Number.isInteger(Number(article.quiz_correct_index)) ? Number(article.quiz_correct_index) : 0,
      quizExplanation: article.quiz_explanation || '',
    });`;

if (content.includes(editTarget)) {
  content = content.replace(editTarget, editReplacement);
}

// 3. Insert Quiz Builder into showArticleModal before the submit buttons
const quizBuilderSnippet = `
              {/* LESSON COMPLETION TEST / KNOWLEDGE CHECK BUILDER */}
              <div style={{ backgroundColor: '#F8FAF9', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border-light)', marginTop: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <HelpCircle size={18} style={{ color: 'var(--color-emerald)' }} />
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--color-forest)', margin: 0 }}>
                    Lesson Completion Test &amp; Comprehension Check (Step Test)
                  </h4>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  Students must answer this test question correctly to mark this lesson complete, record progression, and unlock course certificates.
                </p>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Test Question *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newArticle.quizQuestion || ''}
                    onChange={(e) => setNewArticle({ ...newArticle, quizQuestion: e.target.value })}
                    placeholder="e.g. What is the fundamental foundation of self-leadership taught in this lesson?"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                  <label className="form-label" style={{ marginBottom: '2px' }}>
                    4 Multiple Choice Options (Select radio for the Correct Answer) *
                  </label>
                  {[0, 1, 2, 3].map((optIdx) => (
                    <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: Number(newArticle.quizCorrectIndex) === optIdx ? 'var(--color-emerald)' : 'var(--color-text-subtle)' }}>
                        <input
                          type="radio"
                          name="quizCorrectIndex"
                          checked={Number(newArticle.quizCorrectIndex) === optIdx}
                          onChange={() => setNewArticle({ ...newArticle, quizCorrectIndex: optIdx })}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--color-emerald)', cursor: 'pointer' }}
                        />
                        Option {String.fromCharCode(65 + optIdx)}
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={newArticle.quizOptions?.[optIdx] || ''}
                        onChange={(e) => {
                          const nextOpts = [...(newArticle.quizOptions || ['', '', '', ''])];
                          nextOpts[optIdx] = e.target.value;
                          setNewArticle({ ...newArticle, quizOptions: nextOpts });
                        }}
                        placeholder={\`Answer text for Option \${String.fromCharCode(65 + optIdx)}\${Number(newArticle.quizCorrectIndex) === optIdx ? ' (Marked as Correct Answer)' : ''}\`}
                        style={{ flex: 1, fontSize: '0.88rem' }}
                      />
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label">Key Takeaway / Explanation shown upon completion</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    value={newArticle.quizExplanation || ''}
                    onChange={(e) => setNewArticle({ ...newArticle, quizExplanation: e.target.value })}
                    placeholder="Brief explanation confirming the core insight and encouraging the student..."
                  />
                </div>
              </div>
`;

if (!content.includes('Lesson Completion Test &amp; Comprehension Check')) {
  const submitBtnMarker = '<button type="submit" className="btn btn-emerald">{editingArticleId ? \'Save changes\' : \'Save article\'}</button>';
  const modalFooterMarker = '<div style={{ display: \'flex\', gap: \'10px\', justifyContent: \'flex-end\', marginTop: \'20px\' }}>';
  const pos = content.indexOf(modalFooterMarker);
  if (pos !== -1) {
    content = content.slice(0, pos) + quizBuilderSnippet + '\n              ' + content.slice(pos);
  }
}

fs.writeFileSync(file, content);
console.log('Successfully updated AdminDashboardClient.jsx with Quiz Builder');
