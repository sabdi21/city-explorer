'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

// Application Setup
const PORT = process.env.PORT || 3000;
const app = express();
const client = new pg.Client(process.env.DATABASE_URL); 
client.connect();
client.on('error', err => console.error(err))

app.use(cors());

//Error handler
function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

//API Routes 
app.get('/weather', getWeatherFromSQL);
app.get('/events', getEvents);
app.get('/location', getLocationFromSQL);


//Constructor Functions
function Location(query, data) {
  this.search_query = query;
  this.formatted_query = data.formatted_address;
  this.latitude = data.geometry.location.lat;
  this.longitude = data.geometry.location.lng;
 }

 function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
 }

 function Event(event) {
  this.link = event.url;
  this.name = event.name.text;
  this.event_date = new Date(event.start.local).toString().slice(0, 15);
  this.summary = event.summary
}

//HELPER Function
function getLocationFromSQL(request, response) {
  const query = request.query.data;
  const SQL = `SELECT * FROM locations WHERE search_query='${query}';`;
  return client.query(SQL)
      .then(result => {
          if (result.rowCount > 0) {
              console.log('GETTING LOCATION FROM SQL');
              // let sqlLocation = new Location(query, result.rows[0]);
              response.send(result.rows[0]);
          } else {
              fetchLocationFromApi(query, response);
          }
      })
      .catch(error => handleError(error, response));
}

function fetchLocationFromApi(query, response) {
  const _URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;
  return superagent.get(_URL)
      .then(data => {
          console.log('GETTING LOCATION FROM API');
          if (!data.body.results.length) { throw 'No Data'; }
          else {
              const location = new Location(query, data.body.results[0]);
              const NEWSQL = `INSERT INTO locations (search_query,formatted_query,latitude,longitude) VALUES($1,$2,$3,$4);`;
              const newValues = Object.values(location);
              return client.query(NEWSQL, newValues)
                  .then(() => response.send(location))
          }
      });
}


function getWeatherFromSQL(request, response) {
  console.log(request.query.data.formatted_query)
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

function fetchWeatherFromApi(request, response) {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

  superagent.get(url)
    .then(apiResponse => {
        const dailyWeather = apiResponse.body.daily.data.map(day => new Weather(day));
          const SQL = `INSERT INTO weathers (forecast,time,location_id) 
                      VALUES ('${dailyWeather.forecast}','${dailyWeather.time}',${request.query.data.id});`;
          client.query(SQL);
          response.send(dailyWeather);

      })
      .catch(error => handleError(error));

}

function getEvents(request, response) {
  const url = `https://www.eventbriteapi.com/v3/events/search?token=${process.env.EVENTBRITE_API_KEY}&location.address=${request.query.data.formatted_query}`;

  superagent.get(url)
      .then(result => {
          const events = result.body.events.map(eventData => {
              const event = new Event(eventData);
              return event;
          });

          response.send(events);
      })
      .catch(error => handleError(error, response));
}

// STATIC METHOD: Fetch location from google
Location.lookupLocation = (handler) => {
  const SQL = `SELECT * FROM locations WHERE search_query=$1`;
  const values = [handler.query];

  return client.query( SQL, values )
    .then( results => {
      if( results.rowCount > 0 ) {
        handler.cacheHit(results);
      }
      else {
        handler.cacheMiss();
      }
    })
    .catch( console.error );
};


// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`App is up on ${PORT}`));

