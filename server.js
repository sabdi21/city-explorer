'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');

//NOTES====this goes through the node modules and using it's sub dependencies. It regulates what other sites uses or is exposes to it when it comes to this server.
const cors = require('cors');

// Application Setup //NOTES this sets up environment variables
const PORT = process.env.PORT || 3000;
const app = express();
//NOTES==when an app gets a request, it checks with cors which looks over it than lets it pass to the API route
app.use(cors());

// API Routes

app.get('/location', (request, response) => {
  try {
    const locationData = searchToLatLong(request.query.data);
    response.send(locationData);
  }
  catch(error) {
    console.error(error);
    response.status(500).send('Status: 500. So sorry, something went wrong.');
  }
});

app.get('/weather', (request, response) => {
  try {
    const weatherData = getWeather();
    response.send(weatherData);
  }
  catch(error) {
    console.error(error);
    response.status(500).send('Status: 500. So sorry, something went wrong.');
  }
});

// Helper Functions

function searchToLatLong(query) {
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

function getWeather() {
  const darkskyData = require('./data/darksky.json');
//==teachings by jb
    const days = darkskyData.daily.data;  
    const weatherSummaries = days.map((day) => {
    return new Weather (day); //this will give us a new array of the weather instances//
  })

//   const weatherSummaries = [];

//   darkskyData.daily.data.forEach(day => {
//     weatherSummaries.push(new Weather(day));
//   });

  return weatherSummaries;
}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`App is up on ${PORT}`));
//NOTES== app is told to listen on this port and tells it to run the console.log function with the message displayed on the browser