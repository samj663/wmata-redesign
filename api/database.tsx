import * as backend from "./backend";
import {
  error_template
} from "./interfaces_and_classes";
const postgres = require('postgres')
const { default: fetch } = require("node-fetch");
const path = require('path');
require('dotenv').config({path: ".env"});
require('dotenv').config({path: path.resolve(__dirname,"../..",".env.local")});
var GtfsRealtimeBindings = require("gtfs-realtime-bindings");

const config: object = {
  host: process.env.local_host, // Postgres ip address[s] or domain name[s]
  port: process.env.local_port, // Postgres server port[s]
  database: process.env.local_db, // Name of database to connect to
  username: process.env.local_user, // Username of database user
  password: process.env.local_pass, // Password of database user
};

//const sql = postgres(config);
//export const sql = postgres(process.env.render_url, {ssl: process.env.enable_ssl == "1" ? true : false});

// Not in use. Database only stores bus information for now.
async function get_next_scheduled_trains(station_code : string, direction :number){
  const sql = postgres(process.env.render_url, {ssl: process.env.enable_ssl == "1" ? true : false});
  try{
    
    //let sql = postgres(process.env.render_url, {ssl: process.env.enable_ssl == "1" ? true : false});
    var today = new Date();
    var time = today.getHours() + ":" + String(today.getMinutes()).padStart(2, '0') + ":" + String(today.getSeconds()).padStart(2,'0');
    var time2 = (today.getHours() + 1) + ":" + String(today.getMinutes()).padStart(2, '0') + ":" + String(today.getSeconds()).padStart(2,'0');
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    //console.log(time)
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
  } catch(e:any) {
    console.error(e)
  }
  sql.end()
}

// Not in use. Database only stores bus information for now
async function get_train_position_destinations(trains:any){
  let temp = trains.map((x:any) => {return x.vehicle.trip.tripId});
  return temp
}

export async function get_next_bus(stop_id: string){
  try{
    let sql = postgres(process.env.render_url, {ssl: process.env.enable_ssl == "1" ? true : false});
    let start_time = new Date()
    let startTimestamp = start_time.getTime()
    let timeExtent = 45 * 60 * 1000
    let end_time = new Date(startTimestamp + timeExtent)

    var output =  await sql`
    SELECT * FROM bus_stop_times where
    stop_code = ${stop_id} 
    ORDER BY departure_time
    `
    sql.end()
    return output;
  } catch(e:any)  {
    console.error(e)
  }
}

async function service_id_today(){
  let sql = postgres(process.env.render_url, {ssl: process.env.enable_ssl == "1" ? true : false});
  let date = new Date().toLocaleDateString("af-ZA").replace(/-/g,"")
  let service_exception = await sql`select service_id from bus_calendar_dates where service_date = ${date} and exception_type = 1 limit 1`
  var output;
  if(service_exception.length > 0){
    return service_exception[0].service_id
  }
  let day = new Date().getDay() 

  if(day == 0){
    output = (await sql`select service_id from bus_calendar where sunday = 1 limit 1`)[0].service_id
  }
  else if(day == 1){
    output = (await sql`select service_id from bus_calendar where monday = 1 limit 1`)[0].service_id
  }
  else if(day == 2){
    output = (await sql`select service_id from bus_calendar where tuesday = 1 limit 1`)[0].service_id
  }
  else if(day == 3){
    output = (await sql`select service_id from bus_calendar where wednesday = 1 limit 1`)[0].service_id
  }
  else if(day == 4){
    output = (await sql`select service_id from bus_calendar where thursday = 1 limit 1`)[0].service_id
  }
  else if(day == 5){
    output = (await sql`select service_id from bus_calendar where friday = 1 limit 1`)[0].service_id
  }
  else{
    output = (await sql`select service_id from bus_calendar where saturday = 1 limit 1`)[0].service_id
  }
  sql.end()
  return output
}

export async function get_all_next_bus(){
  let sql = postgres(process.env.render_url, {ssl: process.env.enable_ssl == "1" ? true : false});
  let today_service = await service_id_today()
  let start_time = new Date()
  let startTimestamp = start_time.getTime()
  let timeExtent = 45 * 60 * 1000
  let end_time = new Date(startTimestamp + timeExtent)
  let output = await sql`select stop_code, route_id, departure_time, trip_headsign, bus_trips.vehicle_id, bus_trips.trip_id
  FROM bus_stop_times, bus_trips, bus_stops WHERE
  bus_trips.service_id = ${today_service} and
  bus_trips.trip_id = bus_stop_times.trip_id and
  bus_stops.stop_id = bus_stop_times.stop_id and
  bus_stop_times.departure_time >= ${start_time.toLocaleTimeString('it-IT',{timeZone: 'America/New_York'}).toString()} and 
  bus_stop_times.departure_time <= ${end_time.toLocaleTimeString('it-IT',{timeZone: 'America/New_York'}).toString()}
  order by bus_stops.stop_code, bus_stop_times.departure_time`
  sql.end()
  //console.log(output[0])
  return output
}

export async function update_bus_data() {
  let sql = postgres(process.env.render_url, {ssl: process.env.enable_ssl == "1" ? true : false});
  try{
    
    let req = `https://api.wmata.com/gtfs/bus-gtfsrt-tripupdates.pb?api_key=${process.env.WMATA_KEY}`
    const res = await fetch(req);
    var blob = await res.arrayBuffer();
    var b = Buffer.from(blob);
    var feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(b);
    var vehicle_updates:any = []
    var time_updates: any =[]
    feed.entity.forEach(function (entity:any) {
      vehicle_updates.push([
        entity.tripUpdate.trip.tripId,
        parseInt(entity.tripUpdate.vehicle.id)
      ])
      entity.tripUpdate.stopTimeUpdate.forEach(function (e:any) {
        var t;
        var time;
        if(e.departure != null){
          // Multiplied by 1000 to convert from seconds to milliseconds
          t =  parseInt(e.departure.time + "000")
          time = new Date(t);
        }
        else{
          // Multiplied by 1000 to convert from seconds to milliseconds
          t = parseInt(e.arrival.time + "000")
          time = new Date(t);
        }
        time_updates.push([
          entity.tripUpdate.trip.tripId,
          time.toLocaleTimeString('it-IT',{timeZone: 'America/New_York'}).toString(),
          parseInt(e.stopSequence),
          e.stopId
        ])
      })
    });
    var updated_count = 0
    for(var i = 0 ; i < time_updates.length; i = i+ 700){
      let end = i + 700
      let t = await sql`
        UPDATE bus_stop_times SET departure_time = update_data.time
        FROM (values ${sql(time_updates.slice(i, end))}) as update_data (tripID, time, sequence, stopID)
        WHERE bus_stop_times.trip_id = update_data.tripID and bus_stop_times.stop_id = update_data.stopID and bus_stop_times.stop_sequence = (update_data.sequence)::int 
        RETURNING bus_stop_times.trip_id`
        updated_count += t.length
    }
    for(var i = 0 ; i < vehicle_updates.length; i = i+ 700){
      await sql`
        UPDATE bus_trips SET vehicle_id = (update_data.vehicle_id)::int 
        FROM (values ${sql(vehicle_updates)}) as update_data (tripID, vehicle_id)
        WHERE bus_trips.trip_id = update_data.tripID
        RETURNING bus_trips.trip_id`
    }
    console.log(`Updated Database Info -- Fetched: ${time_updates.length} items | Updated: ${updated_count} items`)
    
  } catch(e: any) {
    console.error(e);
  }
  sql.end()
  setTimeout(update_bus_data, 20000);
}