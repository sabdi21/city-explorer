'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

// Application Setup
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());

// API Routes
app.get('/location', searchToLatLong);

app.get('/weather', getWeather);

//error handler
function handleError(err, res) {
   console.error(err);
   if (res) res.status(500).send('Sorry, something went wrong');
}

// Helper Functions

function searchToLatLong(request, response){
    const locationName = request.query.data;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
//    const locationName = request.query.data;

   superagent.get(url).then(res => {
       const location = new Location(locationName, res.body)
       response.send(location)

   }).catch(error => {
       console.error(error);
       response.status(500).send('Status: 500. So sorry, something went wrong.');
   });
}

function searchToLatLongOld(query) {
 const geoData = require('./data/geo.json');
 const location = new Location(query, geoData);
 return location;
}

function Location(query, res) {
 this.search_query = query;
 this.formatted_query = res.results[0].formatted_address;
 this.latitude = res.results[0].geometry.location.lat;
 this.longitude = res.results[0].geometry.location.lng;
}

function getWeather(request, response) {
   const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

   return superagent.get(url)
     .then(result => {
       const weatherSummaries = result.body.daily.data.map(day => {
         return new Weather(day);
       });

       response.send(weatherSummaries);
     })
     .catch(error => handleError(error, response));
}

function Weather(day) {
 this.forecast = day.summary;
 this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`App is up on ${PORT}`));
