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
app.get('/events', getEvents);

//error handler
function handleError(err, res) {
   console.error(err);
   if (res) res.status(500).send('Sorry, something went wrong');
}

// Helper Functions
function searchToLatLong(request, response){
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
    const locationQuery = request.query.data;

    superagent.get(url).
    then(apiResoponse => {
       const location = new Location(locationQuery, apiResoponse.body)
       response.send(location)
    })
   .catch(error => handlError(error, response));
}

function Location(locationQuery, locationInfo) {
 this.search_query = locationQuery;
 this.formatted_query = locationInfo.results[0].formatted_address;
 this.latitude = locationInfo.results[0].geometry.location.lat;
 this.longitude = locationInfo.results[0].geometry.location.lng;
}

function getWeather(request, response) {
   const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

   return superagent.get(url)
     .then(apiResponse => {
       const weatherSummaries = apiResponse.body.daily.data.map(day => {
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

function getEvents(request, response) {
    const url = `https://www.eventbriteapi.com/v3/events/search?token=${process.env.EVENTBRITE_API_KEY}&location.address=${request.query.data.formatted_query}`;

    return superagent.get(url)
    .then(result => {
        const events = result.body.events.map(eventData => {
            const event = new Event(eventData);
            return event;
        });
        response.send(events);
    })
    .catch(error => handleError(error, response));
}

function Event(eventData) {
 
    this.link = eventData.ticket_classes.resource_url;
    this.name = eventData.ticket_classes.name;
    this.event_date = eventData.something;
    this.summary = eventData.summary
}


// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`App is up on ${PORT}`));
