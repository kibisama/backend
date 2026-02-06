const amqplib = require("amqplib");
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";

let conn;
/** @type {amqplib.Channel} */
let ch;
const queues = {};
(async function () {
  conn = await amqplib.connect(RABBITMQ_URL);
  ch = await conn.createChannel();
})();

module.exports = async (queue, message) => {
  if (!queues[queue]) {
    await ch.assertQueue(queue, { durable: true });
    queues[queue] = true;
  }
  ch.sendToQueue(queue, Buffer.from(message), { persistent: true });
};
