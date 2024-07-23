const { Router } = require("express");
const controller = require("./controller");
const admincontroller = require("./admincontroller");
const adminrouter = Router();

const multer = require("multer");

const webupload = multer({ storage: multer.memoryStorage() });

adminrouter.get("/info", controller.getstudent);

adminrouter.get("/studentfeelist", admincontroller.allstudentsfee);
adminrouter.get("/studentlist", admincontroller.allstudents);

adminrouter.get("/studentattend/:classId", admincontroller.studentattend);
adminrouter.post("/login", controller.login);
adminrouter.post("/signup", controller.signup);
adminrouter.get("/getteachers", admincontroller.getteachers);

adminrouter.get(
  "/getteachattenddetails/:teacherId",
  admincontroller.getteachattenddetails
);

adminrouter.get("/getallclasses", admincontroller.getallclasses);

adminrouter.get("/teacherAttend/:teacherId", admincontroller.teacherAttend);
adminrouter.post("/examdetails", admincontroller.examdetails);
adminrouter.post("/teachersalary", admincontroller.teachersalary_details);
adminrouter.post("/postnotifications", admincontroller.postnotifications);
adminrouter.post("/editleave", admincontroller.editleave);
adminrouter.get("/studentfee/:studentid", admincontroller.getstudentfee);
adminrouter.post(
  "/upload",
  webupload.single("filename"),
  admincontroller.upload
);
adminrouter.post("/studentpayment/", admincontroller.studentpayment);
adminrouter.post("/addstudent", admincontroller.leavecheck);
adminrouter.get("/leaves", admincontroller.leavecheck);
adminrouter.delete("/deleteExam/:id", admincontroller.deleteExam);
adminrouter.put("/updateexamdetails", admincontroller.updateexamdetails);
adminrouter.get("/getexamschedule", admincontroller.getexamschedule);
module.exports = adminrouter;
