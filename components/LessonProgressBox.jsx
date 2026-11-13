'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Award, 
  ArrowRight, 
  Sparkles, 
  HelpCircle, 
  BookOpen, 
  Check, 
  RotateCcw 
} from 'lucide-react';

export default function LessonProgressBox({
  articleId,
  articleTitle,
  categoryName,
  categoryId,
  initialCompleted = false,
  initialCourseStats = null,
  isLoggedIn = false,
  initialCertificate = null,
  nextLesson = null,
  quizQuestion = null,
  quizOptions = null,
  quizCorrectIndex = 0,
  quizExplanation = null,
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [courseStats, setCourseStats] = useState(initialCourseStats || { total: 1, completed: initialCompleted ? 1 : 0, percent: initialCompleted ? 100 : 0 });
  const [certificate, setCertificate] = useState(initialCertificate);
  const [next, setNext] = useState(nextLesson);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [committed, setCommitted] = useState(false);
  const [quizError, setQuizError] = useState('');

  // Parse quiz options
  const options = (() => {
    if (Array.isArray(quizOptions) && quizOptions.length > 0) return quizOptions;
    if (typeof quizOptions === 'string') {
      try {
        const parsed = JSON.parse(quizOptions);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      'Take proactive, ethical initiative on everyday challenges without waiting for external permission.',
      'Criticize school and community challenges without proposing constructive solutions.',
      'Wait for teachers or student council mentors to direct every single decision.'
    ];
  })();

  const correctIndex = Number.isInteger(Number(quizCorrectIndex)) ? Number(quizCorrectIndex) : 0;
  const questionText = quizQuestion || 'How should an INTAMBWE student leader put this lesson into daily practice?';
  const explanationText = quizExplanation || 'Excellence in leadership begins by taking personal initiative, listening with empathy, and acting with steadfast integrity.';

  if (!isLoggedIn) {
    return (
      <div className="card" style={{ marginTop: '36px', padding: '32px', backgroundColor: '#F8FAF9', border: '1px dashed var(--color-border)', textAlign: 'center' }}>
        <BookOpen size={28} style={{ color: 'var(--color-emerald)', margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest)', marginBottom: '8px' }}>
          Track Your Leadership Progression
        </h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', maxWidth: '520px', margin: '0 auto 18px' }}>
          Sign in to INTAMBWE to test your understanding, save your lesson progress, and unlock verifiable certificates.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <Link href={`/login?redirect=/explore/${articleId}`} className="btn btn-emerald btn-sm">
            Sign In to Complete Lesson
          </Link>
          <Link href={`/register?redirect=/explore/${articleId}`} className="btn btn-outline btn-sm">
            Create Student Account
          </Link>
        </div>
      </div>
    );
  }

  const handleCompleteWithCheck = async (e) => {
    if (e) e.preventDefault();
    if (!completed) {
      if (selectedAnswer === null || selectedAnswer === undefined || selectedAnswer === '') {
        setQuizError('Please select an answer to the comprehension test.');
        return;
      }
      if (Number(selectedAnswer) !== correctIndex) {
        setQuizError(`Not quite. Key Takeaway: ${explanationText} Please review the lesson and try again!`);
        return;
      }
      if (!committed) {
        setQuizError('Please check the reflection and practice commitment box below.');
        return;
      }
    }

    setQuizError('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update lesson progress.');

      setCompleted(data.isCompleted);
      if (data.courseStats) {
        setCourseStats(data.courseStats);
      }
      if (data.nextLesson) {
        setNext(data.nextLesson);
      }
      if (data.courseCertificate || data.pathwayCertificate) {
        setCertificate(data.courseCertificate || data.pathwayCertificate);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update progress.');
    } finally {
      setLoading(false);
    }
  };

  const isAllCourseDone = courseStats && (courseStats.percent === 100 || courseStats.allCompleted);

  return (
    <div 
      className="card" 
      style={{ 
        marginTop: '40px', 
        marginBottom: '40px', 
        padding: '36px', 
        borderRadius: '16px',
        backgroundColor: completed ? '#F3FAF5' : '#FFFFFF',
        border: `2px solid ${completed ? 'var(--color-emerald)' : 'var(--color-border)'}`,
        boxShadow: 'var(--shadow-md)',
        transition: 'all 0.3s ease'
      }}
    >
      {/* SECTION HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className={`badge ${completed ? 'badge-emerald' : 'badge-gold'}`}>
              {completed ? '✓ Lesson Completed' : 'Leadership Step Check'}
            </span>
            {categoryName && (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                Course: {categoryName}
              </span>
            )}
          </div>
          <h3 style={{ fontSize: '1.35rem', color: 'var(--color-forest)', margin: 0 }}>
            {completed ? 'Lesson Completed & Progress Verified!' : 'Step Comprehension & Knowledge Check'}
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            {completed 
              ? 'Your mastery for this step has been recorded in your student dashboard.' 
              : 'Answer the practical leadership check below to mark this step complete and measure your course progress.'}
          </p>
        </div>

        {/* PROGRESS PILL */}
        {courseStats && (
          <div style={{ textAlign: 'right', minWidth: '160px' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-emerald)' }}>
              {courseStats.percent || 0}% Complete
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>
              {courseStats.completed || 0} of {courseStats.total || 1} Lessons
            </div>
          </div>
        )}
      </div>

      {/* VISUAL PROGRESS BAR */}
      {courseStats && (
        <div style={{ width: '100%', height: '10px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '6px', overflow: 'hidden', marginBottom: '28px' }}>
          <div 
            style={{ 
              width: `${Math.min(100, Math.max(5, courseStats.percent || 0))}%`, 
              height: '100%', 
              backgroundColor: isAllCourseDone ? 'var(--color-gold)' : 'var(--color-emerald)',
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '6px'
            }} 
          />
        </div>
      )}

      {/* KNOWLEDGE CHECK TEST (When not yet completed) */}
      {!completed ? (
        <div style={{ backgroundColor: '#F9FCFA', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border-light)', marginBottom: '24px' }}>
          <h4 style={{ fontSize: '1.05rem', color: 'var(--color-forest)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={18} style={{ color: 'var(--color-emerald)' }} />
            <span>Practical Leadership Question</span>
          </h4>
          
          <p style={{ fontSize: '0.95rem', color: 'var(--color-forest)', lineHeight: 1.6, marginBottom: '16px', fontWeight: 600 }}>
            {questionText}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
            {options.map((opt, idx) => {
              const isSelected = Number(selectedAnswer) === idx;
              const letter = String.fromCharCode(65 + idx);
              return (
                <label 
                  key={idx}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '12px', 
                    padding: '12px 14px', 
                    borderRadius: '8px', 
                    border: `1px solid ${isSelected ? 'var(--color-emerald)' : 'var(--color-border)'}`, 
                    backgroundColor: isSelected ? '#EBF7F0' : '#FFFFFF', 
                    cursor: 'pointer', 
                    fontSize: '0.92rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input 
                    type="radio" 
                    name="quiz" 
                    value={idx} 
                    checked={isSelected} 
                    onChange={() => { setSelectedAnswer(idx); setQuizError(''); }} 
                    style={{ marginTop: '3px', accentColor: 'var(--color-emerald)' }}
                  />
                  <span style={{ fontWeight: 700, color: isSelected ? 'var(--color-emerald)' : 'var(--color-text-subtle)', width: '20px', flexShrink: 0 }}>
                    {letter}.
                  </span>
                  <span style={{ fontWeight: isSelected ? 600 : 400, color: 'var(--color-text-main)' }}>
                    {opt}
                  </span>
                </label>
              );
            })}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--color-forest)', fontWeight: 600 }}>
            <input 
              type="checkbox" 
              checked={committed} 
              onChange={(e) => { setCommitted(e.target.checked); setQuizError(''); }} 
              style={{ width: '16px', height: '16px', accentColor: 'var(--color-emerald)' }}
            />
            <span>I have reflected on this lesson and commit to practicing this leadership skill in my school and community.</span>
          </label>

          {quizError && (
            <div style={{ marginTop: '14px', padding: '10px 14px', backgroundColor: '#FDF2F2', color: 'var(--color-danger)', borderRadius: '8px', fontSize: '0.85rem', lineHeight: 1.5 }}>
              {quizError}
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <button
              type="button"
              onClick={handleCompleteWithCheck}
              disabled={loading}
              className="btn btn-emerald btn-lg"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <CheckCircle2 size={18} />
              <span>{loading ? 'Verifying & Saving…' : 'Submit Check & Complete Lesson'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* COMPLETED STATE */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-emerald)', marginBottom: '16px' }}>
            <CheckCircle2 size={24} />
            <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
              You have successfully completed and passed this lesson!
            </span>
          </div>

          {/* COURSE COMPLETION BANNER IF 100% */}
          {isAllCourseDone ? (
            <div style={{ backgroundColor: 'var(--color-forest)', color: 'white', padding: '24px', borderRadius: '12px', marginBottom: '20px', borderLeft: '4px solid var(--color-gold)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Sparkles size={22} style={{ color: 'var(--color-gold)' }} />
                <h4 style={{ color: 'white', fontSize: '1.25rem', margin: 0 }}>
                  Course Fully Completed!
                </h4>
              </div>
              <p style={{ color: '#d1dbd5', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '16px' }}>
                Outstanding leadership achievement! You have mastered every lesson in <strong>{categoryName}</strong>. Your verifiable certificate of completion is now available.
              </p>
              {certificate ? (
                <Link
                  href={certificate.verification_url || `/certificates/${certificate.certificate_code}`}
                  className="btn btn-gold"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Award size={18} />
                  <span>Download / View Official Certificate</span>
                </Link>
              ) : (
                <Link
                  href="/dashboard/student"
                  className="btn btn-gold"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Award size={18} />
                  <span>Claim Certificate on Student Dashboard</span>
                </Link>
              )}
            </div>
          ) : (
            /* NEXT LESSON SHORTCUT IF MORE REMAIN */
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              {next && (
                <Link 
                  href={`/explore/${next.slug}`} 
                  className="btn btn-emerald"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>Continue to Next Lesson: {next.title}</span>
                  <ArrowRight size={16} />
                </Link>
              )}
              {categoryId && (
                <Link href={`/courses/${categoryId}`} className="btn btn-outline">
                  View Course Curriculum
                </Link>
              )}
            </div>
          )}

          {/* RETAKE / UNMARK OPTION */}
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border-light)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
              Progress recorded in your student account
            </span>
            <button
              type="button"
              onClick={handleCompleteWithCheck}
              disabled={loading}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}
            >
              <RotateCcw size={13} />
              <span>{loading ? 'Updating…' : 'Reset / Retake Step'}</span>
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}
