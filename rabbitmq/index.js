const amqplib = require("amqplib");
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const { handleSyncReq } = require("../services/delivery");

let conn;
/** @type {amqplib.Channel} */
let ch;
const queues = {};
(async function () {
  conn = await amqplib.connect(RABBITMQ_URL);
  ch = await conn.createChannel();
  await ch.prefetch(1);

  const queue_req_init_station_sync = "req_init_station_sync";
  await ch.assertQueue(queue_req_init_station_sync);
  ch.consume(queue_req_init_station_sync, async (msg) => {
    if (msg) {
      await handleSyncReq();
      ch.ack(msg);
    }
  });
})();

// Todo: Outbox

module.exports = async (queue, message) => {
  if (!queues[queue]) {
    await ch.assertQueue(queue, { durable: true });
    queues[queue] = true;
  }
  ch.sendToQueue(queue, Buffer.from(message), { persistent: true });
};
