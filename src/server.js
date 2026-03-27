const express = require("express");
const app = express();

app.use(express.json());

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});


const errorHandler = require("./middlewares/error");
app.use(errorHandler);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});