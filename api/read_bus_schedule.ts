const postgres = require("postgres");
const path = require("path");
require("dotenv").config({ path: ".env" });
require("dotenv").config({
  path: path.resolve(__dirname, "../..", ".env.local"),
});
const GtfsRealtimeBindings = require("gtfs-realtime-bindings");
const fs = require("fs");
//const decompress = require("decompress");
var AdmZip = require("adm-zip");
const { default: fetch } = require("node-fetch");
const url = `${process.env.digitalocean_url}?ssl=require`; // PRODUCTION DB
//const url = `${process.env.digitalocean_testing_url}?ssl=require`; // TEST DB
//read_bus_schedule_new();

//get_static_data(`https://api.wmata.com/gtfs/rail-gtfs-static.zip?api_key=${process.env.WMATA_KEY}`,"./static_rail");
//get_static_data(`https://api.wmata.com/gtfs/bus-gtfs-static.zip?api_key=${process.env.WMATA_KEY}`, "./static_bus/_test")

async function get_static_data(req: any, folder_name: any) {
  console.info("Fetching Data...");
  const res = await fetch(req);
  var blob = await res.arrayBuffer();
  var b = Buffer.from(blob);
  console.info("Unzipping file...");
  //await decompress(b, folder_name);
  var zip = new AdmZip(b);
  zip.extractAllTo(folder_name, true);
  console.info("Unzipped file!");
}

async function create_tables() {
  let sql = postgres(url);

  await sql`
  CREATE TABLE IF NOT EXISTS bus_trips(
    route_id varchar,
      service_id int,
      trip_id varchar,
      trip_headsign varchar,
      direction_id int,
      vehicle_id int,
      delay int,
      PRIMARY KEY (trip_id)
  );`;
  await sql`
  CREATE TABLE IF NOT EXISTS bus_stops(
      stop_id varchar,
      stop_code varchar (7),
      stop_name varchar,
      lat float,
      lon float,
      PRIMARY KEY (stop_id)
  );`;
  await sql`

  CREATE TABLE IF NOT EXISTS bus_stop_times (
      trip_id varchar ,
      departure_time varchar,
      stop_id varchar,
      stop_sequence int,
      PRIMARY KEY (trip_id,stop_sequence)
  );`;
  await sql`

  CREATE TABLE IF NOT EXISTS bus_calendar_dates(
      service_id int,
      service_date varchar(8),
      exception_type int,
      PRIMARY KEY (service_id, service_date));`;
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

  await sql`TRUNCATE TABLE bus_trips CASCADE;`;
  await sql`TRUNCATE TABLE bus_stops CASCADE;`;
  await sql`TRUNCATE TABLE bus_stop_times CASCADE;`;
  await sql`TRUNCATE TABLE bus_calendar_dates CASCADE;`;
  await sql`TRUNCATE TABLE bus_calendar CASCADE;`;

  sql.end();
}

export async function read_bus_schedule_new() {
  let date = new Date();
  console.log(
    date.toLocaleString("it-IT", { timeZone: "America/New_York" }).toString() +
      " -- Starting bus schedule update...",
  );
  await get_static_data(
    `https://api.wmata.com/gtfs/bus-gtfs-static.zip?api_key=${process.env.WMATA_KEY}`,
    "./static_bus/",
  );

  let sql = postgres(url);

  //Check if fetched gtfs data is new
  let dates = await sql`select * from bus_feed_info`;

  var content = await fs.readFileSync("./static_bus/feed_info.txt", "utf8");
  var s = content.split("\n");
  var e = s.shift().split(",");

  let new_dates = s[0].split(",");
  //console.log(new_dates)
  //console.log(dates)
  let flush_vehicle_id = await sql`update bus_trips set vehicle_id=-1`;
  console.log(`Flushed vehicle_id`);
   const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
  );

  console.log(
    `TODAY: ${parseInt(`${now.getFullYear()}${((now.getMonth() + 1) < 10 ? '0' : '') + (now.getMonth() + 1)}${(now.getDate() < 10 ? '0' : '') + now.getDate()}`)} --- Downloaded Bus Schedule: ${new_dates[3]} to ${new_dates[4]} --- Current Bus Schedule: ${dates[0].start_date} to ${dates[0].end_date}`,
  );
  
  if (
    new_dates[3] == dates[0].start_date &&
    new_dates[4] == dates[0].end_date
  ) {
    console.info("INFO: Checked GTFS bus schedule. No date change found.");
    sql.end();
    return;
  } else if((parseInt(`${now.getFullYear()}${((now.getMonth() + 1) < 10 ? '0' : '') + (now.getMonth() + 1)}${(now.getDate() < 10 ? '0' : '') + now.getDate()}`)) < new_dates[3]){
    console.info(`INFO: Checked GTFS bus schedule. New schedule found but not in effect. TODAY: ${now.getFullYear()}${((now.getMonth() + 1) < 10 ? '0' : '') + (now.getMonth() + 1)}${(now.getDate() < 10 ? '0' : '') + now.getDate()}`);
    sql.end();
    return;
  } else { 
    console.warn(
      "WARNING: Checked GTFS bus schedule. Date change found. Updating bus database.",
    );
    await sql`TRUNCATE TABLE bus_trips CASCADE;`;
    await sql`TRUNCATE TABLE bus_stops CASCADE;`;
    await sql`TRUNCATE TABLE bus_stop_times CASCADE;`;
    await sql`TRUNCATE TABLE bus_calendar_dates CASCADE;`;
    await sql`TRUNCATE TABLE bus_calendar CASCADE;`;
    await sql`TRUNCATE TABLE bus_routes CASCADE;`;
    await sql`TRUNCATE TABLE bus_route_list CASCADE;`;
    sql.end();
  }
 // sql.end();
  // await create_tables();
  var content = await fs.readFileSync("./static_bus/stops.txt", "utf8");
  var s = content.split("\n");
  var e = s.shift().split(",");

  let count = 0;
  var rows_entered = 0;
  var trips: object[] = [];
  var stops: object[] = [];
  var stop_times: object[] = [];
  var calendar_dates: object[] = [];
  var calendar: object[] = [];
  var routes: object[] = [];
  var route_list: object[] = [];
  var stops: object[] = [];
  for (const e of s) {
    let val = e.split(",");
    if (val[1] == undefined) continue;
    stops.push({
      stop_id: val[0],
      stop_code: val[1],
      stop_name: val[2],
      lat: parseFloat(val[4]),
      lon: parseFloat(val[5]),
    });
    count += 1;
    rows_entered += 1;
    if (count == 10000) {
      let sql = postgres(url);
      await sql` insert into bus_stops ${sql(stops)} ON CONFLICT DO NOTHING`;

      //rows_entered += 10000
      //console.log("Added stops data: ", rows_entered)
      count = 0;
      stops = [];
      sql.end();
    }
  }
  if (count > 0) {
    let sql = postgres(url);
    await sql` insert into bus_stops ${sql(stops)} ON CONFLICT DO NOTHING`;

    console.log("Added final stops data: ", rows_entered);
    count = 0;
    stops = [];
    sql.end();
  }

content = await fs.readFileSync("./static_bus/routes.txt", "utf8"); //Route list
  s = content.split("\n");
  e = s.shift().split(",");
  rows_entered = 0;
  for (const e of s) {
    let val = e.split(",");
    if (val[1] == undefined) continue;
    route_list.push({
      route_id: val[0],
      short_name: val[2],
      long_name: val[3],
      color: val[7],
      text_color: val[8]
    });
    count += 1;
    rows_entered += 1;
  }
  if (count > 0) {
    let sql = postgres(url);
    
    await sql` insert into bus_route_list ${sql(route_list)} ON CONFLICT DO NOTHING`;
    console.log("Added final trips data: ", rows_entered);
    count = 0;
    trips = [];
    sql.end();
  }

  content = await fs.readFileSync("./static_bus/trips.txt", "utf8");
  s = content.split("\n");
  e = s.shift().split(",");
  rows_entered = 0;
  for (const e of s) {
    let val = e.split(",");
    if (val[1] == undefined) continue;
    trips.push({
      route_id: val[0],
      service_id: val[1],
      trip_id: val[2],
      trip_headsign: val[3],
      direction_id: parseInt(val[4]),
      vehicle_id: -1,
      delay: 0,
      shape_id: val[6]
    });
    count += 1;
    rows_entered += 1;
    if (count == 8000) {
      let sql = postgres(url);
      await sql` insert into bus_trips ${sql(trips)} ON CONFLICT DO NOTHING`;
      //rows_entered += 92000
      //console.log("Added trips data: ", rows_entered)
      count = 0;
      trips = [];
      sql.end();
    }
  }
  if (count > 0) {
    let sql = postgres(url);
    await sql` insert into bus_trips ${sql(trips)} ON CONFLICT DO NOTHING`;
    console.log("Added final trips data: ", rows_entered);
    count = 0;
    trips = [];
    sql.end();
  }

  try {
    content = await fs.readFileSync("./static_bus/calendar_dates.txt", "utf8");
    s = content.split("\n");
    e = s.shift().split(",");
    rows_entered = 0;
    for (const e of s) {
      let val = e.split(",");
      if (val[1] == undefined) continue;
      calendar_dates.push({
        service_id: val[0],
        service_date: val[1],
        exception_type: val[2],
      });
      count += 1;
      rows_entered += 1;
      if (count == 10000) {
        let sql = postgres(url);
        await sql` insert into bus_calendar_dates ${sql(calendar_dates)} ON CONFLICT DO NOTHING`;

        //rows_entered += 10000
        //console.log("Added calendar_dates data: ", rows_entered)
        count = 0;
        calendar_dates = [];
        sql.end();
      }
    }
    if (count > 0) {
      let sql = postgres(url);
      await sql` insert into bus_calendar_dates ${sql(calendar_dates)} ON CONFLICT DO NOTHING`;

      console.log("Added calendar_dates data: ", rows_entered);
      count = 0;
      calendar_dates = [];
      sql.end();
    }
  } catch (e: any) {
    console.error("WARNING: bus_calendar_dates.txt is missing");
  }
  try {
    content = await fs.readFileSync("./static_bus/calendar.txt", "utf8");
    s = content.split("\n");
    e = s.shift().split(",");
    rows_entered = 0;
    for (const e of s) {
      let val = e.split(",");
      if (val[1] == undefined) continue;
      calendar.push({
        service_id: val[0],
        monday: val[1],
        tuesday: val[2],
        wednesday: val[3],
        thursday: val[4],
        friday: val[5],
        saturday: val[6],
        sunday: val[7],
        start_date: val[8],
        end_date: val[9],
      });
      count += 1;
      rows_entered += 1;
      if (count == 10000) {
        let sql = postgres(url);
        await sql` insert into bus_calendar ${sql(calendar)} ON CONFLICT DO NOTHING`;

        //rows_entered += 10000
        //console.log("Added calendar data: ", rows_entered)
        count = 0;
        calendar = [];
        sql.end();
      }
    }
    if (count > 0) {
      let sql = postgres(url);
      await sql` insert into bus_calendar ${sql(calendar)} ON CONFLICT DO NOTHING`;

      console.log("Added calendar data: ", rows_entered);
      count = 0;
      calendar = [];
      sql.end();
    }
  } catch (e: any) {
    console.error("WARNING: bus_calendar.txt is missing");
  }

  try {
    console.log("STARTING SHAPES")
    content = await fs.readFileSync("./static_bus/shapes.txt", "utf8");
    console.log("SHAPESDS")
    s = content.split("\n");
    e = s.shift().split(",");
    rows_entered = 0;
    for (const e of s) {
      let val = e.split(",");
      if (val[0] == undefined || val[1] == undefined || val[2] == undefined || val[3] == undefined) continue;
      routes.push({
        route_id: val[0],
        lat: parseFloat(val[1]),
        lon: parseFloat(val[2]),
        sequence_id: parseInt(val[3]),
      });
      //console.log(val)
      count += 1;
      rows_entered += 1;
      if (count == 10000) {
        let sql = postgres(url);
        await sql` insert into bus_routes ${sql(routes)} ON CONFLICT DO NOTHING`;

        //rows_entered += 10000
        //console.log("Added routes data: ", rows_entered)
        count = 0;
        routes = [];
        sql.end();
      }
    }
    if (count > 0) {
      let sql = postgres(url);
      await sql` insert into bus_routes ${sql(routes)} ON CONFLICT DO NOTHING`;

      console.log("Added shapes data: ", rows_entered);
      count = 0;
      routes = [];
      sql.end();
    }
  } catch (e: any) {
    console.error(e);
  }

  /* let sql = postgres(url);
    let t = await sql`TRUNCATE bus_stop_times CASCADE`
    sql.end()*/

  content = await fs.readFileSync("./static_bus/stop_times.txt", "utf8");
  s = content.split("\n");
  e = s.shift().split(",");
  rows_entered = 0;
  for (const e of s) {
    let val = e.split(",");
    if (val[1] == undefined) continue;
    stop_times.push({
      trip_id: val[0],
      departure_time: val[2].length == 7 ? "0" + val[2] : val[2],
      stop_id: val[3],
      stop_sequence: val[4],
    });
    count += 1;
    rows_entered += 1;
    if (count == 10000) {
      let sql = postgres(url);
      await sql` insert into bus_stop_times ${sql(stop_times)} ON CONFLICT DO NOTHING`;

      //rows_entered += 10000
      //console.log("Added stop_times data: ", rows_entered)
      count = 0;
      stop_times = [];
      sql.end();
    }
  }
  if (count > 0) {
    let sql = postgres(url);
    await sql` insert into bus_stop_times ${sql(stop_times)} ON CONFLICT DO NOTHING`;

    count = 0;
    stop_times = [];
    sql.end();
    console.log("Added final stop_times data: ", rows_entered);
  }
  let psql = postgres(url);
  await psql`TRUNCATE bus_feed_info CASCADE`;
  await psql`insert into bus_feed_info values (${new_dates[3]},${new_dates[4]})`;
  psql.end();
  console.info("INFO: Finished updating bus database");
}
