const pool = require("./database");
// messaging.js
const setupMessaging = (io) => {
  io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("sendMessage", async (messageData) => {
      try {
        // Save message to the database
        const query =
          "INSERT INTO chatmessages (sender_Id,sender_role, receiver_Id, receiver_role,content, timestamp) VALUES ($1, $2, $3, $4,$5,$6) RETURNING *";
        const values = [
          messageData.senderId,
          messageData.senderRole,
          messageData.receiverId,
          messageData.receiverRole,
          messageData.content,
          new Date(),
        ];
        const res = await pool.query(query, values);

        // Emit the saved message to all clients
        io.to(message.receiverId).emit("receiveMessage", res.rows[0]);
      } catch (err) {
        console.error("Error saving message to database:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
};

module.exports = setupMessaging;
