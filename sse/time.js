const dayjs = require("dayjs");

module.exports = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  //   sendEvent({ message: "Connected to SSE" });
  const intervalId = setInterval(() => {
    sendEvent({ message: dayjs().format("dddd, M/DD/YYYY hh:mm A") });
  }, 1000);
  req.on("close", () => {
    clearInterval(intervalId);
  });
};
