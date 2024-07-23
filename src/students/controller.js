const pool = require("../../database");
const argon2 = require("argon2");
const queries = require("./queries");

const getstudent = (req, res) => {
  pool.connect();
  pool.query(`select * from public.users`, (err, resul) => {
    if (!err) {
      res.status(200).json(resul.rows);
    } else {
      console.log(err);
    }
  });
};

// const data= {
//     "user_id": 3,
//     "username": "student123",
//     "password": "studentpass",
//     "role": "student"
//}

const login = (req, res) => {
  const { username, password } = req.body;
  console.log(username)
    pool.connect();
  pool.query(queries.checkstudent, [username], async (err, results) => {
     if(err){
      console.log(err)
    }
    if (results.rows.length == 0) {
      return res.json({ success: false, user: "does not exist" });
    } else {
      try {
        if (results.rows[0].password == password) {
          return res.json({ success: true, user: results.rows[0] });
        } else {
          return res.json({ success: false, user: "password wrong" });
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
  pool.end()
};

const signup = async (req, res) => {
  const { user_id, username, password, role } = req.body;
  //  check student
  pool.query(queries.checkuser, [username], async (err, results) => {
    if (results.rows.length > 0) {
      res.send("exist");
    } else {
      try {
        // const hashed = await argon2.hash(password);
        pool.query(
          queries.adduser,
          [username, password, role],
          (err, results) => {
            if (err) throw err;
            res.status(201).send("created");
          }
        );
      } catch (err) {
        console.log(err);
      }
    }
  });
};
const getstudentclass = (req, res) => {
  const classid = req.params.classid;
  pool.query(
    `select * from public.classes where class_id=${classid}`,
    (err, resul) => {
      if (!err) {
        res.status(200).json(resul.rows);
      } else {
        console.log(err);
      }
    }
  );
};
const leave_request = (req, res) => {
  const { user_id, type, start, end, reason } = req.body;
  pool.query(
    queries.leavereq,
    [user_id, type, start, end, reason],
    (err, results) => {
      if (err) throw err;
      res.status(201).send("requested");
    }
  );
};
const wholetimetable = (req, res) => {
  const classid = req.params.classid;
  pool.query(
    `select * from public.timetable JOIN public.subjects ON timetable.subject_id = subjects.subject_id JOIN public.teachers ON timetable.teacher_id = teachers.teacher_id  where class_id=${classid}`,
    (err, resul) => {
      if (!err) {
        res.status(200).json(resul.rows);
      } else {
        console.log(err);
      }
    }
  );
};
const getclasstimetable = (req, res) => {
  const classid = req.params.classid;
  var days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  var d = new Date();
  var dayName = days[d.getDay()];
  console.log(dayName);
  pool.query(
    `select * from public.timetable JOIN public.subjects ON timetable.subject_id = subjects.subject_id JOIN public.teachers ON timetable.teacher_id = teachers.teacher_id  where class_id=${classid} and lower(day_of_week)=lower('${dayName}')`,
    (err, resul) => {
      if (!err) {
        res.status(200).json(resul.rows);
      } else {
        console.log(err);
      }
    }
  );
};
const getclasssubjects = (req, res) => {
  const classid = req.params.classid;

  pool.query(queries.class_subjects, [classid], (err, resul) => {
    if (!err) {
      res.status(200).json(resul.rows);
    } else {
      console.log(err);
    }
  });
};
const getstudentattendance = (req, res) => {
  const studentid = req.params.studentid;

  pool.query(queries.checkattendance, [studentid], (err, resul) => {
    if (!err) {
      res.status(200).json(resul.rows);
    } else {
      console.log(err);
    }
  });
};
const dailyattendance = (req, res) => {
  const studentid = req.params.studentid;

  pool.query(queries.dailyattendance, [studentid], (err, resul) => {
    if (!err) {
      res.status(200).json(resul.rows);
    } else {
      console.log(err);
    }
  });
};
const studentfee = (req, res) => {
  const studentid = req.params.studentid;

  pool.query(queries.feedetails, [studentid], (err, resul) => {
    if (!err) {
      res.status(200).json(resul.rows);
    } else {
      console.log(err);
    }
  });
};
const studenttransactions = (req, res) => {
  const studentid = req.params.studentid;

  pool.query(queries.transactions, [studentid], (err, resul) => {
    if (!err) {
      res.status(200).json(resul.rows);
    } else {
      console.log(err);
    }
  });
};

const studentposts = (req, res) => {
  pool.query(queries.studentposts, (err, resul) => {
    if (!err) {
      res.status(200).json(resul.rows);
    } else {
      console.log(err);
    }
  });
};

const getquizes = (req, res) => {
  const student_id = req.params.studentid;
  pool.query(
    `select class_id from public.students where student_id=${student_id}`,
    (err, result) => {
      if (!err) {
        console.log(result.rows);
        pool.query(
          queries.getquizes,
          [student_id, result.rows[0]["class_id"]],
          (err, results) => {
            if (!err) {
              res.status(200).json(results.rows);
            } else {
              console.log(err);
            }
          }
        );
      } else {
        console.log(err);
      }
    }
  );
};
const getquizquestions = (req, res) => {
  const quiz_id = req.params.quizid;
  pool.query(queries.getquizquestions, [quiz_id], (err, result) => {
    if (!err) {
      res.status(200).json(result.rows);
    } else {
      console.log(err);
    }
  });
};

const submitanswers = async (req, res) => {
  const answers = req.body.answers;
  const student_id = req.body.student_id;
  const quiz_id = req.body.quiz_id;
  console.log(answers);
  for (let key in answers) {
    console.log(key);

    if (answers.hasOwnProperty(key)) {
      const answer = answers[key];

      // Insert each question_id and answer into the SQL table
      const query = {
        text: "INSERT INTO submissions (student_id,question_id, submitted_answer,quiz_id) VALUES ($1, $2,$3,$4)",
        values: [student_id, key, answer, quiz_id],
      };

      await pool.query(query);
    }
  }
  console.log("All question-answer pairs inserted successfully");
  try {
    await pool.query(queries.quiz_answers, [student_id, quiz_id]);

    await pool.query(queries.recentquiz, [student_id, quiz_id]);
    res.status(200).json({ msg: "done" });
  } catch (err) {
    console.log(err);
  }
};
const recentquiz = (req, res) => {
  const student_id = req.params.studentid;
  pool.query(
    `select * from recents where student_id=$1`,
    [student_id],
    (err, resu) => {
      if (!err) {
        res.status(200).json(resu.rows);
      } else {
        console.log(err);
      }
    }
  );
};
const resultpage = (req, res) => {
  const student_id = req.body.student_id;
  const quiz_id = req.body.quiz_id;

  pool.query(
    "select * from quiz_results where student_id=$1 and quiz_id=$2",
    [student_id, quiz_id],
    (err, resu) => {
      if (!err) {
        console.log(resu.rows);
        res.status(200).json(resu.rows);
      } else {
        console.log(err);
      }
    }
  );
};

const getassignments = (req, res) => {
  const student_id = req.params.studentid;
  console.log(student_id)
  pool.query(
    `select class_id from public.students where student_id=${student_id}`,
    (err, result) => {
      if (!err) {
        console.log(result.rows);
        pool.query(
          queries.getassignments,
          [student_id, result.rows[0]["class_id"]],
          (err, results) => {
            if (!err) {
              res.status(200).json(results.rows);
            } else {
              console.log(err);
            }
          }
        );
      } else {
        console.log(err);
      }
    }
  );
};

const assignmentinfo = (req, res) => {
  const assignment_id = req.params.assignment_id;
  pool.query(queries.assignmentinfo, [assignment_id], (err, result) => {
    if (!err) {
      res.status(200).json(result.rows);
    } else {
      console.log(err);
    }
  });
};
const getmessages = (req, res) => {
  const class_subject_id = req.params.class_subject_id;
  pool.query(queries.getmessages, [class_subject_id], (err, messages) => {
    if (!err) {
      res.status(200).json(messages.rows);
    } else {
      console.log(err);
    }
  });
};
const getexamnames = async (req, res) => {
  try {
    const result = await pool.query(`select * from public.exams`);

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(501).json({ msg: "error" });
  }
};
const examdetails = async (req, res) => {
  const { student_id, exam_id } = req.body;
  try {
    const results = await pool.query(
      `select students.student_id,students.first_name,classes.class_id,classes.class_grade_id,
exam_id,subject,exam_date,exam_time,no_of_hours
from public.students join classes on classes.class_id=students.class_id 
join public.exam_schedule on exam_schedule.class_grade_id=classes.class_grade_id
where student_id=$1 and exam_id=$2`,
      [student_id, exam_id]
    );
    res.status(200).json(results.rows);
  } catch (err) {
    console.log(err);
    res.status(501).json({ msg: "error" });
  }
};

const getreport=async(req,res)=>{
    const { student_id, exam_id } = req.body;
  console.log(exam_id);
  try {
    const results = await pool.query(queries.getreport,
      [student_id, exam_id]
    );
    res.status(200).json(results.rows);
  } catch (err) {
    console.log(err);
    res.status(501).json({ msg: "error" });
  }

}

const ansupload = (assignment_id, student_id, downloadURL ) => {
  console.log(assignment_id);
  pool.query(
    ` insert into assignment_submissions 
      (assignment_id,student_id,photo_url,status) values($1,$2,$3,$4)`,
    [assignment_id, student_id, downloadURL, "Completed"],
    (err, resul) => {
      if (!err) {
        console.log("File successfully  uploaded.");
        // res.status(200).json({ message: "posted" });
      } else {
        // res.status(500).json({ message: "not posted" });

        console.log("File successfully not uploaded.");
      }
    }
  );
};
module.exports = {
  getstudent,
  login,
  signup,
  leave_request,
  getstudentclass,
  getclasssubjects,
  getclasstimetable,
  wholetimetable,
  getstudentattendance,
  dailyattendance,
  studentfee,
  studenttransactions,
  studentposts,
  getquizes,
  getquizquestions,
  submitanswers,
  resultpage,
  getassignments,
  assignmentinfo,
  getmessages,
  recentquiz,
  getexamnames,
  examdetails,
  getreport,
  ansupload,
}
