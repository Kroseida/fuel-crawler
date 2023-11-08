import axios from 'axios';
import {InfluxDB, Point, HttpError} from '@influxdata/influxdb-client'

const writeApi = new InfluxDB({url: process.env.INFLUX_URL, token: process.env.INFLUX_TOKEN}).getWriteApi(process.env.INFLUX_ORG, process.env.INFLUX_BUCKET, 'ms')
const interval = parseInt(process.env.INTERVAL) || 1000 * 60 * 5

if (!(process.env.RANDOM_INTERVAL === 'true' || process.env.RANDOM_INTERVAL === '1' || process.env.RANDOM_INTERVAL === 'yes')) {
  setInterval(loadInfluxData, interval);
} else {
  setInterval(loadInfluxData, Math.floor(Math.random() * interval));
}

loadInfluxData()
function loadInfluxData() {
  console.log('Fetching data')
  axios.get(`https://creativecommons.tankerkoenig.de/json/list.php?lat=${process.env.LATITUDE}&lng=${process.env.LONGITUDE}&rad=${process.env.RADIUS}&type=${process.env.TYPE || 'all'}&apikey=${process.env.API_KEY}`)
      .then(function (response) {
        response.data.stations.forEach((station) => {
          const point = new Point(process.env.MEASUREMENT_NAME || 'price')

          Object.entries(station).forEach(([key, value]) => {
            if (key === "diesel" || key === "e5" || key === "e10" || key === "isOpen") {
              return;
            }
            point.tag(key, value)
          });
          if (station.diesel) {
            point.floatField('diesel', station.diesel)
          }
          if (station.e5) {
            point.floatField('e5', station.e5)
          }
          if (station.e10) {
            point.floatField('e10', station.e10)
          }

          point.timestamp(new Date().getTime())
          console.log('Writing point..')
          writeApi.writePoint(point)
        });
        console.log('Waiting for next fetch..')
      })
      .catch(function (error) {
        console.log(error);
      })
}