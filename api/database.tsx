const postgres = require('postgres')
const path = require('path');
require('dotenv').config({path: ".env"});
require('dotenv').config({path: path.resolve(__dirname,"../..",".env.local")});

export var sql = postgres(process.env.render_url, {ssl: process.env.enable_ssl == "1" ? true : false});

// Not in use. Database only stores bus information
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

// Not in use. Database only stores bus information
async function get_train_position_destinations(trains:any){
  let temp = trains.map((x:any) => {return x.vehicle.trip.tripId});
  return temp
}
export async function get_next_bus(stop_id: string){
  let start_time = new Date()
  let startTimestamp = start_time.getTime()
  let timeExtent = 45 * 60 * 1000
  let end_time = new Date(startTimestamp + timeExtent)

    return await sql`
    SELECT * FROM bus_stop_times where
    stop_code = ${stop_id} 
    ORDER BY departure_time`;
}