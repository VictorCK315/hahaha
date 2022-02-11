const config = require('./config.js');
const pubsub = require('./pubsub.js');
config.disconnect_handler();

//Convert timestamp to yyyy-mm-dd hh:mm:ss
function timeConvert(timestamp) {
  const date = new Date(timestamp);
  const month = ("0" + (date.getMonth() + 1)).slice(-2);
  const day = ("0" + (date.getDate())).slice(-2);
  const hour = ("0" + (date.getHours())).slice(-2);
  const minute = ("0" + (date.getMinutes())).slice(-2);
  const second = ("0" + (date.getSeconds())).slice(-2);
  const convert = date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
  return convert;
}

//Get data for last check time
async function getOneData() {
  return new Promise((reslove, reject) => {
    config.conn.query("SELECT sku_id, udt, lowest_price, qty FROM du.skus ORDER BY udt DESC LIMIT 1", async function (err, result, fields) {
      if (err)
        reject(err);
      else
        reslove(result);
    })
  })
}

//Get data by last check time
async function getByLastCheckTime(updateTime) {
  return new Promise((reslove, reject) => {
    config.conn.query(`SELECT sku_id, udt, lowest_price, qty, kc_sku FROM du.skus WHERE udt > '${updateTime}' ORDER BY udt DESC`, async function (err, result, fidlds) {
      if (err)
        reject(err);
      else
        reslove(result);
    })
  })
}

let lastCheckTime, start = true;
let frequency = 0;
const interval = 60 / 60 * 60 * 1000;
//non stop looping
setInterval(async function () {
  console.log('=== ' + frequency + ' ===');
  frequency += 1;
  //Init the first last check time
  if (start) {
    const oneData = await getOneData();
    lastCheckTime = oneData[0].udt;
    start = false;
  } else {
    //Main looping
    const lastCheckTimeConverted = timeConvert(Date.parse(lastCheckTime));
    console.log(lastCheckTimeConverted);

    //Get the data between the last check time and now
    const newUpdate = await getByLastCheckTime(lastCheckTimeConverted);
    //Update the last check time
    if (newUpdate[0]) {
      lastCheckTime = newUpdate[0].udt;
      for (let row of newUpdate) {
        if (row.kc_sku) {
          const priceData = JSON.stringify({
            sku: row.kc_sku,
            source: 'du',
            price: row.lowest_price
          });
          await pubsub.publishMessage('price', priceData);
          const stockData = JSON.stringify({
            qty: row.qty
          });
          await pubsub.publishMessage('stock', stockData);
        }
      }
      console.log('The length is ' + newUpdate.length)
    }
  }
}, interval);
