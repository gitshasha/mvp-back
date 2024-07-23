const { Router } = require("express");
const teachercontroller = require("./teachercontroller");
const Teacherrouter = Router();

Teacherrouter.post("/addquiz", teachercontroller.Addquiz);

Teacherrouter.post("/messageclass", teachercontroller.messageclass);

Teacherrouter.post("/posthomework", teachercontroller.posthomework);
Teacherrouter.get("/getsalaryreport/:teacherId", teachercontroller.getsalrepo);
Teacherrouter.get(
  "/getattendance/:teacherId",
  teachercontroller.attendancestudents
)
Teacherrouter.post(
  "/getteacherassignments",
  teachercontroller.getteacherassignments
);
Teacherrouter.post("/homesubmission", teachercontroller.homesubmission);
Teacherrouter.get("/getallstudents/:classId", teachercontroller.classStudents);
Teacherrouter.get(
  "/attendancerecords/:classId",
  teachercontroller.attendancerecords
);


Teacherrouter.put("/editattendance", teachercontroller.editattendance);
Teacherrouter.post("/checktoday", teachercontroller.checktoday);
Teacherrouter.post("/attendancebydate", teachercontroller.attendancebydate);
Teacherrouter.get("/classteacher/:teacherId", teachercontroller.classteacher);

Teacherrouter.get(
  "/teacherclasses/:teacherId",
  teachercontroller.teacherclasses
);
Teacherrouter.get("/teacherposts", teachercontroller.teacherposts);
Teacherrouter.get(
  "/teacherschedule/:teacherId",
  teachercontroller.teacherschedule
);
Teacherrouter.post("/getteacherclasses", teachercontroller.getclasses);
Teacherrouter.post("/teacherlogin", teachercontroller.Teacherlogin);

Teacherrouter.post("/Studentmarks", teachercontroller.Studentmarks);
Teacherrouter.post("/teacherattend", teachercontroller.teacherattend);
module.exports = Teacherrouter;
