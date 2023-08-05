require('dotenv').config();
const express = require('express');
const app = express();
const mqtt = require('mqtt');
const Influx = require('influx');
const bodyParser = require('body-parser');
const cors = require('cors');
const port = 5000; 

app.listen(port, () => {
  console.log(`Server at: http://localhost:${port}`);
});

app.use(bodyParser.json());
app.use(cors());

const influx = new Influx.InfluxDB({
  port: process.env.INFLUXDB_PORT,
  database: process.env.BUCKET, 
  schema: [
    {
      measurement: 'measurement',
      fields: {
        kWh: Influx.FieldType.FLOAT,
        power: Influx.FieldType.FLOAT,
        ampere: Influx.FieldType.FLOAT,
        voltage: Influx.FieldType.FLOAT,
      },
      tags: ['panel', 'floor'],
    },
  ],
});

function saveDataToInfluxDB(topic, payload) {
  const { panel, floor, energy, power, ampere, voltage } = JSON.parse(payload);

  influx
    .writePoints([
      {
        measurement: 'measurement',
        fields: { kWh: (energy, power, ampere, voltage) },
        tags: { panel, floor },
      },
    ])
    .then(() => console.log('Data tersimpan di InfluxDB'))
    .catch((error) => console.log('Error menyimpan data:', error));
};

//MQTT Service
const mqttHost = process.env.MQTT_HOST;
const mqttProtocol = 'mqtts';
const mqttPort = process.env.MQTT_PORT;
const mqttUsername = process.env.MQTT_USERNAME;
const mqttPassword = process.env.MQTT_PASSWORD;

const options = {
  host: mqttHost,
  protocol: mqttProtocol,
  port: mqttPort,
  username: mqttUsername,
  password: mqttPassword,
  clientId: 'ravelware-mqtt-client',
};

const client = mqtt.connect(options);
const topics = {
  PANEL_LANTAI_1: 'DATA/PM/PANEL_LANTAI_1',
  PANEL_LANTAI_2: 'DATA/PM/PANEL_LANTAI_2',
  PANEL_LANTAI_3: 'DATA/PM/PANEL_LANTAI_3',
};

client.on('connect', () => {
  console.log('MQTT Connected');
  for (const key in topics) {
    if (topics.hasOwnProperty(key)) {
      const topic = topics[key];
      client.subscribe(topic);
      console.log(`Subscribed to: ${topic}`);
    }
  }
});

client.on('connect', () => {
  console.log('MQTT Connected');
  for (const key in topics) {
    if (topics.hasOwnProperty(key)) {
      const topic = topics[key];
      client.subscribe(topic);
      console.log(`Published to: ${topic}`);
    }
  }
});

client.on('message', (topic, payload) => {
  console.log('MQTT Recieved Topic:', topic.toString());
  saveDataToInfluxDB(topic, payload);
});

client.on('error', (error) => {
  console.log('Koneksi error MQTT:', error);
});

app.get('/', (req, res) => {
  try {
    res.json({
      status: 'OKE',
      message: 'Energy Monitoring',
    })
  } catch (error) {
    console.log(error.message);
  }
});

app.get('/api/realtime', (req, res) => {
  influx
    .query('SELECT * FROM energy GROUP BY panel ORDER BY time DESC LIMIT 1')
    .then((results) => {
      const data = results.map((result) => result.toJSON());
      res.json(data);
      console.log(data);
    })
    .catch((error) => {
      res.status(500).json({ status: 'Gagal mengambil data realtime', message: error });
      console.log(error.message);
    });
});

app.get('/api/today-usage', (req, res) => {
  influx
    .query(
      'SELECT * FROM energy GROUP BY panel ORDER BY time DESC LIMIT 1 OFFSET 1'
    )
    .then((results) => {
      const energyNow = results[0].kWh;
      const energyMidnight = results[1].kWh;
      const todayUsage = energyNow - energyMidnight;
      const costPerKWh = 1500;
      const todayCost = todayUsage * costPerKWh;

      res.json({ todayUsage, todayCost });
    })
    .catch((error) => {
      res.status(500).json({ status: 'Gagal menghitung today\'s usage', message: error });
    });
});

app.get('/api/total-usage-2023', (req, res) => {
  influx
    .query(
      'SELECT SUM(kWh) AS total_kWh, SUM(kWh) * 1500 AS total_cost FROM energy WHERE time >= \'2023-01-01\' AND time < \'2024-01-01\' GROUP BY time(1M)'
    )
    .then((results) => {
      res.json(results);
    })
    .catch((error) => {
      res.status(500).json({ status: 'Gagal mengambil data total usage 2023', message: error });
    });
});

//InfluxDB set-up
const {InfluxDB, Point} = require('@influxdata/influxdb-client');

const token = process.env.INFLUXDB_TOKEN;
const url = 'http://localhost:8086';

const influxDB = new InfluxDB({ url, token });

const org = process.env.ORG;
const bucket = process.env.BUCKET;

const writeClient = influxDB.getWriteApi(org, bucket)

const point1 = new Point('watt')
  .tag('data', 'v')
  .floatField('value', 224.7);
  console.log(point1);

const point2 = new Point('watt')
  .tag('data', 'v')
  .floatField('value',  224.7);
  console.log(point2);

const point3 = new Point('watt')
  .tag('data', 'v')
  .floatField('value', 0);
  console.log(point3);

const point4 = new Point('watt')
  .tag('data', 'v')
  .floatField('value', 149.8);
  console.log(point4);

const point5 = new Point('watt')
  .tag('data', 'i')
  .floatField('value', 0);
  console.log(point5);

const point6 = new Point('watt')
  .tag('data', 'i')
  .floatField('value', 0.2);
  console.log(point6);

const point7 = new Point('watt')
  .tag('data', 'i')
  .floatField('value', 0.02);
  console.log(point7);

const point8 = new Point('watt')
  .tag('data', 'i')
  .floatField('value', 0.7);
  console.log(point8);


const queryApi = new InfluxDB({url, token}).getQueryApi(org);

const fluxQuery = 'from(bucket:"Weist") |> range(start: -1) |> filter(fn: (r) => r._measurement == "watt")';

const myQuery = async () => {
  for await (const {values, tableMeta} of queryApi.iterateRows(fluxQuery)) {
    const o = tableMeta.toObject(values)
    console.log(
      `${o._time} ${o._measurement} in: ${o._field}=${o._value}`
    )
  }
};

myQuery();

writeClient.writePoint(point1, point2);
writeClient.close().then(() => {
  console.log('Write finished');
});