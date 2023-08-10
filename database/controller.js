const SensorData = require("./model");

const saveToMongoDB = async (req, res) => {
  try {
    const payload = req.body;
    const sensorData = new SensorData(payload);
    const sensorDataSaveToMongoDB = sensorData.save();
    return res.json(sensorDataSaveToMongoDB);

  } catch (error) {
      console.error(`Error saving to MongoDB! ${err}`);
  };
};

const getSensorData = async (req, res) => {
  try {
    const payload = req.body;
    const latestDataMongo = await SensorData.findOne(payload).sort({ _id: -1 }).exec();
    const latestDataInflux = await influx.query('SELECT * FROM sensor ORDER BY time DESC LIMIT 1');
    res.json({
      mongodb: latestDataMongo,
      influxdb: latestDataInflux[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching sensor data' });
  }
};

module.exports = {
  saveToMongoDB,
  getSensorData,
}