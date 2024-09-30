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
const database_pool_url = `${process.env.digitalocean_pool_url}?ssl=require`;
const database_user_pool_url = `${process.env.digitalocean_user_pool_url}?ssl=require`;
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
