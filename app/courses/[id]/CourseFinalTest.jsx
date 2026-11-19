'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Award, CheckCircle2, CircleAlert, LockKeyhole, ShieldAlert } from 'lucide-react';

export default function CourseFinalTest({
  courseId,
  courseName,
  questions,
  lessonsComplete,
  completedLessons,
  totalLessons,
  initialAttempt,
  certificate,
}) {
  const [active, setActive] = useState(false);
  const [answers, setAnswers] = useState(() => questions.map(() => null));
  const [attempt, setAttempt] = useState(initialAttempt);
  const [earnedCertificate, setEarnedCertificate] = useState(certificate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const activeRef = useRef(false);
  const submittedRef = useRef(false);
  const answersRef = useRef(answers);

  const submitAttempt = useCallback(async (reason) => {
    if (!activeRef.current || submittedRef.current) return;
    submittedRef.current = true;
    activeRef.current = false;
    setActive(false);
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/courses/${courseId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersRef.current, reason }),
        keepalive: reason === 'focus_lost',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not submit the final test.');
      setAttempt(data);
      if (data.certificate) setEarnedCertificate(data.certificate);
    } catch (requestError) {
      setError(requestError.message || 'Could not submit the final test. Please try again.');
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!active) return undefined;
    const handleLeaving = () => {
      if (document.visibilityState === 'hidden') {
        submitAttempt('focus_lost');
      }
    };
    const handleBlur = () => submitAttempt('focus_lost');
    document.addEventListener('visibilitychange', handleLeaving);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleLeaving);
      window.removeEventListener('blur', handleBlur);
    };
  }, [active, submitAttempt]);

  const startTest = () => {
    setAnswers(questions.map(() => null));
    answersRef.current = questions.map(() => null);
    setError('');
    submittedRef.current = false;
    activeRef.current = true;
    setActive(true);
  };

  if (earnedCertificate) {
    return (
      <section className="card" aria-live="polite" style={{ marginTop: '24px', padding: '28px', border: '2px solid var(--color-emerald)', background: 'var(--surface-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', color: 'var(--color-emerald)' }}>
          <CheckCircle2 size={26} />
          <h2 style={{ color: 'var(--color-forest)', fontSize: '1.35rem', margin: 0 }}>Congratulations, {courseName} completed!</h2>
        </div>
        <p style={{ color: 'var(--color-text-main)', marginBottom: '18px' }}>
          You passed the final test and earned your official course certificate. Well done on completing every lesson and the final assessment.
        </p>
        <Link className="btn btn-gold btn-lg" href={`/certificates/${earnedCertificate.certificate_code}`}>
          <Award size={18} /> View and download your certificate
        </Link>
      </section>
    );
  }

  return (
    <section className="card" aria-labelledby="course-final-test-title" style={{ marginTop: '24px', padding: '28px', border: '1px solid var(--color-border)', background: 'var(--surface-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <Award size={22} style={{ color: 'var(--color-gold-hover)' }} />
        <h2 id="course-final-test-title" style={{ color: 'var(--color-forest)', fontSize: '1.3rem', margin: 0 }}>Course completion and final test</h2>
      </div>

      {questions.length === 0 ? (
        <div role="status" style={{ padding: '16px', background: 'var(--color-warning-soft)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-main)' }}>
          <strong style={{ display: 'block', marginBottom: '4px' }}>This course is not finished yet.</strong>
          <span>The instructor has not added the general final test. Your certificate will be available after the test is added and passed.</span>
        </div>
      ) : !lessonsComplete ? (
        <div role="status" style={{ padding: '16px', background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-main)' }}>
          <strong style={{ display: 'block', marginBottom: '4px' }}>Finish every lesson before the final test.</strong>
          <span>{completedLessons} of {totalLessons} lessons completed. Your course is not complete until all lessons and the final test are passed.</span>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--color-text-main)', marginBottom: '14px' }}>
            Answer the general course test. You need at least 50% to pass; a score below 50% means you can review the lessons and try again.
          </p>
          {!active && !submitting && (
            <div style={{ padding: '14px 16px', marginBottom: '18px', background: 'var(--color-warning-soft)', border: '1px solid rgba(217, 130, 43, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-main)' }}>
              <p style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontWeight: 700, margin: 0 }}>
                <ShieldAlert size={18} style={{ flexShrink: 0, color: 'var(--color-warning)' }} />
                Stay on this page while taking the test. Switching tabs, minimizing the window, or leaving the page will automatically submit your current answers. Unanswered questions count as incorrect.
              </p>
            </div>
          )}

          {active && (
            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
              {questions.map((question, questionIndex) => (
                <fieldset key={question.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <legend style={{ padding: '0 6px', color: 'var(--color-forest)', fontWeight: 700 }}>
                    Question {questionIndex + 1} of {questions.length}
                  </legend>
                  <p style={{ color: 'var(--color-text-main)', fontWeight: 650, marginBottom: '12px' }}>{question.question}</p>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-main)', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={`course-test-${question.id}`}
                          checked={answers[questionIndex] === optionIndex}
                          onChange={() => {
                            const next = [...answersRef.current];
                            next[questionIndex] = optionIndex;
                            answersRef.current = next;
                            setAnswers(next);
                          }}
                          style={{ marginTop: '5px', accentColor: 'var(--color-emerald)' }}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          )}

          {attempt && !attempt.passed && !active && (
            <div role="status" style={{ padding: '16px', marginBottom: '16px', background: 'var(--color-danger-soft)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-main)' }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>You scored {attempt.score} of {attempt.total} ({attempt.percent}%). You need at least 50% to pass.</strong>
              <span>
                {attempt.submissionReason === 'focus_lost' ? 'The test was automatically submitted when you left the page. ' : ''}
                Review the course lessons, then take the final test again. No certificate has been issued yet.
              </span>
            </div>
          )}

          {error && (
            <p role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)', marginBottom: '14px' }}>
              <CircleAlert size={17} /> {error}
            </p>
          )}

          {submitting && (
            <p role="status" style={{ color: 'var(--color-text-main)', marginBottom: '14px' }}>
              <LockKeyhole size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Submitting and grading your test…
            </p>
          )}

          {!active && !submitting && (
            <button type="button" className="btn btn-emerald btn-lg" onClick={startTest}>
              {attempt ? 'Retake final test' : 'Start final test'}
            </button>
          )}
          {active && (
            <button type="button" className="btn btn-emerald btn-lg" onClick={() => submitAttempt('submitted')} disabled={submitting}>
              Submit final test
            </button>
          )}
        </>
      )}
    </section>
  );
}
