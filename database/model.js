const mongoose = require('mongoose');

const sensorDataSchema = mongoose.Schema({
  v: {
    type: [Number],
    require: true,
  },
  i:{
    type: [Number],
    require: true
  } ,
  kW: {
    type: String,
    require: true
  },
  KVAL: {
    type: String, 
    require: true
  },
  kWH: {
    type: String,
    require: true
  },
  pf: {
    type: String,
    require: true
  },
  vunbal: {
    type: Number,
    require: true
  },
  iunbal: {
    type: Number,
    require: true
  },
  time: {
    type: String,
    require: true
  }
});

const SensorData = mongoose.model('SensorData', sensorDataSchema);
module.exports = SensorData;