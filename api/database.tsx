import postgres from 'postgres';
import path from 'path';
require('dotenv').config({path: ".env"});
require('dotenv').config({path: path.resolve(__dirname,"../..",".env.local")});
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const fs = require('fs');
const decompress = require("decompress");
const {default : fetch} = require('node-fetch');


const config :object= {
    host      : process.env.host,   // Postgres ip address[s] or domain name[s]
    port      : process.env.port,   // Postgres server port[s]
    database  : process.env.db,     // Name of database to connect to
    username  : process.env.user,   // Username of database user
    password  : process.env.pass,   // Password of database user
  }

const sql = postgres(config);

async function get_next_scheduled_trains(station_code : string, direction :number){
    var today = new Date();
    var time = today.getHours() + ":" + String(today.getMinutes()).padStart(2, '0') + ":" + String(today.getSeconds()).padStart(2,'0');
    var time2 = (today.getHours() + 1) + ":" + String(today.getMinutes()).padStart(2, '0') + ":" + String(today.getSeconds()).padStart(2,'0');
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    console.log(time)
    return await sql `
    select * from stop_times
    inner join trips on trips.trip_id = stop_times.trip_id
    inner join dates on trips.service_id = dates.service_id
    where arrival_time >= ${time} AND
    arrival_time <= ${time2} AND
    date = ${yyyy+mm+dd} AND 
    stop_id like ${'%' + station_code + '%'} AND
    direction_id = ${direction}
    order by arrival_time
    limit 10
    `
  }