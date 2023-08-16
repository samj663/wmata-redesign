/**
 * This is the code that preprocesses bus information from WMATA's api
 * @author Samuel Johnson
 */

import { ESMap } from "typescript";
import * as backend from "./backend"
const cliProgress = require('cli-progress');
import {busRoute, busStop, nextBus, error_template} from "./interfaces_and_classes"
const {default : fetch} = require('node-fetch');
const express = require('express')
const path = require('path');
require('dotenv').config({path: path.resolve(__dirname,"..",".env.local")});

const app = express()
app.use(express.static(path.join(__dirname, 'client/build')));

var key = process.env.WMATA_KEY
export var bus_stops : ESMap<string, busStop>;
export var bus_routes :ESMap<string, busRoute>;
export var bus_route_list : any;
export var bus_route_list_special : any;

/**
 * When this is 0, run api call instantly.
 * If its greater than 1, setTimeout by "x" milliseconds times the number of quene counter
 */
export var queueCounter: number = 0;

export async function get_next_bus_data(stopID: string){
  let time = Date.now()
  let s = bus_stops.get(stopID)
  if(s?.lastUpdated !== undefined && s?.lastUpdated !== null) {
    if(time - s.lastUpdated < 20000) return;
  }

  queueCounter++;
  await backend.delay(queueCounter * 100)

  try {
    var busResponse = await fetch(`https://api.wmata.com/NextBusService.svc/json/jPredictions?StopID=${stopID}&api_key=${key}`);
    var rawBus = await busResponse.json();
    if(rawBus === undefined){
        throw new Error("Proper data structure wasn't found within json file")
    }
    var stop = bus_stops.get(stopID)
    if(stop){
      stop.nextBus = rawBus.Predictions
      stop.lastUpdated = Date.now();
      queueCounter--;
      return "SUCCESS"
    }
  } catch(e:any){
      backend.bootstrap_status.rail_alerts = "ERROR"
      console.log("---- ERROR has been caught. Check Log ----")
      console.log(e)
      var error:error_template ={
          timestamp: Date.now().toString(),
          function: "get_next_bus",
          error: e.message,
          trace: e.stack
      }
      backend.error_log.push(error)
      return "ERROR"
  }
}

export async function get_bus_routes(){
  try{
    bus_routes = new Map<string, busRoute>;
    var routesResponse = await fetch(`https://api.wmata.com/Bus.svc/json/jRoutes?api_key=${key}`);
    var rawBus = await routesResponse.json();
    console.log("Caching bus routes...")
    bus_route_list = rawBus.Routes.filter((e:any)=>{
      if(e.RouteID.includes("*") || e.RouteID.includes("/")) return false;
      else return true;
    });

<<<<<<< HEAD
    await backend.delay(300)
=======
>>>>>>> e6bcdfd5a31abda072b4276b9480be337f6621de
    backend.bootstrap_status.bus_route_list = "SUCCESS"
    for(const route of rawBus.Routes){
      var routeResponse = await fetch(`https://api.wmata.com/Bus.svc/json/jRouteDetails?RouteID=${route.RouteID}&api_key=${key}`);
      var rawRoute = await routeResponse.json()
      if(rawRoute.statusCode) if(rawRoute.statusCode == 429) console.log(rawRoute);
      const temp : busRoute = {
        name: route.Name,
        description: route.LineDescription,
        lastUpdated: Date.now(),
        paths: rawRoute
      }
      bus_routes.set(route.RouteID, temp);
      await backend.delay(150)
    }
  } catch(e:any) {
    backend.bootstrap_status.bus_routes = "ERROR"
    backend.bootstrap_status.bus_route_list ="ERROR"
    console.log("---- ERROR has been caught. Check Log ----")
    console.log(e)
    var error:error_template ={
        timestamp: Date.now().toString(),
        function: "get_bus_routes",
        error: e.message,
        trace: e.stack
    }
    backend.error_log.push(error)
    return "ERROR"
}
  console.log("finished caching bus routes!");
  return "SUCCESS"
}

export async function get_bus_stops(){
  try{
    bus_stops = new Map<string, busStop>;
    var stopsResponse = await fetch(`https://api.wmata.com/Bus.svc/json/jStops?api_key=${key}`);
    var rawStops = await stopsResponse.json();
    console.log("Caching bus stops");
    for(const stop of rawStops.Stops){
      const temp : busStop={
        name: stop.Name,
        lat: stop.Lat,
        lon: stop.Lon,
        routes: stop.Routes,
        lastUpdated: null,
        nextBus: null
      }
      bus_stops.set(stop.StopID, temp);
    }
  } catch(e:any){
    backend.bootstrap_status.bus_stops = "ERROR"
    console.log("---- ERROR has been caught. Check Log ----")
    console.log(e)
    var error:error_template ={
        timestamp: Date.now().toString(),
        function: "get_bus_stops",
        error: e.message,
        trace: e.stack
    }
    backend.error_log.push(error)
    return "ERROR"
}
  console.log("Bus stops cached!")
  return "SUCCESS"
}

export * from "./bus"