import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { isStaffRole } from '@/lib/permissions';

export const runtime = 'nodejs';

function validateQuestions(value) {
  if (!Array.isArray(value) || value.length > 50) {
    return { error: 'Add between 1 and 50 final-test questions, or remove all questions to disable the test.' };
  }

  const questions = [];
  for (const [index, item] of value.entries()) {
    const question = String(item?.question || '').trim();
    const options = Array.isArray(item?.options) ? item.options.map((option) => String(option || '').trim()) : [];
    const correctIndex = Number(item?.correctIndex);
    const explanation = String(item?.explanation || '').trim();
    if (question.length < 5 || question.length > 1000) {
      return { error: `Question ${index + 1} must be between 5 and 1,000 characters.` };
    }
    if (options.length < 2 || options.length > 8 || options.some((option) => !option || option.length > 500)) {
      return { error: `Question ${index + 1} must have 2 to 8 non-empty options, each no longer than 500 characters.` };
    }
    if (!Number.isSafeInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      return { error: `Choose the correct answer for question ${index + 1}.` };
    }
    if (explanation.length > 1000) {
      return { error: `The explanation for question ${index + 1} must be 1,000 characters or fewer.` };
    }
    questions.push({ question, options, correctIndex, explanation });
  }

  return { questions };
}

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Only staff can manage the final test.' }, { status: 403 });
    }

    const { id } = await params;
    const courseId = Number(id);
    if (!Number.isSafeInteger(courseId) || courseId < 1) {
      return NextResponse.json({ error: 'Choose a valid course.' }, { status: 400 });
    }

    const result = await query(
      `SELECT id, question, options, correct_index AS "correctIndex", explanation
       FROM course_final_test_questions
       WHERE category_id = $1
       ORDER BY sort_order ASC, id ASC`,
      [courseId]
    );
    return NextResponse.json({ questions: result.rows });
  } catch (error) {
    console.error('Course final test GET error:', error);
    return NextResponse.json({ error: 'Failed to load the final test.' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Only staff can manage the final test.' }, { status: 403 });
    }

    const { id } = await params;
    const courseId = Number(id);
    if (!Number.isSafeInteger(courseId) || courseId < 1) {
      return NextResponse.json({ error: 'Choose a valid course.' }, { status: 400 });
    }

    const parsed = validateQuestions((await request.json()).questions);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    await transaction(async (client) => {
      const course = await client.query('SELECT id FROM article_categories WHERE id = $1 FOR UPDATE', [courseId]);
      if (course.rows.length === 0) throw Object.assign(new Error('Course not found.'), { status: 404 });

      await client.query('DELETE FROM course_final_test_questions WHERE category_id = $1', [courseId]);
      for (const [index, question] of parsed.questions.entries()) {
        await client.query(
          `INSERT INTO course_final_test_questions
             (category_id, sort_order, question, options, correct_index, explanation)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [courseId, index + 1, question.question, JSON.stringify(question.options), question.correctIndex, question.explanation]
        );
      }
    });

    await logAudit({
      userId: user.id,
      action: 'COURSE_FINAL_TEST_UPDATED',
      entityType: 'article_categories',
      entityId: courseId,
      details: { questionCount: parsed.questions.length },
    });

    return NextResponse.json({ success: true, questionCount: parsed.questions.length });
  } catch (error) {
    if (error.status === 404) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error('Course final test update error:', error);
    return NextResponse.json({ error: 'Failed to save the final test.' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Only enrolled students can take a course final test.' }, { status: 403 });
    }

    const { id } = await params;
    const courseId = Number(id);
    if (!Number.isSafeInteger(courseId) || courseId < 1) {
      return NextResponse.json({ error: 'Choose a valid course.' }, { status: 400 });
    }

    const body = await request.json();
    if (!Array.isArray(body.answers)) {
      return NextResponse.json({ error: 'Submit your test answers to continue.' }, { status: 400 });
    }

    const result = await transaction(async (client) => {
      const enrollment = await client.query(
        `SELECT ac.name
         FROM article_categories ac
         JOIN course_enrollments ce ON ce.category_id = ac.id AND ce.user_id = $1
         WHERE ac.id = $2
         FOR UPDATE OF ac`,
        [user.id, courseId]
      );
      if (enrollment.rows.length === 0) {
        throw Object.assign(new Error('Start this course before taking its final test.'), { status: 403 });
      }

      const progress = await client.query(
        `SELECT COUNT(DISTINCT a.id)::int AS total,
                COUNT(DISTINCT p.article_id)::int AS completed
         FROM articles a
         LEFT JOIN student_learning_progress p
           ON p.article_id = a.id AND p.user_id = $1
         WHERE a.category_id = $2 AND a.status = 'published'`,
        [user.id, courseId]
      );
      if (!progress.rows[0].total || progress.rows[0].completed < progress.rows[0].total) {
        throw Object.assign(new Error('Complete every published lesson before taking the final test.'), { status: 403 });
      }

      const questions = await client.query(
        `SELECT question, options, correct_index
         FROM course_final_test_questions
         WHERE category_id = $1
         ORDER BY sort_order ASC, id ASC
         FOR SHARE`,
        [courseId]
      );
      if (questions.rows.length === 0) {
        throw Object.assign(new Error('The course is not finished yet. The instructor must add a final test before you can complete it.'), { status: 409 });
      }
      if (body.answers.length !== questions.rows.length) {
        throw Object.assign(new Error('The test has changed. Reload the course and try again.'), { status: 400 });
      }

      const score = questions.rows.reduce((total, question, index) => {
        const answer = body.answers[index];
        return total + (Number.isSafeInteger(answer) && answer === question.correct_index ? 1 : 0);
      }, 0);
      const total = questions.rows.length;
      const passed = score / total >= 0.5;
      const submissionReason = body.reason === 'focus_lost' ? 'focus_lost' : 'submitted';

      await client.query(
        `INSERT INTO course_final_test_attempts
           (user_id, category_id, score, total_questions, passed, submission_reason)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, courseId, score, total, passed, submissionReason]
      );

      let certificate = null;
      if (passed) {
        const code = `INT-CERT-${new Date().getFullYear()}-${randomBytes(5).toString('hex').toUpperCase()}`;
        const created = await client.query(
          `INSERT INTO certificates
             (user_id, category_id, certificate_code, title, issue_date, verification_url, certificate_kind)
           VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'course')
           ON CONFLICT (user_id, category_id) WHERE category_id IS NOT NULL DO NOTHING
           RETURNING *`,
          [user.id, courseId, code, `${enrollment.rows[0].name} Leadership Course`, `/certificates/${code}`]
        );
        certificate = created.rows[0] || (await client.query(
          'SELECT * FROM certificates WHERE user_id = $1 AND category_id = $2',
          [user.id, courseId]
        )).rows[0];
      }

      return { score, total, passed, certificate, submissionReason };
    });

    if (result.passed && result.certificate) {
      await logAudit({
        userId: user.id,
        action: 'COURSE_FINAL_TEST_PASSED',
        entityType: 'certificates',
        entityId: result.certificate.id,
        details: { categoryId: courseId, score: result.score, total: result.total },
      });
    }

    return NextResponse.json({
      success: true,
      score: result.score,
      total: result.total,
      percent: Math.round((result.score / result.total) * 100),
      passed: result.passed,
      submissionReason: result.submissionReason,
      certificate: result.certificate,
      message: result.passed
        ? 'Congratulations! You passed the final test and earned your course certificate.'
        : 'You did not reach the 50% pass mark. Review the course and try the final test again.',
    });
  } catch (error) {
    if (error.status) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Course final test submission error:', error);
    return NextResponse.json({ error: 'Failed to submit the final test.' }, { status: 500 });
  }
}
