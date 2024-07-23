const pool = require("../../database");
const argon2 = require("argon2");
const queries = require("./queries");
const path = require("path");
const moment = require("moment-timezone");

const {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
} = require("firebase/storage");
const admin = require("firebase-admin");
const { initializeApp } = require("firebase/app");

const firebaseConfig = {
  apiKey: "AIzaSyBVJA1bSXJYSdin8Qr9nkGvffSEKV_1yj0",
  authDomain: "socialdev-2165b.firebaseapp.com",
  projectId: "socialdev-2165b",
  storageBucket: "socialdev-2165b.appspot.com",
  messagingSenderId: "948983541977",
  appId: "1:948983541977:web:1d8ecdce4747590fd08ec8",
  measurementId: "G-L3E9Y810V1",
};
// Initialize Firebase
initializeApp(firebaseConfig);
const firestorage = getStorage();

const leavecheck = (req, res) => {
  pool.query(queries.pendleaves, (err, resul) => {
    if (!err) {
      res.status(200).json(resul.rows);
    } else {
      console.log(err);
    }
  });
};

const getstudentfee = (req, res) => {
  const studentid = req.params.studentid;

  pool.query(queries.checkroll, [studentid], (err, resu) => {
    if (!err) {
      console.log("found user", resu.rows);
      pool.query(queries.feedetails, [studentid], (error, result) => {
        if (!error) {
          console.log(result.rows);
          res.status(200).json({ user: resu.rows, fee: result.rows });
        }
      });
    } else {
      console.log(err);
    }
  });
};
const allstudents = (req, res) => {
  pool.query(queries.allstudents, (err, resu) => {
    if (!err) {
      console.log("found", resu.rows);
      res.status(200).json(resu.rows);
    } else {
      console.log(err);
    }
  });
};
const studentpayment = (req, res) => {
  console.log(req.body);
  pool.query(
    queries.feepayment,
    [req.body.student_id, req.body.amount, "cash"],
    (err, resul) => {
      if (!err) {
        console.log("Sfsfsfs");
      } else {
        console.log(err);
      }
    }
  );
  pool.query(queries.statusupdate, [req.body.student_id], (err, reso) => {
    if (!err) {
      console.log("status update");
      res.status(200).json({ job: "done" });
    } else {
      console.log(err);
    }
  });
};

const editleave = (req, res) => {
  const { status, adminComment, requestId } = req.body;
  pool.query(
    queries.editleaves,
    [status, adminComment, requestId],
    (err, resul) => {
      if (!err) {
        res.status(201).send(status);
      } else {
        console.log(err);
      }
    }
  );
};

const calculateUnpaidLeaveDeductions = async (teacherId, month, year) => {
  const totalWorkingDays = 22;

  try {
    // Get the basic salary for the teacher
    const salaryRes = await pool.query(
      "SELECT basic_salary FROM public.salaries WHERE teacher_id = $1",
      [teacherId]
    );
    if (salaryRes.rows.length === 0) {
      throw new Error(`Teacher with id ${teacherId} not found`);
    }
    const basicSalary = salaryRes.rows[0].basic_salary;
    const dailySalary = basicSalary / totalWorkingDays;

    // Get the number of unpaid leaves for the specified month and year
    const leaveRes = await pool.query(
      `
      SELECT COUNT(*) AS unpaid_leaves
      FROM public.leaves
      WHERE teacher_id = $1 AND EXTRACT(MONTH FROM leave_date) = $2 AND EXTRACT(YEAR FROM leave_date) = $3 AND is_paid = FALSE
    `,
      [teacherId, month, year]
    );
    console.log(leaveRes);
    const unpaidLeaves = parseInt(leaveRes.rows[0].unpaid_leaves, 10);
    const unpaidLeaveDeductions = unpaidLeaves * dailySalary;

    return unpaidLeaveDeductions;
  } catch (err) {
    console.error("Error calculating unpaid leave deductions:", err);
    throw err;
  }
};

const insertSalaryWithDeductions = async (teacherId, month, year) => {
  console.log(teacherId);
  try {
    const salaryDetailsRes = await pool.query(
      `
      SELECT basic_salary, allowances, income_tax, retirement_contribution, health_insurance, other_deductions
      FROM public.salaries
      WHERE teacher_id = $1
      ORDER BY payment_date DESC
      LIMIT 1;
    `,
      [teacherId]
    );

    if (salaryDetailsRes.rows.length === 0) {
      throw new Error(
        `Salary details for teacher with id ${teacherId} not found`
      );
    }

    const {
      basic_salary,
      allowances,
      income_tax,
      retirement_contribution,
      health_insurance,
      other_deductions,
    } = salaryDetailsRes.rows[0];
    const unpaidLeaveDeductions = await calculateUnpaidLeaveDeductions(
      teacherId,
      month,
      year
    );

    const res = await pool.query(
      `
      INSERT INTO salaries (teacher_id, basic_salary, allowances, income_tax, retirement_contribution, health_insurance, other_deductions, unpaid_leave_deductions)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `,
      [
        teacherId,
        basic_salary,
        allowances,
        income_tax,
        retirement_contribution,
        health_insurance,
        other_deductions,
        unpaidLeaveDeductions,
      ]
    );
    const update = await pool.query(
      `update teachers set current_salary_id=${res.rows[0].salary_id} 
      where teacher_id=${teacherId}`
    );
    return res.rows;
  } catch (err) {
    console.error("Error inserting salary data:", err);
    throw err;
  }
};

const teachersalary_details = async (req, res) => {
  const { teacherId, month, year } = req.body;
  console.log(req.body);

  try {
    const details = await insertSalaryWithDeductions(teacherId, month, year);
    console.log(details);
    res.status(200).json(details);
  } catch (err) {
    res.status(500).json({
      error: "An error occurred while calculating and updating salary.",
    });
  }
};

const examdetails = async (req, res) => {
  const {
    exam_id,
    subject,
    class_grade_id,
    exam_date,
    exam_time,
    no_of_hours,
    total_marks,
  } = req.body;
  console.log(req.body);
  await pool.query(
    `
   INSERT INTO exam_schedule (exam_id, subject, class_grade_id, exam_date, exam_time, no_of_hours,total_marks)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
    `,
    [
      exam_id,
      subject,
      class_grade_id,
      exam_date,
      exam_time,
      no_of_hours,
      total_marks,
    ]
  );
  res
    .status(200)
    .json({ message: "Salary calculated and updated successfully." });
};

const addstudent = (req, res) => {
  const {
    student_id,
    first_name,
    last_name,
    email,
    phone,
    address,
    class_id,
    password,
  } = req.body;
};
const postnotifications = (req, res) => {};

const giveCurrentDateTime = () => {
  const now = new Date();
  return now.toISOString();
};
const upload = async (req, res) => {
  try {
    const dateTime = giveCurrentDateTime();
    const storageRef = ref(
      firestorage,
      `files/${req.file.originalname + "-" + dateTime}`
    );
    const metadata = {
      contentType: req.file.mimetype,
    };
    const snapshot = await uploadBytesResumable(
      storageRef,
      req.file.buffer,
      metadata
    );
    const downloadURL = await getDownloadURL(snapshot.ref);

    pool.query(
      ` insert into posts (title,content,role,image_url) values($1,$2,$3,$4)`,
      [req.body.Title, req.body.Body, req.body.Recipient, downloadURL],
      (err, resul) => {
        if (!err) {
          console.log("File successfully  uploaded.");
          res.status(200).json({ message: "posted" });
        } else {
          res.status(500).json({ message: "not posted" });

          console.log("File successfully not uploaded.");
        }
      }
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(400).send(error.message);
  }
};
const getexamschedule = async (req, res) => {
  pool.query(
    `select * from public.exam_schedule join public.exams on exam_schedule.exam_id=exams.exam_id`,
    (err, result) => {
      if (!err) {
        res.status(200).json(result.rows);
      } else {
        console.log(err);
        res.status(501).json({ msg: "not" });
      }
    }
  );
};
const updateexamdetails = async (req, res) => {
  const datt = "2024-06-15"; // Example date

  // Convert UTC date to Asia/Calcutta timezone and format as YYYY-MM-DD

  const { row } = req.body;
  const {
    exam_id,
    subject,
    class_grade_id,
    exam_date,
    exam_time,
    no_of_hours,
  } = req.body;
  const serverTimeZoneDate = moment
    .utc(exam_date)
    .tz("Asia/Calcutta")
    .format("YYYY-MM-DD");

  try {
    await pool.query(
      "UPDATE public.exam_schedule SET exam_id = $1, subject = $2, class_grade_id = $3, exam_date = $4, exam_time = $5, no_of_hours = $6 WHERE id = $7",
      [
        exam_id,
        subject,
        class_grade_id,
        serverTimeZoneDate,
        exam_time,
        no_of_hours,
        row,
      ]
    );

    res.status(200).json({ message: "updated" });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};
const deleteExam = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`delete from public.exam_schedule where id=${id}`);
    res.status(200).json({ msg: "deleted" });
  } catch (err) {
    console.log(err);
    res.status(501).json({ msg: "not deleted" });
  }
};
const allstudentsfee = async (req, res) => {
  try {
    const result =
      await pool.query(`select students.student_id,students.first_name,students.last_name, 
fee.amount,fee.payment_status,fee.due_date from public.students
join public.fee on students.student_id=fee.student_id`);
    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
  }
};
const getteachers = async (req, res) => {
  try {
    const result = await pool.query(
      `select teacher_id,teacher_name,email from public.teachers `
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
  }
};
const teacherAttend=async(req,res)=>{
  const {teacherId}=req.params


  try {
    const result = await pool.query(
      `select * from public.teachers_attendance where teacher_id=$1`,
      [teacherId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
  }



}

const getallclasses=async(req,res)=>{
try {
  const result = await pool.query(
    `select class_id,class_name,teacher_id,classes.class_grade_id,class_grade from public.classes
	join public.class_grades on class_grades.class_grade_id=classes.class_grade_id`,
  );
  console.log(result.rows);
  res.status(200).json(result.rows);
} catch (err) {
  console.log(err);
}
}

const studentattend=async(req,res)=>{
  const {classId}=req.params
  
  try {
    const result = await pool.query(
      `select attendance.student_id,attendance_date,status,class_id,first_name,last_name,student_roll,gender from public.attendance 
      join public.students on students.student_id=attendance.student_id
       where class_id=$1`,
      [classId]
    );
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
  }

}
const getteachattenddetails=async(req,res)=>{
    const {teacherId}=req.params
  
  try {
    const result = await pool.query(
      `select attendance.student_id,attendance_date,status,class_id,first_name,last_name,student_roll,gender from public.attendance 
      join public.students on students.student_id=attendance.student_id
       where class_id=$1`,
      [teacherId]
    );
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
  }

}

module.exports = {
  leavecheck,
  editleave,
  addstudent,
  getstudentfee,
  studentpayment,
  allstudents,
  postnotifications,
  teachersalary_details,
  upload,
  examdetails,
  getexamschedule,
  updateexamdetails,
  deleteExam,
  allstudentsfee,
  getteachers,
  teacherAttend,
  studentattend,
  getallclasses,
  getteachattenddetails,
};
