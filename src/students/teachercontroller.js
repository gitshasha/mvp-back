const pool = require("../../database");
const argon2 = require("argon2");
const Teacherqueries = require("./Teacherqueries");
const Addquiz = async (req, res) => {
  const client = await pool.connect();
  console.log(String(req.body.allquestions[0].correctAnswer));

  try {
    await client.query("BEGIN");
    const insertQuizResult = await client.query(
      "INSERT INTO quiz (class_id,quiz_title) VALUES ($1,$2) RETURNING quiz_id",
      [req.body.classlist, req.body.quiz_title]
    );
    const quizId = insertQuizResult.rows[0].quiz_id;

    const insertQuestionPromises = req.body.allquestions.map((question) => {
      return client.query(
        "INSERT INTO quiz_questions (quiz_id, question_text, options, correct_answer) VALUES ($1, $2, $3, $4)",
        [
          quizId,
          question.question,
          question.options,
          String(question.correctAnswer),
        ]
      );
    });

    await Promise.all(insertQuestionPromises);

    await client.query("COMMIT");
    res.status(201).send({ message: "Quiz and questions added successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).send({ error: "An error occurred while adding the quiz" });
  } finally {
    client.release();
  }
};
const Teacherlogin = (req, res) => {
  pool.connect();
  const { username, password } = req.body;

  pool.query(Teacherqueries.checkteacher, [username], async (err, results) => {
    if (results.rows.length == 0) {
      return res.json({ success: false });
    } else {
      try {
        if (results.rows[0].password == password) {
          return res.json({ success: true, user: results.rows[0] });
        } else {
          return res.json({ success: false });
        }
        //   const hashed = results.rows[0].password;
        //   if (await argon2.verify(hashed, password)) {
        //     res.status(201).send("Login");
        //   } else {
        //     res.status(201).send("wrong Login");
        //   }
      } catch (err) {
        // internal failure
        console.log(err);
        res.status(500).send("err Login");
      }
    }
  });
};
const getSalaryReport = async (teacherId) => {
  try {
    const salaryRes = await pool.query(
      `
      SELECT
        s.salary_id,
        s.basic_salary,
        s.allowances,
        s.income_tax,
        s.retirement_contribution,
        s.health_insurance,
        s.other_deductions,
        s.unpaid_leave_deductions,
        s.basic_salary + s.allowances - (s.income_tax + s.retirement_contribution + s.health_insurance + s.other_deductions + s.unpaid_leave_deductions) AS net_salary,
        s.payment_date,
        s.status
      FROM salaries s
      WHERE s.teacher_id = $1
      ORDER BY s.payment_date DESC;
    `,
      [teacherId]
    );

    return salaryRes.rows;
  } catch (err) {
    console.error("Error retrieving salary report:", err);
    throw err;
  }
};
const getsalrepo = async (req, res) => {
  const teacherId = parseInt(req.params.teacherId, 10);

  try {
    const salaryReport = await getSalaryReport(teacherId);
    res.status(200).json(salaryReport);
  } catch (err) {
    res
      .status(500)
      .json({ error: "An error occurred while retrieving the salary report." });
  }
};
const messageclass = async (req, res) => {
  const { teacherId, class_subject_id, content } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO messages (teacher_id,class_subject_id, content) VALUES ($1, $2, $3) RETURNING message_id",
      [teacherId, class_subject_id, content]
    );
    res.json({ messageId: result.rows[0].message_id });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).send("Server error");
  }
};
const teacherschedule = async (req, res) => {
  const { teacherId } = req.params;

  try {
    const result = await pool.query(
      `select tt.timetable_id ,tt.class_id,tt.day_of_week,tt.period,tt.Start_time,
tt.end_time,cl.class_name,tt.teacher_id,sub.subject_name,tea.teacher_name from timetable as tt
join classes as cl on tt.class_id=cl.class_id
join teachers as tea on tt.teacher_id=tea.teacher_id 
join subjects as sub on tt.subject_id=sub.subject_id 
where tt.teacher_id=$1`,
      [teacherId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching teacher schedule:", err);
    res.status(500).send("Server error");
  }
};
const getclasses = async (req, res) => {
  const { teacherId, examId } = req.body;
  console.log(teacherId);

  try {
    const result = await pool.query(Teacherqueries.getclasses, [
      teacherId,
      examId,
    ]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching teacher schedule:", err);
    res.status(500).send("Server error");
  }
};
const attendancestudents = async (req, res) => {
  const { teacherId } = req.params;
  console.log(teacherId);
  try {
    const students = await pool.query(
      `select  t.student_id,t.first_name,t.last_name,t.student_roll,t.class_id,s.class_name from students as t join classes as s on s.class_id=t.class_id where s.teacher_id=$1`,
      [teacherId]
    );
    res.json(students.rows);
  } catch (err) {
    console.error("Error fetching teacher schedule:", err);
    res.status(500).send("Server error");
  }
};
const attendancerecords = async (req, res) => {
  const { classId } = req.params;
  try {
    const students = await pool.query(Teacherqueries.attendancerecords, [
      classId,
    ]);
    res.json(students.rows);
  } catch (err) {
    console.error("Error fetching teacher schedule:", err);
    res.status(500).send("Server error");
  }
};
const classteacher = async (req, res) => {
  const { teacherId } = req.params;

  try {
    const students = await pool.query(
      `select * from classes where teacher_id=$1`,
      [teacherId]
    );
    res.json(students.rows);
  } catch (err) {
    console.error("Error fetching teacher schedule:", err);
    res.status(500).send("Server error");
  }
};
const checktoday = async (req, res) => {
  const { attendance_date, class_id } = req.body;
  console.log(attendance_date);
  console.log(class_id);

  try {
    const students = await pool.query(
      `select COUNT(*) from attendance 
         join students on students.student_id=attendance.student_id 
      where attendance_date=$1 and class_id=$2`,
      [attendance_date, class_id]
    );
    const attendanceRecorded = students.rows[0].count > 0;
    res.json({ attendanceRecorded });
  } catch (err) {
    console.error("Error fetching teacher schedule:", err);
    res.status(500).send("Server error");
  }
};
const editattendance = async (req, res) => {
  const allrecords = req.body.attendanceRecords;
  console.log(allrecords);
  try {
    if (allrecords) {
      allrecords.forEach((value) => {
        pool.query(
          `UPDATE attendance
                  SET status = $1
                  WHERE student_id = $2 AND attendance_date = $3 and attendance_id=$4
   `,
          [
            value.status,
            value.student_id,
            value.attendance_date,
            value.attendance_id,
          ]
        );
      });
      res.status(200).json({ Status: "done" });
    }
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).send("Server error");
  }
};
const attendancebydate = async (req, res) => {
  const { attendance_date } = req.body;

  const { class_id } = req.body;
  console.log();

  try {
    const students = await pool.query(
      `select attendance_id,attendance.student_id,attendance_date,status,first_name,class_id,last_name,student_roll
       from attendance 
       join students on students.student_id=attendance.student_id 
       where attendance_date=$1 and students.class_id=$2`,
      [attendance_date, class_id]
    );
    console.log(students.rows);
    res.json(students.rows);
  } catch (err) {
    console.error("Error fetching teacher schedule:", err);
    res.status(500).send("Server error");
  }
};
const teacherattend = async (req, res) => {
  const allrecords = req.body.attendanceRecords;

  try {
    if (allrecords) {
      allrecords.forEach((value) => {
        pool.query(
          `insert into attendance (student_id,status,attendance_date)
          values($1,$2,$3) `,
          [value.student_id, value.status, value.attendance_date]
        );
      });
      res.status(200).json({ Status: "done" });
    }
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).send("Server error");
  }
};
const Studentmarks = async (req, res) => {
  console.log(req.body);

  const marksData = req.body.marks;
  const exam_id = req.body.exam_id;
  const class_subject_id = req.body.class_subject_id;
  const exam_schedule_id = req.body.exam_schedule_id;
  try {
    for (const studentId in marksData) {
      if (marksData.hasOwnProperty(studentId)) {
        const marks = marksData[studentId];

        await pool.query(
          `INSERT INTO marks (student_id, class_subject_id, exam_id, marks,exam_schedule_id)
           VALUES ($1, $2, $3, $4,$5)
           ON CONFLICT (student_id, class_subject_id, exam_id) 
           DO UPDATE SET marks = EXCLUDED.marks`,
          [studentId, class_subject_id, exam_id, marks, exam_schedule_id] // Adjust subject_id and exam_id as necessary
        );
      }
    }
    res.status(200).json({ message: "Marks submitted successfully" });
  } catch (error) {
    console.error("Error submitting marks:", error);
    res.status(500).json({ message: "Failed to submit marks" });
  }
  // try {
  //   await pool.query(
  //     `INSERT INTO marks (student_id, class_subject_id, exam_id, marks)
  //      VALUES ($1, $2, $3, $4)
  //      ON CONFLICT (student_id, class_subject_id, exam_id)
  //      DO UPDATE SET marks = EXCLUDED.marks`,
  //     [studentId, class_subject_id, examId, marks]
  //   );
  //   res.status(200).json({ message: "Marks submitted successfully" });
  // } catch (error) {
  //   console.error("Error submitting marks:", error);
  //   res.status(500).json({ message: "Failed to submit marks" });
  // }
};
const classStudents = async (req, res) => {
  const { classId } = req.params;
  try {
    const response = await pool.query(
      `select  t.student_id,t.first_name,t.last_name,t.student_roll,t.class_id,s.class_name from students as t join classes as s on s.class_id=t.class_id where t.class_id=$1`,
      [classId]
    );
    res.status(200).json(response.rows);
  } catch (err) {
    console.log(err);
  }
};
const teacherclasses = async (req, res) => {
  const { teacherId } = req.params;
  try {
    const response = await pool.query(Teacherqueries.getteacherclasses, [
      teacherId,
    ]);
    res.status(200).json(response.rows);
  } catch (err) {
    console.log(err);
  }
};
const teacherposts = async (req, res) => {
  pool.query(
    `select * from posts
where role='Teacher'`,
    (err, resul) => {
      if (!err) {
        res.status(200).json(resul.rows);
      } else {
        console.log(err);
      }
    }
  );
};
const posthomework = async (req, res) => {
  const { subject_id, class_id, teacher_id, title, desc, due_date, image_url } =
    req.body;
  pool.query(
    `insert into assignments 
      (subject_id,teacher_id,class_id,title,description,due_date,image_url) 
      values($1,$2,$3,$4,$5,$6,$7)`,
    [subject_id, teacher_id, class_id, title, desc, due_date, image_url],
    (err, resul) => {
      if (!err) {
        res.status(200).json(resul.rows);
      } else {
        console.log(err);
      }
    }
  );
};
const getteacherassignments = async (req, res) => {
  const teacherId = req.body.teacherId;
  const class_id = req.body.class_id;
  try {
    const assignments = await pool.query(
      `select * from assignments where teacher_id=$1 and class_id=$2 `,
      [teacherId, class_id]
    );
    res.json(assignments.rows);
  } catch (err) {
    console.log(err);
  }
};
const homesubmission = async (req, res) => {
  const assignment_id = req.body.assignment_id;
  try {
    const assignments = await pool.query(
      `select * from assignment_submissions 
        where assignment_id=$1`,
      [assignment_id]
    );
    console.log(assignments.rows);
    res.json(assignments.rows);
  } catch (err) {
    console.log(err);
  }
};
module.exports = {
  Addquiz,
  Teacherlogin,
  getsalrepo,
  teacherschedule,
  messageclass,
  checktoday,
  getclasses,
  attendancestudents,
  teacherattend,
  Studentmarks,
  classStudents,
  teacherposts,
  teacherclasses,
  editattendance,
  attendancerecords,
  classteacher,
  attendancebydate,
  posthomework,
  getteacherassignments,
  homesubmission,
};
