import * as backend from "./backend";
const postgres = require("postgres");
const { default: fetch } = require("node-fetch");
const path = require("path");
require("dotenv").config({ path: ".env" });
require("dotenv").config({
  path: path.resolve(__dirname, "../..", ".env.local"),
});
var GtfsRealtimeBindings = require("gtfs-realtime-bindings");
//const database_url = `${process.env.digitalocean_url}?ssl=require`;
//const database_pool_url = `${process.env.digitalocean_pool_url}?ssl=require`;
const database_user_pool_url = `${process.env.digitalocean_user_pool_url}?ssl=require`;
//const database_user_pool_url = `${process.env.digitalocean_testing_pool_url}?ssl=require`;
//const database_server_pool_url = `${process.env.digitalocean_pool_url}?ssl=require`;

export async function get_rail_scheduled_run(trip_id: String) {
  let sql = postgres(database_user_pool_url);
  let trip_array =
    await sql`select stop_sequence, departure_time, REPLACE(REPLACE(REPLACE(REPLACE(rail_stops.stop_id, 'PF_', ''), '_C', ''), '_1', ''), '_2', '') AS stop_id from rail_stop_times
  inner join rail_stops on rail_stops.stop_id = rail_stop_times.stop_id
  inner join rail_trips on rail_trips.trip_id = rail_stop_times.trip_id where
  rail_trips.trip_id = ${trip_id}
  order by stop_sequence asc`;
  let trip_info = await sql`
    select trip_id, route_id, service_id, trip_headsign, train_id, license_plate from rail_trips where
    rail_trips.trip_id = ${trip_id}
    `;
  if (trip_info.length == 0) {
    return {};
  }
  let output = {
    trip_id: trip_info[0].trip_id,
    route_id: trip_info[0].route_id,
    service_id: trip_info[0].service_id,
    trip_headsign: trip_info[0].trip_headsign,
    train_id: trip_info[0].train_id,
    license_plate: trip_info[0].license_plate,
    stop_times: trip_array,
  };
  sql.end();
  return output;
}

export async function get_bus_scheduled_run(trip_id: String) {
  let sql = postgres(database_user_pool_url);
  try {
    
    let trip_array =
      await sql`select stop_sequence, departure_time, stop_code, delay from bus_stop_times
    inner join bus_stops on bus_stops.stop_id = bus_stop_times.stop_id
    inner join bus_trips on bus_trips.trip_id = bus_stop_times.trip_id where
    bus_trips.trip_id = ${trip_id}
    order by stop_sequence asc`;
    let trip_info = await sql`
    select trip_id, trip_headsign, vehicle_id, service_id, route_id from bus_trips where
    bus_trips.trip_id = ${trip_id}`;
    if (trip_info.length == 0) {
      return {};
    }
    let output = {
      trip_id: trip_info[0].trip_id,
      trip_headsign: trip_info[0].trip_headsign,
      service_id: trip_info[0].service_id,
      vehicle_id: trip_info[0].vehicle_id,
      route_id: trip_info[0].route_id,
      stop_times: trip_array,
    };
    sql.end();
    return output;
  } catch (e: any) {
    sql.end();
    return {};
  }
}

//Takes too long to load ~13 secs per call
export async function get_bus_schedule_timetable(
  stop_id: string,
  date: string,
) {
  let tempy = await service_id_today(date);
  console.log(tempy);
  let sql = postgres(database_user_pool_url);
  let trip_array =
    await sql`
        select bus_trips.trip_id, departure_time, route_id, bus_trips.trip_headsign, vehicle_id  from bus_stop_times
        inner join bus_stops on bus_stops.stop_id = bus_stop_times.stop_id
        inner join bus_trips on bus_trips.trip_id = bus_stop_times.trip_id where
        bus_stops.stop_code = ${stop_id} and
        bus_trips.service_id = ${tempy}
        order by departure_time asc`;
  console.log(trip_array);
  sql.end();
  return trip_array;
}

//Takes 5 to 7 seconds. Is that resonable?
export async function get_bus_schedule_timetable_TESTING(
  stop_code: string,
  date: string,
) {
  let tempy = await service_id_today(date);
 // console.log(tempy);
  let sql = postgres(database_user_pool_url);
  let stop_id = await sql`select stop_id from bus_stops where stop_code = ${stop_code}`
  //console.log(stop_id)
  if(stop_id.length == 1){
    let trip_array =
    await sql`
        select bus_trips.trip_id, departure_time, route_id, bus_trips.trip_headsign, vehicle_id from bus_stop_times
        inner join bus_trips on bus_trips.trip_id = bus_stop_times.trip_id where
        bus_stop_times.stop_id = ${stop_id[0].stop_id} and
        bus_trips.service_id = ${tempy}
        order by departure_time asc`;
    sql.end();
    return trip_array;    
  }
  //console.log(trip_array);
  sql.end();
  return [];
}

export async function get_rail_schedule_timetable(
  stop_id: string,
  date: string,
) {
  try {
    let tempy = await rail_service_id_today(date);
   // console.log(tempy);
    let sql = postgres(database_user_pool_url);
    let trip_array =
      await sql` select rail_trips.trip_id, departure_time, route_id, rail_trips.trip_headsign, train_id, license_plate  from rail_stop_times
        inner join rail_stops on rail_stops.stop_id = rail_stop_times.stop_id
        inner join rail_trips on rail_trips.trip_id = rail_stop_times.trip_id where
        rail_stops.stop_id like ${"%" + stop_id + "%"} and
	rail_trips.service_id in ${sql(tempy)}
	order by departure_time asc`;
   // console.log(trip_array);
    sql.end();
    return trip_array;
  } catch (e: any) {
    return [];
  }
}

async function service_id_today(param_date: string) {
  let sql = postgres(database_user_pool_url);
  try {
    console.log(param_date);
    let date = new Date(Date.parse(param_date))
      .toLocaleDateString("af-ZA", {
        timeZone: "America/New_York",
        month: "2-digit",
        year: "numeric",
        day: "2-digit",
      })
      .replace(/-/g, "");
   // console.log(`date ${date}`);
    let service_exception =
      await sql`select service_id from bus_calendar_dates where service_date = ${date} and exception_type = 1 limit 1`;
    var output;
    if (service_exception.length > 0) {
      sql.end();
  //    console.log(
   //     `service exception service_id=${service_exception[0].service_id} - ${date}`,
  //    );
      return service_exception[0].service_id;
    }
    let day = new Date(Date.parse(param_date)).toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
    });

   // console.log(day);

    if (day == "Sun") {
      output = (
        await sql`select service_id from bus_calendar where sunday = 1 limit 1`
      )[0].service_id;
    } else if (day == "Mon") {
      output = (
        await sql`select service_id from bus_calendar where monday = 1 limit 1`
      )[0].service_id;
    } else if (day == "Tue") {
      output = (
        await sql`select service_id from bus_calendar where tuesday = 1 limit 1`
      )[0].service_id;
    } else if (day == "Wed") {
      output = (
        await sql`select service_id from bus_calendar where wednesday = 1 limit 1`
      )[0].service_id;
    } else if (day == "Thu") {
      output = (
        await sql`select service_id from bus_calendar where thursday = 1 limit 1`
      )[0].service_id;
    } else if (day == "Fri") {
      output = (
        await sql`select service_id from bus_calendar where friday = 1 limit 1`
      )[0].service_id;
    } else {
      output = (
        await sql`select service_id from bus_calendar where saturday = 1 limit 1`
      )[0].service_id;
    }

    sql.end();
    return output;
  } catch (e: any) {
    console.error(e);
    sql.end();
    backend.handleErrors(e, "database/service_id_today", "bus_database_status");
    return -1;
  }
}

async function rail_service_id_today(param_date: string) {
  let sql = postgres(database_user_pool_url);
  try {
    console.log(param_date);
    let date = new Date(Date.parse(param_date))
      .toLocaleDateString("af-ZA", {
        timeZone: "America/New_York",
        month: "2-digit",
        year: "numeric",
        day: "2-digit",
      })
      .replace(/-/g, "");
    console.log(`date ${date}`);
    let service_exception =
      await sql`select service_id from rail_calendar_dates where service_date = ${date} and exception_type = 1`;
    var output;
    console.log(service_exception);
    if (service_exception.length > 0) {
      sql.end();
      console.log(
        `service exception service_id=${service_exception[0].service_id} - ${date}`,
      );
      return service_exception.map((a: any) => a.service_id);
    }
    let day = new Date(Date.parse(param_date)).toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
    });

    console.log(day);

    if (day == "Sun") {
      output = (
        await sql`select service_id from rail_calendar where sunday = 1 limit 1`
      )[0].service_id;
    } else if (day == "Mon") {
      output = (
        await sql`select service_id from rail_calendar where monday = 1 limit 1`
      )[0].service_id;
    } else if (day == "Tue") {
      output = (
        await sql`select service_id from rail_calendar where tuesday = 1 limit 1`
      )[0].service_id;
    } else if (day == "Wed") {
      output = (
        await sql`select service_id from rail_calendar where wednesday = 1 limit 1`
      )[0].service_id;
    } else if (day == "Thu") {
      output = (
        await sql`select service_id from rail_calendar where thursday = 1 limit 1`
      )[0].service_id;
    } else if (day == "Fri") {
      output = (
        await sql`select service_id from rail_calendar where friday = 1 limit 1`
      )[0].service_id;
    } else {
      output = (
        await sql`select service_id from rail_calendar where saturday = 1 limit 1`
      )[0].service_id;
    }

    sql.end();
    return output;
  } catch (e: any) {
    console.error(e);
    sql.end();
    backend.handleErrors(e, "database/service_id_today", "bus_database_status");
    return -1;
  }
}

export async function get_bus_route_path(route: string){
let sql = postgres(database_user_pool_url);
  try {
    let output1:any = await sql`
        SELECT DISTINCT shape_id FROM bus_trips where  
        route_id = ${route} AND
        service_id IN ${sql(backend.fetch_status.bus_database_status.service_id)}`;

    let temp = []
    for (var t of output1){
      temp.push(t.shape_id)
    }
    //console.log(`${output1} --- ${temp}`)
    let output2 = await sql`
        SELECT * FROM bus_routes where route_id in ${sql(temp)}
        ORDER BY route_id, sequence_id asc`;
  //  console.log(`service_id = ${backend.fetch_status.bus_database_status.service_id}, output1 = ${output1}, output2 length=${output2.length}`)
    sql.end();
    return output2;
  } catch (e: any) {
    console.error(e);
    sql.end();
    return null;
  }
}

export async function get_bus_route_path_geojson(route: string){
let sql = postgres(database_user_pool_url);
  try {
    var output:any = {
      type: "FeatureCollection",
      name: '',
      features: [],
    }
    let output1:any = await sql`
        SELECT DISTINCT shape_id, trip_headsign FROM bus_trips where  
        route_id = ${route}`;

    let temp = []
    for (var t of output1){
      temp.push(t.shape_id)
    }
    let output2 = await sql`
        SELECT * FROM bus_routes where route_id in ${sql(temp)}
        ORDER BY route_id, sequence_id asc`;
    //console.log(`${output1} --- ${temp}`)
    for (var id of output1){
      let temp = output2.filter((x:any) => x.route_id == id.shape_id)
      var path: any = {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [],
          },
          properties: {
            type: "line",
            title: id.shape_id,
            description: id.trip_headsign,
          },
        };
      for (var coords of temp){
        path.geometry.coordinates.push([coords.lon, coords.lat]);
      }
      output.features.push(path)
    }
    
  //  console.log(`service_id = ${backend.fetch_status.bus_database_status.service_id}, output1 = ${output1}, output2 length=${output2.length}`)
    sql.end();
    return output;
  } catch (e: any) {
    console.error(e);
    sql.end();
    return null;
  }
}

export async function get_bus_route_stops(route: String){
  let sql = postgres(database_user_pool_url);
  try {
    let output:any = await sql`
    SELECT DISTINCT bus_stops.stop_id, bus_stops.stop_code, bus_stops.stop_name, direction_id, stop_sequence, trip_headsign, shape_id
    FROM bus_trips
    INNER JOIN bus_stop_times ON bus_stop_times.trip_id = bus_trips.trip_id
    INNER JOIN bus_stops ON bus_stops.stop_id = bus_stop_times.stop_id
    WHERE route_id = ${route}
    order by trip_headsign, shape_id,direction_id, stop_sequence;`;

    sql.end();
    return output;
  } catch (e: any) {
    console.error(e);
    sql.end();
    return null;
  }
}
export async function all_bus_routes(){
  let sql = postgres(database_user_pool_url);
  try {
    let output = await sql`
        SELECT * from bus_route_list`;
    // console.log(groupBy(output, "service_date"))
    sql.end();
    return output
    //setTimeout(get_train_schedule_today, 20000)
  } catch (e: any) {
    console.error(e);
    sql.end();
    //setTimeout(get_train_schedule_today, 20000)
    return [];
    // backend.handleErrors(e, "database/get_all_next_bus", "bus_database_status")
  }
}

export async function bus_routes_for_stop(stop: string){
  let sql = postgres(database_user_pool_url);
  try {
    let output = await sql`
        SELECT DISTINCT bus_trips.route_id, bus_route_list.short_name, bus_route_list.long_name, bus_route_list.color, bus_route_list.text_color
    FROM bus_trips
    INNER JOIN bus_stop_times ON bus_stop_times.trip_id = bus_trips.trip_id
    INNER JOIN bus_stops ON bus_stops.stop_id = bus_stop_times.stop_id
	  INNER JOIN bus_route_list ON bus_route_list.route_id = bus_trips.route_id
    WHERE bus_stops.stop_code = ${stop}`;
    // console.log(groupBy(output, "service_date"))
    sql.end();
    return output
    //setTimeout(get_train_schedule_today, 20000)
  } catch (e: any) {
    console.error(e);
    sql.end();
    //setTimeout(get_train_schedule_today, 20000)
    return [];
    // backend.handleErrors(e, "database/get_all_next_bus", "bus_database_status")
  }
}

export function validate_route_name(route:string){
  if(route.length != 3){
    return false
  }
  if(!["A","C","D","F","M","P"].includes(route[0])){
    return false
  }
  if(!["0","1","2","3","4","5","6","7","8","9"].includes(route[1])){
    return false
  }
  if(!["0","1","2","3","4","5","6","7","8","9","X"].includes(route[2])){
    return false
  }
  return true
}

export function validate_trip_id(route:string){
  if(!isNaN(parseInt(route))){
    return true
  }
  return false
}

//7 digit identifier for every bus stop
export function validate_stop_id(stop:string){
  if(!isNaN(parseInt(stop))){
    return true
  }
  return false
}

export function validate_date(year:string, month:string, day:string){
  if(!isNaN(parseInt(year)) && !isNaN(parseInt(month)) && !isNaN(parseInt(day))){
    if(year.length == 4 && month.length == 2 && day.length == 2){
      return true
    }
    else{
      return false
    }
  }
  return false
}