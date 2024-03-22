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

export var sql = postgres(process.env.render_url, {ssl: process.env.enable_ssl == "1" ? true : false});

// Not in use. Database only stores bus information for now.
async function get_next_scheduled_trains(station_code : string, direction :number){
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
}

// Not in use. Database only stores bus information for now
async function get_train_position_destinations(trains:any){
  let temp = trains.map((x:any) => {return x.vehicle.trip.tripId});
  return temp
}
export async function get_next_bus(stop_id: string){
  let start_time = new Date()
  let startTimestamp = start_time.getTime()
  let timeExtent = 45 * 60 * 1000
  let end_time = new Date(startTimestamp + timeExtent)

  var output =  await sql`
  SELECT * FROM bus_stop_times where
  stop_code = ${stop_id} 
  ORDER BY departure_time
  `
  return output;
}

export async function get_all_next_bus(){
  let start_time = new Date()
  let startTimestamp = start_time.getTime()
  let timeExtent = 45 * 60 * 1000
  let end_time = new Date(startTimestamp + timeExtent)

  var output =  await sql`
  SELECT stop_code, route_id, departure_time, headsign_direction, vehicle_id FROM public.bus_stop_times
  where departure_time > ${start_time.toLocaleTimeString('it-IT').toString()} and
  departure_time < ${end_time.toLocaleTimeString('it-IT').toString()}
  ORDER BY stop_code, departure_time
  `
  console.log(new Date().toString(), " : Fetched Bus Data")
  return output;
}

export async function update_bus_data() {
  try{
    let req = `https://api.wmata.com/gtfs/bus-gtfsrt-tripupdates.pb?api_key=${process.env.WMATA_KEY}`
    //stoptimeupdate:
    //time: add three 0's to make it proper date? The time number is short for some reason
    const res = await fetch(req);
    var blob = await res.arrayBuffer();
    var b = Buffer.from(blob);
    var feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(b);
    var insert:any = []
    var count = 0
    feed.entity.forEach(function (entity:any) {
      entity.tripUpdate.stopTimeUpdate.forEach(function (e:any) {
        if(e.departure != null){
          let t = parseInt(e.departure.time + "000")
          let time = new Date(t);
        
          if(entity.tripUpdate.trip.tripId != undefined || time != undefined ||
            entity.tripUpdate.vehicle.id != undefined ||
            e.stopSequence != undefined ||e.stopId != undefined ){
            count += 1
            insert.push([
              entity.tripUpdate.trip.tripId,
              time.toLocaleTimeString('it-IT').toString(),
              parseInt(entity.tripUpdate.vehicle.id),
              parseInt(e.stopSequence),
              e.stopId,
            ])
          }
        }
      })
    });
    if (count > 0){
      for (var i = count ; i > 0 && insert.length > 0; i - 700){
        await sql`
          update bus_stop_times set departure_time = update_data.time, vehicle_id = (update_data.vehicle)::int
          from (values ${sql(insert)}) as update_data (tripID, time, vehicle, sequence, stopID)
          where bus_stop_times.trip_id = update_data.tripID and bus_stop_times.stop_id = update_data.stopID and bus_stop_times.stop_sequence = (update_data.sequence)::int 
          returning bus_stop_times.trip_id
          `
          await sql`
          update bus_stop_times set vehicle_id = (update_data.vehicle)::int
          from (values ${sql(insert)}) as update_data (tripID, time, vehicle, sequence, stopID)
          where bus_stop_times.trip_id = update_data.tripID
          returning bus_stop_times.trip_id
          `
          insert = insert.slice(700)
      }
    }
  } catch(e: any) {
    console.log("---- ERROR has been caught. Check Log ----");
    console.log(e);
    var error: error_template = {
      timestamp: Date.now().toString(),
      function: "get_bus_routes",
      error: e.message,
      trace: e.stack,
    };
    backend.error_log.push(error);
  }
  setTimeout(update_bus_data, 20000);
 // console.log(new Date().toString() +": Updated database info")
}