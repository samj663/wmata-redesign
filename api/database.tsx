
import * as backend from "./backend";
const postgres = require('postgres')
const { default: fetch } = require("node-fetch");
const path = require('path');
require('dotenv').config({path: ".env"});
require('dotenv').config({path: path.resolve(__dirname,"../..",".env.local")});
var GtfsRealtimeBindings = require("gtfs-realtime-bindings");
const database_url = `${process.env.digitalocean_url}?ssl=require`
const fs = require("fs");
var AdmZip = require("adm-zip");

//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
// Not in use. Database only stores bus information for now.
async function get_next_scheduled_trains(station_code : string, direction :number){
  let sql = postgres(database_url);
  try{
    var today = new Date();
    var time = today.getHours() + ":" + String(today.getMinutes()).padStart(2, '0') + ":" + String(today.getSeconds()).padStart(2,'0');
    var time2 = (today.getHours() + 1) + ":" + String(today.getMinutes()).padStart(2, '0') + ":" + String(today.getSeconds()).padStart(2,'0');
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
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

//Not in use. All next bus info is updated from get_all_next_bus()
export async function get_next_bus(stop_id: string){
  let sql = postgres(database_url);
  try{
    
    let start_time = new Date()
    var output =  await sql`
      SELECT * FROM bus_stop_times where
      stop_code = ${stop_id} 
      ORDER BY departure_time`
    
    return output;
  } catch(e:any)  {
    console.error(e)
  }
  sql.end()
}
/**
 * Gets service id from tripupdates.
 */
async function service_id_today(){
  let sql = postgres(database_url);
  try{
    let req = `https://api.wmata.com/gtfs/bus-gtfsrt-tripupdates.pb?api_key=${process.env.WMATA_KEY}`
    const res = await fetch(req);
    var feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(Buffer.from(await res.arrayBuffer()));
    var trip_id: any[] = []
    feed.entity.forEach(function (entity: any) {
      trip_id.push(entity.id)
    });
    var result =  await sql` select count(trip_id), service_id from bus_trips
    where trip_id in ${ sql(trip_id) } group by service_id`;
    
    result.sort(function(a:any, b:any) {
      return parseInt(b.count) - parseInt(a.count);
    })

    if(result.length  > 0 ){
      sql.end()
      if (backend.fetch_status.bus_database_status.service_id != result[0].service_id ){
        await reset_bus_trip(backend.fetch_status.bus_database_status.service_id)
      }
      backend.fetch_status.bus_database_status.service_id = result[0].service_id
      return result[0].service_id
    }
    let date = new Date().toLocaleDateString("af-ZA",{timeZone: 'America/New_York'}).replace(/-/g,"")
    let service_exception = await sql`select service_id from bus_calendar_dates where service_date = ${date} and exception_type = 1 limit 1`
    var output;
    if(service_exception.length > 0){
      return service_exception[0].service_id
    }
    let day = new Date().toLocaleDateString("en-US",{timeZone: 'America/New_York', weekday: "short"})

    if(day == "Sun"){
      output = (await sql`select service_id from bus_calendar where sunday = 1 limit 1`)[0].service_id
    }
    else if(day == "Mon"){
      output = (await sql`select service_id from bus_calendar where monday = 1 limit 1`)[0].service_id
    }
    else if(day == "Tue"){
      output = (await sql`select service_id from bus_calendar where tuesday = 1 limit 1`)[0].service_id
    }
    else if(day == "Wed"){
      output = (await sql`select service_id from bus_calendar where wednesday = 1 limit 1`)[0].service_id
    }
    else if(day == "Thu"){
      output = (await sql`select service_id from bus_calendar where thursday = 1 limit 1`)[0].service_id
    }
    else if(day == "Fri"){
      output = (await sql`select service_id from bus_calendar where friday = 1 limit 1`)[0].service_id
    }
    else{
      output = (await sql`select service_id from bus_calendar where saturday = 1 limit 1`)[0].service_id
    }

    sql.end()
    if (backend.fetch_status.bus_database_status.service_id != output ){
      await reset_bus_trip(backend.fetch_status.bus_database_status.service_id)
    }
    backend.fetch_status.bus_database_status.service_id = output
    return output
  }
  catch(e: any){
    console.error(e)
    sql.end()
    return -1
    backend.handleErrors(e, "database/service_id_today", "bus_database_status")
  }
  sql.end()
}

async function reset_bus_trip(service_id: number){
  let sql = postgres(database_url);
  try{
    let t = await sql `UPDATE bus_trips SET vehicle_id = -1, delay = 0 where service_id = ${service_id}`;
  }
  catch(e: any){
    backend.handleErrors(e, "database/reset_bus_trip", "")
  }
  sql.end()
}

// TODO: Account for when late night servce spills into next days's service. It's not guaranteed
// that late night service is the same for each day.
export async function get_all_next_bus(){
  let sql = postgres(database_url);
  try{
    let today_service = await service_id_today()
    if(today_service == -1){
      throw new Error("Function 'today_service' failed");
    }
    let start_time = new Date()
    let startTimestamp = start_time.getTime()
    let timeExtent = 45 * 60 * 1000
    let end_time = new Date(startTimestamp + timeExtent)
    let temp = start_time.toLocaleTimeString('it-IT',{timeZone: 'America/New_York'}).toString()
    let temp2 = end_time.toLocaleTimeString('it-IT',{timeZone: 'America/New_York'}).toString()
    let output;
    if(parseInt(temp.slice(0,2)) == 23 && parseInt(temp2.slice(0,2)) < 2){
      //let temp3 = parseInt(temp2.slice(0,2) + 24).toString() + temp2.slice(2)
     // console.log("HMMM")
      output = await sql`
      SELECT stop_code, route_id, departure_time, trip_headsign, bus_trips.vehicle_id, bus_trips.trip_id, bus_trips.delay
      FROM bus_stop_times, bus_trips, bus_stops WHERE
      bus_trips.service_id = ${today_service} and
      bus_trips.trip_id = bus_stop_times.trip_id and
      bus_stops.stop_id = bus_stop_times.stop_id and
      (bus_stop_times.departure_time >= ${temp.length == 7 ? "0" + temp:temp} or
      bus_stop_times.departure_time <= ${temp2.length == 7 ? "0" + temp2:temp2})
      ORDER BY bus_stops.stop_code, bus_stop_times.departure_time`
    }
    else{
      output = await sql`
        SELECT stop_code, route_id, departure_time, trip_headsign, bus_trips.vehicle_id, bus_trips.trip_id, bus_trips.delay
        FROM bus_stop_times, bus_trips, bus_stops WHERE
        bus_trips.service_id = ${today_service} and
        bus_trips.trip_id = bus_stop_times.trip_id and
        bus_stops.stop_id = bus_stop_times.stop_id and
        bus_stop_times.departure_time >= ${temp.length == 7 ? "0" + temp:temp} and 
        bus_stop_times.departure_time <= ${temp2.length == 7 ? "0" + temp2:temp2}
        ORDER BY bus_stops.stop_code, bus_stop_times.departure_time`
    }
    sql.end()
    //console.log(`(1ST) Start Time: ${start_time} -- End Time: ${end_time}`)
    if(output.length == 0){
      console.warn('WARNING: "get_all_next_bus" -- Returned an empty array')
    }
    return output
  } catch (e:any){
    backend.handleErrors(e, "database/get_all_next_bus", "bus_database_status")
  }
  sql.end()
}

export async function update_bus_data() {
  let sql = postgres(database_url);
  try{
    let req = `https://api.wmata.com/gtfs/bus-gtfsrt-tripupdates.pb?api_key=${process.env.WMATA_KEY}`
    const res = await fetch(req);
    var blob = await res.arrayBuffer();
    var b = Buffer.from(blob);
    var feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(b);
    var trip_updates:any = []
    var time_updates: any =[]
    feed.entity.forEach(function (entity:any) {
      trip_updates.push([
        entity.tripUpdate.trip.tripId,
        parseInt(entity.tripUpdate.vehicle.id),
        entity.tripUpdate.delay
      ])
      entity.tripUpdate.stopTimeUpdate.forEach(function (e:any) {
        var t;
        var time;
        if(e.departure != null){
          t =  parseInt(e.departure.time + "000")
          time = new Date(t);
        }
        else{
          t = parseInt(e.arrival.time + "000")
          time = new Date(t);
        }
        let temp = time.toLocaleTimeString('it-IT',{timeZone: 'America/New_York'}).toString()//val[2].length == 7 ?"0" +val[2]:val[2]
        time_updates.push([
          entity.tripUpdate.trip.tripId,
          temp.length == 7 ? "0" + temp:temp,
          parseInt(e.stopSequence),
          e.stopId
        ])
      })
    });
    var updated_count = 0
    for(var i = 0 ; i < time_updates.length; i = i + 700){
      let end = i + 700
      let t = await sql`
        UPDATE bus_stop_times SET departure_time = update_data.time
        FROM (values ${sql(time_updates.slice(i, end))}) as update_data (tripID, time, sequence, stopID)
        WHERE bus_stop_times.trip_id = update_data.tripID and bus_stop_times.stop_id = update_data.stopID and bus_stop_times.stop_sequence = (update_data.sequence)::int 
        RETURNING bus_stop_times.trip_id`
        updated_count += t.length
    }
    for(var i = 0 ; i < trip_updates.length; i = i+ 700){
      await sql`
        UPDATE bus_trips SET vehicle_id = (update_data.vehicle_id)::int, delay = (update_data.delay)::int
        FROM (values ${sql(trip_updates)}) as update_data (tripID, vehicle_id, delay)
        WHERE bus_trips.trip_id = update_data.tripID
        RETURNING bus_trips.trip_id`
    }
    //console.log(`Updated Database Info -- Fetched: ${time_updates.length} items | Updated: ${updated_count} items`)
  } catch(e: any) {
    backend.handleErrors(e, "database/update_bus_data", "bus_database_status")
    //console.warn(`Database Info Failed To Update --`)
  }
  sql.end()
  setTimeout(update_bus_data, 20000);
}

export async function update_bus_data_no_db() {
  let sql = postgres(database_url);
  try{
    let req = `https://api.wmata.com/gtfs/bus-gtfsrt-tripupdates.pb?api_key=${process.env.WMATA_KEY}`
    const res = await fetch(req);
    var blob = await res.arrayBuffer();
    var b = Buffer.from(blob);
    var feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(b);
    var trip_updates:any = []
    var time_updates: any =[]
    feed.entity.forEach(function (entity:any) {
      trip_updates.push([
        entity.tripUpdate.trip.tripId,
        parseInt(entity.tripUpdate.vehicle.id)
      ])
      entity.tripUpdate.stopTimeUpdate.forEach(function (e:any) {
        var t;
        var time;
        if(e.departure != null){
          t =  parseInt(e.departure.time + "000")
          time = new Date(t);
        }
        else{
          t = parseInt(e.arrival.time + "000")
          time = new Date(t);
        }
        let temp = time.toLocaleTimeString('it-IT',{timeZone: 'America/New_York'}).toString()//val[2].length == 7 ?"0" +val[2]:val[2]
        time_updates.push([
          entity.tripUpdate.trip.tripId,
          temp.length == 7 ? "0" + temp:temp,
          parseInt(e.stopSequence),
          e.stopId
        ])
      })
    });
    var updated_count = 0
    for(var i = 0 ; i < time_updates.length; i = i + 700){
      let end = i + 700
      let t = await sql`
        UPDATE bus_stop_times SET departure_time = update_data.time
        FROM (values ${sql(time_updates.slice(i, end))}) as update_data (tripID, time, sequence, stopID)
        WHERE bus_stop_times.trip_id = update_data.tripID and bus_stop_times.stop_id = update_data.stopID and bus_stop_times.stop_sequence = (update_data.sequence)::int 
        RETURNING bus_stop_times.trip_id`
        updated_count += t.length
    }
    for(var i = 0 ; i < trip_updates.length; i = i+ 700){
      await sql`
        UPDATE bus_trips SET vehicle_id = (update_data.vehicle_id)::int 
        FROM (values ${sql(trip_updates)}) as update_data (tripID, vehicle_id)
        WHERE bus_trips.trip_id = update_data.tripID
        RETURNING bus_trips.trip_id`
    }
    //console.log(`Updated Database Info -- Fetched: ${time_updates.length} items | Updated: ${updated_count} items`)
  } catch(e: any) {
    //console.warn(`Database Info Failed To Update --`)
    //console.error(e);
  }
  sql.end()
  setTimeout(update_bus_data, 20000);
}

export async function update_rail_data() {
  let sql = postgres(database_url);
  try{
    let req = `https://api.wmata.com/gtfs/rail-gtfsrt-tripupdates.pb?api_key=${process.env.WMATA_KEY}`
    const res = await fetch(req);
    var blob = await res.arrayBuffer();
    var b = Buffer.from(blob);
    var feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(b);
    var trip_updates:any = []
    var time_updates: any =[]
    var g = JSON.stringify(feed.entity, null, 2)//.replace(/[\[\]\,\"]/g,'');
   /* fs.writeFile('rail_update.json', g, (err:any) => {
      if (err) {
        console.error(err);
      } else {
        // file written successfully
      }
    });*/
    feed.entity.forEach(function (entity:any) {
      if(entity.tripUpdate.vehicle != null){
          trip_updates.push([
              entity.tripUpdate.trip.tripId,
              entity.tripUpdate.vehicle.licensePlate,
              entity.tripUpdate.trip.scheduleRelationship
          ])
      }
      else{
          trip_updates.push([
              entity.tripUpdate.trip.tripId,
              "-1",
              entity.tripUpdate.trip.scheduleRelationship
          ])
      }
      entity.tripUpdate.stopTimeUpdate.forEach(function (e:any) {
        var t;
        var time;
        if(e.scheduleRelationship == 0){
          if(e.departure != null){
              t =  parseInt(e.departure.time + "000")
              time = new Date(t);
          }
          else{
              t = parseInt(e.arrival.time + "000")
              time = new Date(t);
          }
          //console.log(time)
          let temp = time.toLocaleTimeString('it-IT',{timeZone: 'America/New_York'}).toString()//val[2].length == 7 ?"0" +val[2]:val[2]
          time_updates.push([
              entity.tripUpdate.trip.tripId,
              temp.length == 7 ? "0" + temp:temp,
              parseInt(e.stopSequence),
              e.stopId,
              e.scheduleRelationship
          ])
        }
        else{
          time_updates.push([
              entity.tripUpdate.trip.tripId,
              "",
              parseInt(e.stopSequence),
              e.stopId,
              e.scheduleRelationship
          ])
         // console.log(e.scheduleRelationship)
        }
      })
    });
    var updated_count = 0
    for(var i = 0 ; i < time_updates.length; i = i + 700){
      let end = i + 700
      let t = await sql`
        UPDATE rail_stop_times SET departure_time = update_data.time, status = update_data.scheduleRelationship
        FROM (values ${sql(time_updates.slice(i, end))}) as update_data (tripID, time, sequence, stopID, scheduleRelationship)
        WHERE rail_stop_times.trip_id = update_data.tripID and rail_stop_times.stop_id = update_data.stopID and rail_stop_times.stop_sequence = (update_data.sequence)::int 
        RETURNING *`
        updated_count += t.length
     //   console.log(t)
    }
    for(var i = 0 ; i < trip_updates.length; i = i+ 700){
      await sql`
        UPDATE rail_trips SET license_plate = update_data.vehicle_id, status = update_data.status
        FROM (values ${sql(trip_updates)}) as update_data (tripID, vehicle_id, status)
        WHERE rail_trips.trip_id = update_data.tripID
        RETURNING *`
    }
    //console.log(`Updated Database Info -- Fetched: ${time_updates.length} items | Updated: ${updated_count} items`)
   // await get_train_schedule_all()
  } catch(e: any) {
      console.error(e)
   // backend.handleErrors(e, "database/update_bus_data", "bus_database_status")
    //console.warn(`Database Info Failed To Update --`)
  }
  sql.end()
  //setTimeout(update_rail_data, 20000);
}
  export async function get_train_schedule_today(){
      let sql = postgres(database_url);
      try{
          let date = new Date().toLocaleDateString("af-ZA",{timeZone: 'America/New_York'}).replace(/-/g,"")
          let service_exception = await sql`select service_id from rail_calendar_dates where service_date = ${date} and exception_type = 1`
          let todays_service = service_exception.map((a:any) => a.service_id);
          let start_time = new Date()
          let startTimestamp = start_time.getTime()
          let timeExtent = 60  * 60 * 1000
          let end_time = new Date(startTimestamp + timeExtent)
          let temp = start_time.toLocaleTimeString('it-IT',{timeZone: 'America/New_York'}).toString()
          let temp2 = end_time.toLocaleTimeString('it-IT',{timeZone: 'America/New_York'}).toString()
          let output;
          console.log(service_exception)
          console.log()
          if(parseInt(temp.slice(0,2)) == 23 && parseInt(temp2.slice(0,2)) < 2){
          //let temp3 = parseInt(temp2.slice(0,2) + 24).toString() + temp2.slice(2)
          // console.log("HMMM")
          
              output = await sql`
              SELECT REPLACE(REPLACE(REPLACE(REPLACE(stop_id, 'PF_', ''), '_C', ''), '_1', ''), '_2', ''), route_id, departure_time, REPLACE(trip_headsign, '"', '') as trip_headsign, rail_trips.license_plate, rail_trips.trip_id
              FROM rail_stop_times, rail_trips WHERE
              rail_trips.service_id in ${sql(todays_service)} and
              rail_trips.trip_id = rail_stop_times.trip_id and
              (rail_stop_times.departure_time >= ${temp.length == 7 ? "0" + temp:temp} or
              rail_stop_times.departure_time <= ${temp2.length == 7 ? "0" + temp2:temp2})
              ORDER BY stop_id, rail_stop_times.departure_time`
          }
          else{//NOTE: stop_id is now named 'replace' because of replace function
          output = await sql`
              SELECT REPLACE(REPLACE(REPLACE(REPLACE(stop_id, 'PF_', ''), '_C', ''), '_1', ''), '_2', ''), route_id, departure_time, REPLACE(trip_headsign, '"', '') as trip_headsign, rail_trips.license_plate, rail_trips.trip_id
              FROM rail_stop_times, rail_trips WHERE
              rail_trips.service_id in ${sql(todays_service)} and
              rail_trips.trip_id = rail_stop_times.trip_id and
              rail_stop_times.departure_time >= ${temp.length == 7 ? "0" + temp:temp} and 
              rail_stop_times.departure_time <= ${temp2.length == 7 ? "0" + temp2:temp2}
              ORDER BY stop_id, rail_stop_times.departure_time`
          }
          //console.log(groupBy(output, "replace"))
          //const map = new Map(Object.entries(groupBy(output, "replace")));
          //console.log(map.get('A01'))
          //console.log(output)

      sql.end()
      return output
      //setTimeout(get_train_schedule_today, 20000)
      } catch (e:any){

          console.error(e)
          sql.end()
          //setTimeout(get_train_schedule_today, 20000)
          return []
          // backend.handleErrors(e, "database/get_all_next_bus", "bus_database_status")
      }
  }
export async function get_train_schedule_all(){
  let sql = postgres(database_url);
  try{
      let output = await sql`
      SELECT REPLACE(REPLACE(REPLACE(REPLACE(stop_id, 'PF_', ''), '_C', ''), '_1', ''), '_2', ''), route_id, departure_time, REPLACE(trip_headsign, '"', '') as trip_headsign, rail_trips.license_plate, rail_trips.trip_id
              FROM rail_stop_times, rail_trips WHERE
              rail_trips.trip_id = rail_stop_times.trip_id
              ORDER BY stop_id, rail_stop_times.departure_time`
      //console.log(groupBy(output, "stop_id"))
      //let result = output.reduce((map, obj) => (map[obj.stop_id] = obj, map), {});
      //console.log(result)
      //console.log( Map.groupBy((output), ({ stop_id }:any) => stop_id))
      return output
  } catch (e:any){
     // backend.handleErrors(e, "database/get_all_next_bus", "bus_database_status")
     return []
  }
  //setTimeout(get_train_schedule_all, 20000)
  sql.end()

}

export async function get_train_schedule_calendar(){
  let sql = postgres(database_url);
      try{
        let output = await sql`
        SELECT service_id, service_date FROM rail_calendar_dates
        ORDER BY service_date`
       // console.log(groupBy(output, "service_date"))
      sql.end()
      return output
      //setTimeout(get_train_schedule_today, 20000)
      } catch (e:any){

          console.error(e)
          sql.end()
          //setTimeout(get_train_schedule_today, 20000)
          return null
          // backend.handleErrors(e, "database/get_all_next_bus", "bus_database_status")
      }
}

var groupBy = function(xs: any, key:any) {
  return xs.reduce(function(rv:any, x:any) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

/**
 * Used to refresh bus database. Currently not in use because of memory limitation
 * in cloud server
 */
/*
export async function refresh_bus_database() {
  await get_static_data(`https://api.wmata.com/gtfs/bus-gtfs-static.zip?api_key=${process.env.WMATA_KEY}`, "./static_bus")
  let sql = postgres(database_url);

  //Check if fetched gtfs data is new
  let dates = await sql`select * from bus_feed_info`
 
  var content = await fs.readFileSync("./static_bus/feed_info.txt", "utf8");
  var s = content.split("\n");
  var e = s.shift().split(",");
  
  let new_dates = s[0].split(",");
  //console.log(new_dates)
  //console.log(dates)
  if(new_dates[3] == dates[0].start_date && new_dates[4] == dates[0].end_date){
    console.log("NOTICE: Checked GTFS bus schedule. No date change found.")
    return
  }
  else{
    console.warn("WARNING: Checked GTFS bus schedule. Date change found. Updating bus database.")
    await sql`TRUNCATE bus_feed_info CASCADE`
    await sql`insert into bus_feed_info values (${new_dates[3]},${new_dates[4]})`
  }
  sql.end()

  //If gtfs data is new, replace database information
  await create_tables();
  var content = await fs.readFileSync("./static_bus/stops.txt", "utf8");
  var s = content.split("\n");
  var e = s.shift().split(",");
  
  let count = 0;
  var rows_entered = 0
  var trips: object[] = [];
  var stops: object[] = [];
  var stop_times: object[] = [];
  var calendar_dates: object[] = [];
  var calendar: object[] = [];

  var stops: object[] = [];
   for (const e of s) {
      let val = e.split(",");
      if(val[1] == undefined) continue
      stops.push({
        stop_id: val[0],
        stop_code: val[1],
        stop_name: val[2],
        lat: parseFloat(val[4]),
        lon: parseFloat(val[5]),
      })
      count += 1
      if (count == 10000) {
        let sql = postgres(database_url);
        await sql` insert into bus_stops ${sql(stops)} ON CONFLICT DO NOTHING`;
        
        rows_entered += 10000
        //console.log("Added stops data: ", rows_entered)
        count = 0;
        stops = [];
        sql.end()
      }
    }
    if (count > 0) {
      let sql = postgres(database_url);
      await sql` insert into bus_stops ${sql(stops)} ON CONFLICT DO NOTHING`;
      
      console.log("Added final stops data: ", stops.length)
      count = 0;
      stops = [];
      sql.end()
    }
  
    content = await fs.readFileSync("./static_bus/trips.txt", "utf8");
    s = content.split("\n");
    e = s.shift().split(",");
    rows_entered = 0
    for (const e of s) {
      let val = e.split(",");
      if(val[1] == undefined) continue
      trips.push({
        route_id: val[0],
        service_id: val[1],
        trip_id: val[2],
        trip_headsign: val[3],
        direction_id: parseInt(val[4]),
        vehicle_id: -1,
        delay: 0
      })
      count += 1
      if (count == 9200) {
        let sql = postgres(database_url);
        await sql` insert into bus_trips ${sql(trips)} ON CONFLICT DO NOTHING`;
        rows_entered += 92000
        //console.log("Added trips data: ", rows_entered)
        count = 0;
        trips = [];
        sql.end()
      }
    }
    if (count > 0) {
      let sql = postgres(database_url);
      await sql` insert into bus_trips ${sql(trips)} ON CONFLICT DO NOTHING`;
      console.log("Added final trips data: ", trips.length)
      count = 0;
      trips = [];
      sql.end()
    }
  
    content = await fs.readFileSync("./static_bus/calendar_dates.txt", "utf8");
    s = content.split("\n");
    e = s.shift().split(",");
    rows_entered = 0
    for (const e of s) {
      let val = e.split(",");
      if(val[1] == undefined) continue
      calendar_dates.push({
        service_id: val[0],
        service_date : val[1],
        exception_type: val[2],
      })
      count += 1
      if (count == 10000) {
        let sql = postgres(database_url);
        await sql` insert into bus_calendar_dates ${sql(calendar_dates)} ON CONFLICT DO NOTHING`;
        
        rows_entered += 10000
       // console.log("Added calendar_dates data: ", rows_entered)
        count = 0;
        calendar_dates = [];
        sql.end()
      }
    }
    if (count > 0) {
      let sql = postgres(database_url);
      await sql` insert into bus_calendar_dates ${sql(calendar_dates)} ON CONFLICT DO NOTHING`;
      
      console.log("Added calendar_dates data: ", calendar_dates.length)
      count = 0;
      calendar_dates = [];
      sql.end()
    }
  
    content = await fs.readFileSync("./static_bus/calendar.txt", "utf8");
    s = content.split("\n");
    e = s.shift().split(",");
    rows_entered = 0
    for (const e of s) {
      let val = e.split(",");
      if(val[1] == undefined) continue
      calendar.push({
        service_id : val[0],
        monday : val[1],
        tuesday : val[2],
        wednesday : val[3],
        thursday : val[4], 
        friday : val[5],
        saturday : val[6],
        sunday : val[7],
        start_date : val[8],
        end_date : val[9]
      })
      count += 1
      if (count == 10000) {
        let sql = postgres(database_url);
        await sql` insert into bus_calendar ${sql(calendar)} ON CONFLICT DO NOTHING`;
        
        rows_entered += 10000
        //console.log("Added calendar data: ", rows_entered)
        count = 0;
        calendar_dates = [];
        sql.end()
      }
    }
    if (count > 0) {
      let sql = postgres(database_url);
      await sql` insert into bus_calendar ${sql(calendar)} ON CONFLICT DO NOTHING`;
      
      console.log("Added calendar data: ", calendar_dates.length)
      count = 0;
      calendar_dates = [];
      sql.end()
    }

    /*let sql = postgres(database_url);
    let t = await sql`TRUNCATE bus_stop_times CASCADE`
    sql.end()*

    content = await fs.readFileSync("./static_bus/stop_times.txt", "utf8");
    s = content.split("\n");
    e = s.shift().split(",");
    rows_entered = 0
    for (const e of s) {
      let val = e.split(",");
      if(val[1] == undefined) continue
      stop_times.push({
        trip_id: val[0],
        departure_time : val[2].length == 7 ?"0" +val[2]:val[2],
        stop_id: val[3],
        stop_sequence : val[4],
      })
      count += 1
      if (count == 10000) {
        let sql = postgres(database_url);
        await sql` insert into bus_stop_times ${sql(stop_times)} ON CONFLICT DO NOTHING`;
        
        rows_entered += 10000
        //console.log("Added stop_times data: ", rows_entered)
        count = 0;
        stop_times = [];
        sql.end()
      }
    }
    if (count > 0) {
      let sql = postgres(database_url);
      await sql` insert into bus_stop_times ${sql(stop_times)} ON CONFLICT DO NOTHING`;
     
      console.log("Added final stop_times data: ", stop_times.length)
      count = 0;
      stop_times = [];
      sql.end()
    }
    console.log("SUCCESS: Refreshed bus database")
  }

async function get_static_data(req: any, folder_name: string) {
    console.log("NOTICE: Fetching Bus GTFS Data...");
    const res = await fetch(req);
    var blob = await res.arrayBuffer();
    var b = Buffer.from(blob);
    console.log("NOTICE: Unzipping Bus GTFS Data...");
    //await decompress(b, folder_name);
    var zip = new AdmZip(b);
    zip.extractAllTo(folder_name, true);
    console.log("NOTICE: Unzipped Bus GTFS Data.");
  }
async function create_tables(){
let sql = postgres(database_url);
await sql`
TRUNCATE TABLE bus_trips CASCADE
;`
await sql`
TRUNCATE TABLE bus_stops CASCADE
;`
await sql`
TRUNCATE TABLE bus_stop_times CASCADE
;`
await sql`
TRUNCATE TABLE bus_calendar_dates CASCADE
;`
await sql`
TRUNCATE TABLE bus_calendar CASCADE
;`

await sql`
CREATE TABLE IF NOT EXISTS bus_trips(
  route_id varchar(3),
    service_id int,
    trip_id varchar,
    trip_headsign varchar,
    direction_id int,
    vehicle_id int,
    delay int,
    PRIMARY KEY (trip_id)
);`
await sql`
CREATE TABLE IF NOT EXISTS bus_stops(
    stop_id varchar,
    stop_code varchar (7),
    stop_name varchar,
    lat float,
    lon float,
    PRIMARY KEY (stop_id)
);`
await sql`

CREATE TABLE IF NOT EXISTS bus_stop_times (
    trip_id varchar ,
    departure_time varchar,
    stop_id varchar,
    stop_sequence int,
    PRIMARY KEY (trip_id,stop_sequence)
);`
await sql`

CREATE TABLE IF NOT EXISTS bus_calendar_dates(
    service_id int,
    service_date varchar(8),
    exception_type int,
    PRIMARY KEY (service_id, service_date)
);`
await sql`

CREATE TABLE IF NOT EXISTS bus_calendar(
    service_id int,
    monday int,
    tuesday int,
    wednesday int,
    thursday int, 
    friday int,
    saturday int,
    sunday int,
    start_date varchar(8),
    end_date varchar(8)
);`;
sql.end()
}*/