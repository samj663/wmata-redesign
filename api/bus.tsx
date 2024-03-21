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
  nextBus,
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
export var bus_route_list_special: any;
export var bus_alerts: any;
export var bus_schedule: ESMap<string, any[]> = new Map<string, any[]>();

/**
 * When this is 0, run api call instantly.
 * If its greater than 1, setTimeout by "x" milliseconds times the number of quene counter
 */
export var queueCounter: number = 0;

/**
 * Retrieves next bus information from provided stopID.
 * Note: Not in use. The rate limit of WMATA's api won't allow refreshing
 * data in a timely manner
 * @param stopID the id number of a stop
 * @returns "SUCCESS" if it ran successfully. "ERROR" otherwise
 */
export async function get_next_bus_data(stopID: string) {
  let time = Date.now();
  let s = bus_stops.get(stopID);
  if (s === undefined) return;
  if (s?.lastUpdated !== undefined && s?.lastUpdated !== null) {
    if (time - s.lastUpdated < 20000) return;
  }

  queueCounter++;
  await backend.delay(queueCounter * 100);

  try {
    var busResponse = await fetch(
      `https://api.wmata.com/NextBusService.svc/json/jPredictions?StopID=${stopID}&api_key=${key}`,
    );
    var rawBus = await busResponse.json();
    if (rawBus === undefined) {
      throw new Error("Proper data structure wasn't found within json file");
    }
    var stop = bus_stops.get(stopID);
    if (stop) {
      stop.nextBus = rawBus.Predictions;
      stop.lastUpdated = Date.now();
      queueCounter--;
      return "SUCCESS";
    }
  } catch (e: any) {
    backend.bootstrap_status.rail_alerts = "ERROR";
    console.log("---- ERROR has been caught. Check Log ----");
    console.log(e);
    var error: error_template = {
      timestamp: Date.now().toString(),
      function: "get_next_bus",
      error: e.message,
      trace: e.stack,
    };
    backend.error_log.push(error);
    return "ERROR";
  }
}
function compareTime(time2: string, time1:string){
  let array1 = time1.split(":")
  let array2 = time2.split(":")
  let output = [0,0,0]
  for(var i = 0; i < array1.length ; i++){
    output[i] = parseInt(array2[i]) - parseInt(array1[i]);
  }
  for(var i = 1; i < output.length ; i++){
    output[i] = output[i] +  (output[i - 1] * 60)
  }
  return Math.floor(output[2] / 60)
}

export async function get_next_bus_database(stopID: string) {
  
  let s = bus_stops.get(stopID);
  if (s === undefined) return;
  let newBuses:any[] = []
  var buses;
  if(bus_schedule.get(stopID) == undefined || bus_schedule.get(stopID) == null){
    buses = await database.get_next_bus(stopID)
    bus_schedule.set(stopID, buses)
    console.log("Updating buses: 1")
  }
  else{
    let time = Date.now()
    if (s.lastUpdated == null) {
      buses = await database.get_next_bus(stopID)
      bus_schedule.set(stopID, buses)
      console.log("Updating buses: 2")
    }
    else{
      if ((time - s.lastUpdated ) < 20000) {
        buses = bus_schedule.get(stopID)
      }
      else{
        buses = await database.get_next_bus(stopID)
        bus_schedule.set(stopID, buses)
        console.log("Updating buses: 3")
      }
    }
  }
  
  let current_date = new Date().toLocaleTimeString('it-IT').toString()
  for (const bus of buses) {
    let time = compareTime(bus.departure_time, current_date);
    if(time > 0 && time < 45)
    newBuses.push({
      RouteID: bus.route_id,
      Minutes: time,
      DirectionText: bus.headsign_direction,
      TripID: bus.trip_id,
      VehicleID: bus.vehicle_id
    })
  }
  var stop = bus_stops.get(stopID);
  if (stop) {
    stop.nextBus = newBuses
    stop.lastUpdated = Date.now();
    return "SUCCESS";
  }
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
      if (rawRoute.statusCode){
        if (rawRoute.statusCode == 429) console.log(rawRoute + route.RouteID);
      }
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
    console.log("---- ERROR has been caught. Check Log ----");
    console.log(e);
    var error: error_template = {
      timestamp: Date.now().toString(),
      function: "get_bus_routes",
      error: e.message,
      trace: e.stack,
    };
    backend.error_log.push(error);
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
        nextBus: null,
      };
      bus_stops.set(stop.StopID, temp);
    }
  } catch (e: any) {
    backend.bootstrap_status.bus_stops = "ERROR";
    console.log("---- ERROR has been caught. Check Log ----");
    console.log(e);
    var error: error_template = {
      timestamp: Date.now().toString(),
      function: "get_bus_stops",
      error: e.message,
      trace: e.stack,
    };
    backend.error_log.push(error);
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
    console.log("---- ERROR has been caught. Check Log ----");
    console.log(e);
    var error: error_template = {
      timestamp: Date.now().toString(),
      function: "get_nearest_bus_stops",
      error: e.message,
      trace: e.stack,
    };
    backend.error_log.push(error);
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
      //    console.log(entity.alert);
      entity.alert.informedEntity.forEach(function (e: any) {
        line.push(e.routeId);
      });

      //  console.log(entity.alert.headerText.translation[0].text)
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
    console.log("---- ERROR has been caught. Check Log ----");
    console.log(e);
    var error: error_template = {
      timestamp: Date.now().toString(),
      function: "get_rail_alerts_gtft_rt",
      error: e.message,
      trace: e.stack,
    };
    backend.error_log.push(error);
    setTimeout(get_bus_alerts_gtft_rt, 5000); // Timeout might occur that will stop function.
    return "ERROR";
  }
  bus_alerts = output;
  //  console.log(bus_alerts);
  setTimeout(get_bus_alerts_gtft_rt, 5000);
  return "SUCCESS";
}

export * from "./bus";
