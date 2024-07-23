const checkteacher = `select * from teachers where email=$1`;

const answercheck = `SELECT
    s.student_id,
    s.submission_id,
    s.quiz_id,
    s.submission_time,
    s.question_id,
    s.submitted_answer,
    q.correct_answer,
    CASE
        WHEN s.submitted_answer = q.correct_answer THEN 'Correct'
        ELSE 'Incorrect'
    END AS answer_status
FROM
    submissions s
JOIN
    quiz_questions q ON s.question_id = q.question_id
where student_id=$1`;

const getteacherclasses = `
SELECT c.class_subject_id, c.class_id, c.subject_id, c.teacher_id, s.subject_name, t.teacher_name,e.class_name
FROM class_subjects c
JOIN subjects s ON c.subject_id = s.subject_id
JOIN classes e ON c.class_id = e.class_id
JOIN teachers t ON c.teacher_id = t.teacher_id
where c.teacher_id=$1`;

const getclasses = `select exam_date,exam_id,id as exam_schedule_id,total_marks,exam_schedule.subject_id,exam_schedule.subject,classes.class_id,
	classes.class_name,class_subjects.class_subject_id,class_subjects.teacher_id as subj_teacher from exam_schedule
join class_subjects on class_subjects.subject_id=exam_schedule.subject_id
	join classes on class_subjects.class_id=classes.class_id
where exam_schedule.class_grade_id=classes.class_grade_id and class_subjects.teacher_id =$1 and exam_id=$2`;

const attendancerecords = `SELECT 
    a.attendance_date,
    c.class_grade_id,
    COUNT(a.student_id) AS total_students,
	c.class_id,
    c.class_name,
    SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_students
FROM 
    attendance a
	join students s on s.student_id=a.student_id
JOIN 
    classes c ON s.class_id = c.class_id
WHERE 
    s.class_id = $1
GROUP BY 
    a.attendance_date, c.class_grade_id,c.class_id
ORDER BY 
    a.attendance_date DESC;`;

module.exports = {
  checkteacher,
  answercheck,
  getclasses,
  attendancerecords,
  getteacherclasses,
};
