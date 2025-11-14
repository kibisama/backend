const { createLogger, format, transports } = require("winston");

module.exports = createLogger({
  level: "error",
  format: format.printf(
    ({ timestamp, req_ip, message, stack }) =>
      `{
  timestamp: ${timestamp},${req_ip && `\n  req_ip: ${req_ip},`}
  message: ${stack || message}
}`
  ),
  transports: [new transports.File({ filename: "error.log", level: "error" })],
});
