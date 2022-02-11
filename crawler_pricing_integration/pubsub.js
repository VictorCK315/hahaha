const config = require('./config.js');
const { PubSub } = require('@google-cloud/pubsub');

// Creates a client; cache this for further use
const pubSubClient = new PubSub();
const TOPICNAME_PRICE = config.pubsub.TOPICNAME_PRICE;
const TOPICNAME_STOCK = config.pubsub.TOPICNAME_STOCK;

async function publishMessage(topic, data) {
  //console.log(data);
  const dataBuffer = Buffer.from(data);
  if (topic == 'price') const topicName = TOPICNAME_PRICE;
  else const topicName = TOPICNAME_STOCK;

  try {
    const messageId = await pubSubClient.topic(topicName).publish(dataBuffer);
    //console.log(`Message ${messageId} published.`);
  } catch (error) {
    console.error(`Received error while publishing: ${error.message}`);
    process.exitCode = 1;
  }
}

exports.publishMessage = publishMessage;
