const fs = require("fs");
fs.mkdirSync("img/pharma-medium", { recursive: true });

const express = require("express");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const dotenv = require("dotenv");
dotenv.config();

const isProductionMode = process.env.NODE_ENV === "production";
const connect = require("./schemas");
const app = express();
app.set("port", process.env.PORT || 3001);
connect();
app.use(cors({ origin: "*" }));
if (isProductionMode) {
  app.use(morgan("combined"));
  const helmet = require("helmet");
  const hpp = require("hpp");
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );
  app.use(hpp());
} else {
  app.use(morgan("dev"));
}
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false }));

const router = require("./routes");
app.use("/", router);

const timeEvent = require("./sse/time");
app.get("/time", timeEvent);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} A router does not exist.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = isProductionMode ? {} : err;
  res.sendStatus(err.status || 500);
});

const server = app.listen(app.get("port"), () => {
  console.log("Listening on port", app.get("port"));
});
require("./services/schedule")();

const io = require("./socket");
io(server, app);
