const mongoose = require('mongoose');
const url = 'mongodb://127.0.0.1:27017/ravelware?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.8.0';

const database = async () => {
  try {
    await mongoose.connect(url, {
      useNewUrlParser: true, useUnifiedTopology: true
    });
    console.log("Mongodb Connect");
  } catch (error) {
    console.log(error.message);
  }
};

const db = database();

module.exports = db;