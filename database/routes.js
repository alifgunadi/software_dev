const router = require('express').Router();
const influxControlle= require('./controller');

router.get('/get_sensor', influxControlle.saveToMongoDB);
router.get('/get_sensor_data', influxControlle.getSensorData);

module.exports = router;