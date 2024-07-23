const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
} = require("firebase/storage");
const multer = require("multer");
const Adminroutes = require("./src/students/adminroutes");
const Studentroutes = require("./src/students/routes");
const Teacherroutes = require("./src/students/Teacherroutes");
const setupMessaging = require("./messaging"); // Import the messaging setup function

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

var cors = require("cors");
app.use(cors());
app.use(express.json());

var admin = require("firebase-admin");
const { initializeApp } = require("firebase/app");
const { ansupload } = require("./src/students/controller");

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
const storage = getStorage();
const upload = multer({ storage: multer.memoryStorage() });

app.post("/upload", upload.single("filename"), async (req, res) => {
  console.log(req.body.assignment_id);
  try {
    const dateTime = giveCurrentDateTime();
    const storageRef = ref(
      storage,
      `files/${req.file.originalname + "       " + dateTime}`
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
    console.log(downloadURL)
   ansupload(req.body.assignment_id, req.body.student_id,downloadURL);
   res.json({msg:"success"});
  } catch (error) {
    
          console.log(error);
    return res.status(400).send(error.message);
  }
});

const giveCurrentDateTime = () => {
  const today = new Date();
  const date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  const time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  const dateTime = date + " " + time;
  return dateTime;
};

app.get("/geto", (req, res) => {
  res.json({ name: ["dsad"] });
  console.log("sds");
});

app.use("/api/student", Studentroutes);
app.use("/api/admin", Adminroutes);
app.use("/api/teacher", Teacherroutes);

// Setup Socket.IO messaging
setupMessaging(io);

server.listen(8001, () => {
  console.log("Server is running on port 8001");
});
