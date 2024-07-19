const postgres = require('postgres')
const path = require('path');
require("dotenv").config({ path: ".env" });
require("dotenv").config({
  path: path.resolve(__dirname, "../..", ".env.local"),
});
//const GtfsRealtimeBindings = require("gtfs-realtime-bindings");
const fs = require("fs");
//const decompress = require("decompress");
var AdmZip = require("adm-zip");
const { default: fetch } = require("node-fetch");
const url =`${process.env.digitalocean_url}?ssl=require`

read_rail_schedule();

//get_static_data(`https://api.wmata.com/gtfs/rail-gtfs-static.zip?api_key=${process.env.WMATA_KEY}`,"./static_rail");
//get_static_data(`https://api.wmata.com/gtfs/bus-gtfs-static.zip?api_key=${process.env.WMATA_KEY}`, "./static_bus_test")

async function get_static_data(req:any, folder_name:any) {
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

async function create_tables(){
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
      PRIMARY KEY (service_id, service_date));`

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

  await sql`TRUNCATE TABLE bus_trips CASCADE;`
  await sql`TRUNCATE TABLE bus_stops CASCADE;`
  await sql`TRUNCATE TABLE bus_stop_times CASCADE;`
  await sql`TRUNCATE TABLE bus_calendar_dates CASCADE;`
  await sql`TRUNCATE TABLE bus_calendar CASCADE;`

  sql.end()
}

export async function read_rail_schedule() {
  let date = new Date()
  console.log(date.toLocaleString('it-IT',{timeZone: 'America/New_York'}).toString() + " -- Starting rail schedule update...")
  await get_static_data(`https://api.wmata.com/gtfs/rail-gtfs-static.zip?api_key=${process.env.WMATA_KEY}`,"./static_rail");

  let sql = postgres(url);

  //Check if fetched gtfs data is new
  let dates = await sql`select * from rail_feed_info`
 
  var content = await fs.readFileSync("./static_rail/feed_info.txt", "utf8");
  var s = content.split("\n");
  var e = s.shift().split(",");
  
  let new_dates = s[0].split(",");
  //console.log(new_dates)
  //console.log(dates)
  
 if(new_dates[3] == dates[0].start_date && new_dates[4] == dates[0].end_date){
    console.log("NOTICE: Checked GTFS rail schedule. No date change found.")
    sql.end()
    return
  }
  else{
    console.warn("WARNING: Checked GTFS rail schedule. Date change found. Updating bus database.")
    
    await sql`TRUNCATE TABLE rail_trips CASCADE;`
  await sql`TRUNCATE TABLE rail_stops CASCADE;`
  await sql`TRUNCATE TABLE rail_stop_times CASCADE;`
  await sql`TRUNCATE TABLE rail_calendar_dates CASCADE;`
  await sql`TRUNCATE TABLE rail_calendar CASCADE;`
  await sql`TRUNCATE TABLE rail_fare_leg_rules CASCADE;`
  sql.end()
   // sql.end()
  }
  //await create_tables();
  //let sql = postgres(url);
  

  var content = await fs.readFileSync("./static_rail/stops.txt", "utf8");
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
      let val = e.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
     // console.log(val)
      if(val[1] == undefined) continue
      stops.push({
        stop_id: val[0],
        stop_name: val[1],
        stop_desc: val[2],
        lat: parseFloat(val[3]),
        lon: parseFloat(val[4]),
        zone_id: val[5],
        location_type: val[6],
        parent_station: val[7],
        level_id: val[9]

      })
      count += 1
      rows_entered +=1
      if (count == 5000) {
        let sql = postgres(url);
        await sql` insert into rail_stops ${sql(stops)} ON CONFLICT DO NOTHING`;
        
        //rows_entered += 5000
        //console.log("Added stops data: ", rows_entered)
        count = 0;
        stops = [];
        sql.end()
      }
    }
    if (count > 0) {
      let sql = postgres(url);
      await sql` insert into rail_stops ${sql(stops)} ON CONFLICT DO NOTHING`;
      
      console.log("Added final stops data: ", rows_entered)
      count = 0;
      stops = [];
      sql.end()
    }
  
    try{
      content = await fs.readFileSync("./static_rail/fare_leg_rules.txt", "utf8");
      s = content.split("\n");
      e = s.shift().split(",");
      rows_entered = 0
      for (const e of s) {
        let val = e.split(",");
        if(val[1] == undefined) continue
      //  console.log(val)
        stop_times.push({
          from_area: val[1],
          to_area : val[2],
          fare_product_id: val[3],
          from_timeframe_group_id: val[4],
          to_timeframe_group_id : val[5],
        })
        count += 1
        rows_entered +=1
        if (count == 10000) {
          let sql = postgres(url);
          await sql` insert into rail_fare_leg_rules ${sql(stop_times)} ON CONFLICT DO NOTHING`;
          
          //rows_entered += 10000
          //console.log("Added rail_fare_leg_rules data: ", rows_entered)
          count = 0;
          stop_times = [];
          sql.end()
        }
      }
      if (count > 0) {
        let sql = postgres(url);
        await sql` insert into rail_fare_leg_rules ${sql(stop_times)} ON CONFLICT DO NOTHING`;
      
        console.log("Added final rail_fare_leg_rules data: ", rows_entered)
        count = 0;
        stop_times = [];
        sql.end()
      }
    } catch (e:any){
      console.error("ERROR: Error parsing fare_leg_rules.txt - " + e.message)
    }




    content = await fs.readFileSync("./static_rail/trips.txt", "utf8");
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
        scheduled_trip_id: val[7],
        train_id: val[8]
      })
      count += 1
      rows_entered +=1
      if (count == 9200) {
        let sql = postgres(url);
        await sql` insert into rail_trips ${sql(trips)} ON CONFLICT DO NOTHING`;
        //rows_entered += 9200
        //console.log("Added trips data: ", rows_entered)
        count = 0;
        trips = [];
        sql.end()
      }
    }
    if (count > 0) {
      let sql = postgres(url);
      await sql` insert into rail_trips ${sql(trips)} ON CONFLICT DO NOTHING`;
      console.log("Added final trips data: ", rows_entered)
      count = 0;
      trips = [];
      sql.end()
    }

    try{
    content = await fs.readFileSync("./static_rail/calendar_dates.txt", "utf8");
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
      rows_entered +=1
      if (count == 10000) {
        let sql = postgres(url);
        await sql` insert into rail_calendar_dates ${sql(calendar_dates)} ON CONFLICT DO NOTHING`;
        
        //rows_entered += 10000
        //console.log("Added calendar_dates data: ", rows_entered)
        count = 0;
        calendar_dates = [];
        sql.end()
      }
    }
    if (count > 0) {
      let sql = postgres(url);
      await sql` insert into rail_calendar_dates ${sql(calendar_dates)} ON CONFLICT DO NOTHING`;
      
      console.log("Added calendar_dates data: ", rows_entered)
      count = 0;
      calendar_dates = [];
      sql.end()
    }
}catch(e:any){
    console.error("WARNING: rail_calendar_dates.txt is missing")
}
  
    try{
      content = await fs.readFileSync("./static_rail/calendar.txt", "utf8");
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
        rows_entered +=1
        if (count == 10000) {
          let sql = postgres(url);
          await sql` insert into rail_calendar ${sql(calendar)} ON CONFLICT DO NOTHING`;
          
          //rows_entered += 10000
          //console.log("Added calendar data: ", rows_entered)
          count = 0;
          calendar_dates = [];
          sql.end()
        }
      }
      if (count > 0) {
        let sql = postgres(url);
        await sql` insert into rail_calendar ${sql(calendar)} ON CONFLICT DO NOTHING`;
        
        console.log("Added calendar data: ", rows_entered)
        count = 0;
        calendar_dates = [];
        sql.end()
      }
    } catch (e:any){
      console.error("ERROR: Error parsing calendar.txt - " + e.message)
    }

   /* let sql = postgres(url);
    let t = await sql`TRUNCATE bus_stop_times CASCADE`
    sql.end()*/

    content = await fs.readFileSync("./static_rail/stop_times.txt", "utf8");
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
      rows_entered +=1
      if (count == 10000) {
        let sql = postgres(url);
        await sql` insert into rail_stop_times ${sql(stop_times)} ON CONFLICT DO NOTHING`;
        
        //rows_entered += 10000
       // console.log("Added stop_times data: ", rows_entered)
        count = 0;
        stop_times = [];
        sql.end()
      }
    }
    if (count > 0) {
      let sql = postgres(url);
      await sql` insert into rail_stop_times ${sql(stop_times)} ON CONFLICT DO NOTHING`;
     
      console.log("Added final stop_times data: ", rows_entered)
      count = 0;
      stop_times = [];
      sql.end()
    }
    
    let psql = postgres(url);
    await psql`TRUNCATE rail_feed_info CASCADE`
    await psql`insert into rail_feed_info values (${new_dates[3]},${new_dates[4]})`
    psql.end()
    console.log("NOTICE: Finished updating rail database")

   /* const columns =
    ["trip_id",
    "departure_time",
    "stop_id",
    "stop_sequence"].map(columnName =>
        stop_times.map(row => row[columnName])
    );
    let psql = postgres(url);
  await psql`
    INSERT INTO test_table (trip_id, departure_time, stop_id,stop_sequence)
    SELECT * FROM UNNEST ($1, $2, $3, $4) AS 
`, columns*/

  }