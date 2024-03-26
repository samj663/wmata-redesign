/**
 * This is the code that preprocesses bus information from WMATA's api
 * @author Samuel Johnson
 */

import { ESMap } from "typescript";
import * as backend from "./backend";
import * as database from "./database";
import {
  busRoute,
  busStop,
  error_template,
} from "./interfaces_and_classes";
const { default: fetch } = require("node-fetch");
const express = require("express");
const path = require("path");
var GtfsRealtimeBindings = require("gtfs-realtime-bindings");

require("dotenv").config({
  path: path.resolve(__dirname, "../..", ".env.local"),
});

const app = express();
app.use(express.static(path.join(__dirname, "client/build")));

var key = process.env.WMATA_KEY;
export var bus_stops: ESMap<string, busStop>;
export var bus_routes: ESMap<string, busRoute>;
export var bus_route_list: any;
export var bus_alerts: any;

function compareTime(time2: string, time1:string){
  let array1 = time1.split(":")
  let array2 = time2.split(":")
  if((parseInt(array2[0]) - 24 ) >= parseInt(array1[0])){
    array2[0] = (parseInt(array2[0]) - 24 ).toString()
  }
  let output = [0,0,0]
  for(var i = 0; i < array1.length ; i++){
    output[i] = parseInt(array2[i]) - parseInt(array1[i]);
  }
  for(var i = 1; i < output.length ; i++){
    output[i] = output[i] +  (output[i - 1] * 60)
  }
  return Math.floor(output[2] / 60)
}
  
export async function update_bus_data() {
  let timestamp = Date.now()
  try{
    let buses = await database.get_all_next_bus()
   // console.log(buses.length)
    if(buses.length > 0){
      var current_stop = buses[0].stop_code
      var current_array: any[] = []
      let current_date = new Date().toLocaleTimeString('it-IT',{timeZone: 'America/New_York'}).toString()
      for (const bus of buses) {
        if(bus.stop_code !== current_stop){
          var stop = bus_stops.get(current_stop);
          if (stop) {
            stop.nextBus = Array.from(current_array)
            stop.lastUpdated = timestamp;
          }
          current_stop = bus.stop_code
          current_array = []
        }
        let time = compareTime(bus.departure_time, current_date);
        if(time <= 0) time = 0
        current_array.push({
          RouteID: bus.route_id,
          Minutes: time,
          DirectionText: bus.trip_headsign ? bus.trip_headsign : "",
          TripID: bus.trip_id,
          VehicleID: bus.vehicle_id
        })
      }
    }
    console.log(`Updated Next Bus Info -- Fetched: ${buses.length} items`)
  } catch(e: any) {
    //console.log("---- ERROR has been caught. Check Log ----");
    console.error(e);
    /*var error: error_template = {
      timestamp: Date.now().toString(),
      function: "update_bus_data",
      error: e.message,
      trace: e.stack,
    };
    backend.error_log.push(error);*/
  }
  setTimeout(update_bus_data, 20000);
}

export async function get_bus_routes() {
  try {
    bus_routes = new Map<string, busRoute>();
    var routesResponse = await fetch(
      `https://api.wmata.com/Bus.svc/json/jRoutes?api_key=${key}`,
    );
    var rawBus = await routesResponse.json();
    console.log("Caching bus routes...");
    bus_route_list = rawBus.Routes.filter((e: any) => {
      if (e.RouteID.includes("*") || e.RouteID.includes("/")) return false;
      else return true;
    });

    await backend.delay(5000);
    backend.bootstrap_status.bus_route_list = "SUCCESS";
    for (const route of rawBus.Routes) {
      var routeResponse = await fetch(
        `https://api.wmata.com/Bus.svc/json/jRouteDetails?RouteID=${route.RouteID}&api_key=${key}`,
      );
      var rawRoute = await routeResponse.json();
      const temp: busRoute = {
        name: route.Name,
        description: route.LineDescription,
        lastUpdated: Date.now(),
        paths: rawRoute,
      };
      bus_routes.set(route.RouteID, temp);
      await backend.delay(250);
    }
  } catch (e: any) {
    backend.bootstrap_status.bus_routes = "ERROR";
    backend.bootstrap_status.bus_route_list = "ERROR";
    console.error(e);
    return "ERROR";
  }
  console.log("finished caching bus routes!");
  return "SUCCESS";
}

export async function get_bus_stops() {
  try {
    bus_stops = new Map<string, busStop>();
    var stopsResponse = await fetch(
      `https://api.wmata.com/Bus.svc/json/jStops?api_key=${key}`,
    );
    var rawStops = await stopsResponse.json();
    console.log("Caching bus stops");
    for (const stop of rawStops.Stops) {
      const temp: busStop = {
        name: stop.Name,
        lat: stop.Lat,
        lon: stop.Lon,
        routes: stop.Routes,
        lastUpdated: null,
        nextBus: [],
      };
      bus_stops.set(stop.StopID, temp);
    }
  } catch (e: any) {
    backend.bootstrap_status.bus_stops = "ERROR";
    console.error(e);
    return "ERROR";
  }
  console.log("Bus stops cached!");
  return "SUCCESS";
}

export function get_nearest_bus_stops(lat: number, lon: number, radius: number) {
  var output:any = []
  try {
    bus_stops.forEach((value, key) =>{
      var d = distance(lat, value.lat, lon, value.lon)
      if(d < radius){
        output.push({
          id: key,
          name: value.name,
          lat: value.lat,
          lon: value.lon,
          distance: d
        })
      }
    })
  } catch (e: any) {
    console.error(e);
  }
  return output;
}
function distance(lat1: number, lat2: number, lon1:number, lon2:number){
  lon1 =  lon1 * Math.PI / 180;
  lon2 = lon2 * Math.PI / 180;
  lat1 = lat1 * Math.PI / 180;
  lat2 = lat2 * Math.PI / 180;

  // Haversine formula 
  let dlon = lon2 - lon1; 
  let dlat = lat2 - lat1;
  let a = Math.pow(Math.sin(dlat / 2), 2)
  + Math.cos(lat1) * Math.cos(lat2)
  * Math.pow(Math.sin(dlon / 2),2);

  let c = 2 * Math.asin(Math.sqrt(a));
  let r = 6371;

  return(c * r);
}

export async function get_bus_alerts_gtft_rt() {
  var output: any = [];
  try {
    const res = await fetch(
      `https://api.wmata.com/gtfs/bus-gtfsrt-alerts.pb?api_key=${key}`,
    );
    var b = Buffer.from(await res.arrayBuffer());
    var feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(b);
    feed.entity.forEach(function (entity: any) {
      let line: any = []; //entity.alert.informedEntity[0].routeId
      entity.alert.informedEntity.forEach(function (e: any) {
        line.push(e.routeId);
      });

      output.push({
        alertId: entity.id,
        line: line,
        cause: entity.alert.cause,
        effect: entity.alert.effect,
        headerText: entity.alert.headerText.translation[0].text,
        descriptionText: entity.alert.descriptionText.translation[0].text,
      });
    });
    backend.lastUpdated.alerts = feed.header.timestamp;
  } catch (e: any) {
    backend.bootstrap_status.train_positions = "ERROR";
    console.error(e);
    setTimeout(get_bus_alerts_gtft_rt, 5000); // Timeout might occur that will stop function.
    return "ERROR";
  }
  bus_alerts = output;
  setTimeout(get_bus_alerts_gtft_rt, 5000);
  return "SUCCESS";
}

export * from "./bus";
