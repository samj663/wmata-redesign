const postgres = require('postgres')
const path = require('path');
require('dotenv').config({path: ".env"});
require('dotenv').config({path: path.resolve(__dirname,"../..",".env.local")});
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const fs = require('fs');
const decompress = require("decompress");
const {default : fetch} = require('node-fetch');


const render_config :object= {
  host      : process.env.render_host,   // Postgres ip address[s] or domain name[s]
  port      : process.env.render_port,   // Postgres server port[s]
  database  : process.env.render_db,     // Name of database to connect to
  username  : process.env.render_user,   // Username of database user
  password  : process.env.render_pass,   // Password of database user
  ssl       : true
}

export const sql = postgres(render_config);
//console.log(sql)
/*
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
*/
async function get_train_position_destinations(trains:any){
  let temp = trains.map((x:any) => {return x.vehicle.trip.tripId});
  return temp
}
export async function get_next_bus(stop_id: string){
  let start_time = new Date()
  let startTimestamp = start_time.getTime()
  let timeExtent = 45 * 60 * 1000
  let end_time = new Date(startTimestamp + timeExtent)
 // console.log(sql)
  return await sql`
    SELECT * FROM bus_stop_times where
    stop_code = ${stop_id} and
    departure_time > ${start_time.toLocaleTimeString('it-IT').toString()} and
    departure_time < ${end_time.toLocaleTimeString('it-IT').toString()}
    ORDER BY departure_time`;
}
/*
Result(2) [
  {
    route_id: '52',
    service_id: 6,
    trip_id: '19292020',
    headsign_direction: 'NORTH to 14TH & COLORADO',
    departure_time: '18:46:32',
    stop_id: '21974',
    stop_code: '1003906',
    stop_sequence: 7
  },
  {
    route_id: '52',
    service_id: 6,
    trip_id: '7375020',
    headsign_direction: 'NORTH to 14TH & COLORADO',
    departure_time: '19:06:32',
    stop_id: '21974',
    stop_code: '1003906',
    stop_sequence: 7
  }
]
*/