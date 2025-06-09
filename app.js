const fs = require("fs");
fs.mkdirSync("img/pharma-medium", { recursive: true });

const express = require("express");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const dotenv = require("dotenv");
dotenv.config();

const connect = require("./schemas");
const app = express();
app.set("port", process.env.PORT || 3001);
connect();

app.use(cors());
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const router = require("./routes");
app.use("/", router);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
  res.sendStatus(err.status || 500);
});

const server = app.listen(app.get("port"), () => {
  console.log("Listening on port", app.get("port"));
});
// require("./services/schedule")();

const io = require("./socket");
io(server, app);
