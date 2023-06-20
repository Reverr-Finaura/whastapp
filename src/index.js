require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const admin = require("./config/firebase");
const whatsappRoute = require("./routes/whatsapp");
const ErrorMiddleware = require("./middlewares/errorMiddleware");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const PORT = process.env.PORT || 8080;

app.get("", (req, res) => {
  res.send("Welcome to reverr Whatsapp Service");
});

app.use("/api", whatsappRoute);
app.use(ErrorMiddleware);

app.listen(3000, () => {
  console.log(`Server is running http://localhost:${PORT}`);
});
