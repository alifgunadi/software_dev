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
      measurement: 'sensor',
      fields: {
        v: Influx.FieldType.FLOAT,
        i: Influx.FieldType.FLOAT,
        kW: Influx.FieldType.STRING,
        kVA: Influx.FieldType.STRING,
        kWH: Influx.FieldType.STRING,
        pf: Influx.FieldType.STRING,
        vunbal: Influx.FieldType.FLOAT,
        iunbal: Influx.FieldType.FLOAT,
      },
      tags: ['status']
    }
  ]
});

function saveDataToInfluxDB(topic, payload) {
  // const { v, i, kW, kVA, kWH, pf, vinabal, iunbal } = JSON.stringify(payload);
  if (payload.v && payload.v[0] && payload.i && payload.i[0]) {
    influx.writePoints([{
          measurement: 'sensor',
          // fields: { v, i, kW, kVA, kWH, pf, vinabal, iunbal },
          // fields: { kWh: (energy, power, ampere, voltage) },
          tags: { status: topic.status },
          fields: {
            v: payload.v[0],
            i: payload.i[0],
            kW: payload.kW,
            kVA: payload.kVA,
            kWH: payload.kWH,
            pf: payload.pf,
            vunbal: payload.vunbal,
            iunbal: payload.iunbal,
          },
        },
      ])
      .then(() => console.log('Data tersimpan di InfluxDB'))
      .catch((error) => console.log('Error menyimpan data:', error));
    } else {
      console.log(`${payload}: \n Payload tidak lengkap untuk penyimapan data: \n`, payload);
    }
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
      client.subscribe("presence", (error) => {
        if (!error) {
          client.publish("presence", topic)
        }
      });
      console.log(`Subscribed to: ${topic}`);
    }
  }
});

client.on('message', (topic, payload) => {
  console.log('MQTT Recieved Topic:', payload.toString());
  saveDataToInfluxDB(topic, payload);
  client.end();
});

client.on('error', (error) => {
  console.log('MQTT Koneksi error:', message = error);
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

app.get('/api/get_sensor_data', async (req, res) => {
  try {
    const query = 'SELECT * FROM sensor ORDER BY time DESC LIMIT 1';
    const result = await influx.query(query);
    const latestData = result[0];
    res.json(latestData);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching sensor data' });
  }
});

//InfluxDB set-up
// const {InfluxDB, Point} = require('@influxdata/influxdb-client');

// const token = process.env.INFLUXDB_TOKEN;
// const url = 'http://localhost:8086';

// const influxDB = new InfluxDB({ url, token });

// const org = process.env.ORG;
// const bucket = process.env.BUCKET;

// const writeClient = influxDB.getWriteApi(org, bucket)

// const point1 = new Point('watt')
//   .tag('data', 'v')
//   .floatField('value', 224.7);
//   console.log(point1);

// const point2 = new Point('watt')
//   .tag('data', 'v')
//   .floatField('value',  224.7);
//   console.log(point2);

// const point3 = new Point('watt')
//   .tag('data', 'v')
//   .floatField('value', 0);
//   console.log(point3);

// const point4 = new Point('watt')
//   .tag('data', 'v')
//   .floatField('value', 149.8);
//   console.log(point4);

// const point5 = new Point('watt')
//   .tag('data', 'i')
//   .floatField('value', 0);
//   console.log(point5);

// const point6 = new Point('watt')
//   .tag('data', 'i')
//   .floatField('value', 0.2);
//   console.log(point6);

// const point7 = new Point('watt')
//   .tag('data', 'i')
//   .floatField('value', 0.02);
//   console.log(point7);

// const point8 = new Point('watt')
//   .tag('data', 'i')
//   .floatField('value', 0.7);
//   console.log(point8);


// const queryApi = new InfluxDB({url, token}).getQueryApi(org);

// const fluxQuery = 'from(bucket:"Weist") |> range(start: -1) |> filter(fn: (r) => r._measurement == "watt")';

// const myQuery = async () => {
//   for await (const {values, tableMeta} of queryApi.iterateRows(fluxQuery)) {
//     const o = tableMeta.toObject(values)
//     console.log(
//       `${o._time} ${o._measurement} in: ${o._field}=${o._value}`
//     )
//   }
// };

// myQuery();

// writeClient.writePoint(point1, point2);
// writeClient.close().then(() => {
//   console.log('Write finished');
// });