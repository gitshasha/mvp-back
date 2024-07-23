const checkuser = "Select * from users where username=$1";
const checkclass = "select class_id from students where student_id=$1";
const allstudents =
  "Select student_id,first_name,last_name,email,student_roll,phone,gender,classes.class_name from students join classes on students.class_id=classes.class_id  order by classes.class_id";
const checkstudent = "select * from students where email=$1";
const adduser =
  "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)";
const leavereq =
  "Insert into leave_requests (user_id,leave_type,start_date,end_date,reason) values ($1,$2, $3,$4,$5)";
const pendleaves = "Select * from leave_requests where Status='Pending' ";
const editleaves =
  "UPDATE leave_requests SET status=$1,admin_comment=$2 where request_id=$3";
const checkroll = "Select * from students where student_id=$1";
const feepayment = `INSERT INTO payment (student_id, amount, payment_date, payment_method,token)
VALUES ($1,$2,'2024-04-28', 'credit_cash',$3);`;
const classstudents = `SELECT student_id, first_name, last_name FROM Students JOIN Classes  ON students.class_id = classes.class_id WHERE classes.class_name = 'Class 2B'`;

const feedetails = `SELECT f.amount,  COALESCE(SUM(p.amount),0) as amount_paid , f.amount - COALESCE(SUM(p.amount), 0) AS remaining_amount FROM Fee f LEFT JOIN Payment p ON f.student_id = p.student_id
WHERE f.student_id = $1
GROUP BY f.student_id, f.amount;`;
const transactions = `select *from payment where student_id=$1 `;
const statusupdate = `UPDATE fee AS f
SET payment_status = 
    CASE
        WHEN f.amount - COALESCE((SELECT SUM(p.amount) FROM payment AS p WHERE p.student_id = f.student_id), 0) = 0 THEN 'paid'
        ELSE 'pending'
    END
WHERE f.student_id = $1;
`;

const checkattendance = `
	SELECT 
    student_id,
    (COUNT(CASE WHEN status = 'present' THEN 1 END) / CAST(COUNT(*) AS FLOAT)) * 100 AS attendance_percentage
FROM 
    attendance
	WHERE 
    student_id = $1
GROUP BY 
    student_id;`;

const class_subjects = `SELECT c.class_subject_id, c.class_id, c.subject_id, c.teacher_id, s.subject_name, t.teacher_name
FROM class_subjects c
JOIN subjects s ON c.subject_id = s.subject_id
JOIN teachers t ON c.teacher_id = t.teacher_id
WHERE c.class_id = $1;
`;
const dailyattendance = `select * from attendance
where student_id=$1`;

const studentposts = `select * from posts
where role='Student'`;

const getquizes = `SELECT q.quiz_id,q.quiz_title,quiz_date
FROM quiz q
LEFT JOIN submissions s ON q.quiz_id = s.quiz_id AND s.student_id = $1
WHERE s.submission_id IS NULL and q.class_id=$2`;
const getquizquestions = `SELECT
    q.quiz_id,
    q.quiz_title,
    qq.question_id,
    qq.question_text,
    qq.options,
    qq.correct_answer
FROM
    quiz q
JOIN
    quiz_questions qq ON q.quiz_id = qq.quiz_id 
    where q.quiz_id=$1`;
// const addrecent = `WITH answer_status AS (
//     SELECT
//         s.student_id,
//         s.quiz_id,
//         sqa.question_id,
//         sqa.submitted_answer::text AS submitted_answer,
//         qq.correct_answer,
//         CASE
//             WHEN sqa.submitted_answer::text = qq.correct_answer THEN 'Correct'
//             ELSE 'Incorrect'
//         END AS answer_status
//     FROM
//         subjson s
//     CROSS JOIN LATERAL (
//         SELECT
//             jsonb_object_keys(s.sub_answers) AS question_id,
//             s.sub_answers->jsonb_object_keys(s.sub_answers) AS submitted_answer
//     ) sqa
//     JOIN
//         quiz_questions qq ON qq.question_id::TEXT = sqa.question_id
//     WHERE
//         s.student_id = $1 AND s.quiz_id = $2
// ),
// summary AS (
//     SELECT
//         student_id,
//         quiz_id,
//         COUNT(*) AS total_questions,
//         SUM(CASE WHEN answer_status = 'Correct' THEN 1 ELSE 0 END) AS correct_answers
//     FROM
//         answer_status
//     GROUP BY
//         student_id, quiz_id
// ),
// final_result AS (
//     SELECT
//         student_id,
//         quiz_id,
//         total_questions,
//         correct_answers,
//         ROUND((correct_answers::numeric / total_questions::numeric) * 100, 2) AS percentage
//     FROM
//         summary
// )
// INSERT INTO recent (student_id, quiz_id, total_questions, correct_answers, percentage)
// SELECT
//     student_id,
//     quiz_id,
//     total_questions,
//     correct_answers,
//     percentage
// FROM
//     final_result;`;
const recentquiz = `WITH score_calculation AS (
    SELECT
        student_id,
        quiz_id,
        COUNT(*) AS total_questions,
        COUNT(*) FILTER (WHERE result = 'Correct') AS total_correct,
        COUNT(*) FILTER (WHERE result = 'Correct') AS score
    FROM
        quiz_results
    WHERE
        student_id = $1 AND quiz_id = $2
    GROUP BY
        student_id, quiz_id
)
INSERT INTO recents (student_id, quiz_id, attempted_at, score, total_questions, total_correct)
SELECT student_id, quiz_id, CURRENT_TIMESTAMP, score, total_questions, total_correct
FROM score_calculation
ON CONFLICT (student_id, quiz_id) DO UPDATE SET
    attempted_at = EXCLUDED.attempted_at,
    score = EXCLUDED.score,
    total_questions = EXCLUDED.total_questions,
    total_correct = EXCLUDED.total_correct;
`;

const checkanswers = `
WITH answer_status AS (
    SELECT
        s.student_id,
        s.quiz_id,
        sqa.question_id,
        sqa.submitted_answer::text AS submitted_answer,
        qq.correct_answer,
        CASE
            WHEN sqa.submitted_answer::text = qq.correct_answer THEN 'Correct'
            ELSE 'Incorrect'
        END AS answer_status
    FROM
        subjson s
    CROSS JOIN LATERAL (
        SELECT
            jsonb_object_keys(s.sub_answers) AS question_id,
            s.sub_answers->jsonb_object_keys(s.sub_answers) AS submitted_answer
    ) sqa
    JOIN
        quiz_questions qq ON qq.question_id::TEXT = sqa.question_id
    WHERE
        s.student_id = $1 AND s.quiz_id = $2
),
summary AS (
    SELECT
        student_id,
        quiz_id,
        COUNT(*) AS total_questions,
        SUM(CASE WHEN answer_status = 'Correct' THEN 1 ELSE 0 END) AS correct_answers
    FROM
        answer_status
    GROUP BY
        student_id, quiz_id
)
SELECT distinct
    a.student_id,
    a.quiz_id,
    a.question_id,
    a.submitted_answer,
    a.correct_answer,
    a.answer_status,
    ROUND((s.correct_answers::numeric / s.total_questions::numeric) * 100, 2) AS percentage
FROM
    answer_status a
JOIN
    summary s ON a.student_id = s.student_id AND a.quiz_id = s.quiz_id;

`;
const quiz_answers = `WITH comparison AS (
        SELECT
          sa.student_id,
          sa.quiz_id,
          sa.question_id,
          sa.submitted_answer,
          ca.correct_answer,
          CASE
            WHEN LOWER(TRIM(sa.submitted_answer)) = LOWER(TRIM(ca.correct_answer)) THEN 'Correct'
            ELSE 'Incorrect'
          END AS result
        FROM
          submissions sa
        JOIN
          quiz_questions ca ON sa.question_id = ca.question_id
        WHERE
          sa.student_id = $1 AND sa.quiz_id = $2
      )
      INSERT INTO quiz_results (student_id, quiz_id, question_id, submitted_answer, correct_answer, result)
      SELECT student_id, quiz_id, question_id, submitted_answer, correct_answer, result
      FROM comparison
      ON CONFLICT (student_id, quiz_id, question_id) DO UPDATE SET
    submitted_answer = EXCLUDED.submitted_answer,
    correct_answer = EXCLUDED.correct_answer,
    result = EXCLUDED.result;`;
const submitanswersjson = `INSERT INTO subjson (student_id, quiz_id, sub_answers)
VALUES ($1, $2, $3);`;

const getassignments = `SELECT q.assignment_id,q.title,q.due_date
FROM assignments q
LEFT JOIN assignment_submissions s ON q.assignment_id = s.assignment_id
 AND s.student_id = $1
WHERE s.submission_id IS NULL and q.class_id=$2`;

const assignmentinfo = `select * from assignments where assignment_id=$1 `;
// const getmessages = `select m.content,m.timestamp,t.teacher_name from messages as m join teachers as t on m.teacher_id=t.teacher_id where m.class_id=$1 and m.teacher_id=$2`;
const getmessages = `select * from messages where class_subject_id=$1`;

const getreport = `
select mark_id,student_id,marks.class_subject_id,marks, subject ,
	exam_schedule.total_marks
	from marks 
join class_subjects on marks.class_subject_id=class_subjects.class_subject_id
join exam_schedule on marks.exam_schedule_id=exam_schedule.id
where student_id=$1 and marks.exam_id=$2`;


module.exports = {
  checkuser,
  allstudents,
  adduser,
  leavereq,
  pendleaves,
  editleaves,
  checkroll,
  feepayment,
  classstudents,
  feedetails,
  class_subjects,
  checkstudent,
  checkattendance,
  statusupdate,
  dailyattendance,
  transactions,
  studentposts,
  getquizes,
  getquizquestions,
  checkanswers,
  //   addrecent,
  submitanswersjson,
  getassignments,
  assignmentinfo,
  getmessages,
  quiz_answers,
  recentquiz,
  getreport,
};
