/**
 * This is the code that preprocesses data from WMATA's api and defines the endpoints for my own api.
 * @author Samuel Johnson
 */

import { ESMap } from "typescript";
const cliProgress = require('cli-progress');
import {busRoute, busStop, nextBus} from "./interfaces_and_classes"
const {default : fetch} = require('node-fetch');
const express = require('express')
const path = require('path');
require('dotenv').config({path: path.resolve(__dirname,"..",".env.local")});

const app = express()
app.use(express.static(path.join(__dirname, 'client/build')));

var key = process.env.WMATA_KEY
export var stops : ESMap<string, busStop>;
export var routes :ESMap<string, busRoute>;

/**
 * When this is 0, run api call instantly.
 * If its greater than 1, setTimeout by "x" milliseconds times the number of quene counter
 */
export var queueCounter: number = 0;

export async function get_next_bus_data(stopID: string){
    let time = Date.now()
    let s = stops.get(stopID)
    if(s?.lastUpdated !== undefined) {
      if(time - s.lastUpdated < 20000) return;
    }
   // console.log(stopID + " : " + queueCounter *1000);
    queueCounter++;
    await delay(queueCounter * 100)
    
    queueCounter++;
    try {
      var busResponse = await fetch(`https://api.wmata.com/NextBusService.svc/json/jPredictions?StopID=${stopID}&api_key=${key}`);
      var rawBus = await busResponse.json();
      if(rawBus === undefined){
          throw new Error("Proper data structure wasn't found within json file")
      }
      var stop = stops.get(stopID)
      if(stop){
        stop.nextBus = rawBus.Predictions
        stop.lastUpdated = Date.now();
      }
   //   console.log(stops.get(stopID))
 //     console.log(stopID + " : Done")
      return;
    } catch(e){
      console.log(e)
      if(busResponse === undefined){
        console.log(" NETWORK ERROR: Unable to get respomse ")
        return "ERROR"
      }
      else{
        console.log(busResponse.headers.get('date') + " --- Error getting new train data: "+ e)
        return "ERROR"
      }
    }
}

/**
 * Delays a function. Used to make sute rate limit isn't exceeded when calling WMATA's API.
 * @param millisec how long to delay the function in milliseconds.
 * @returns a promise
 */
export function delay(millisec:number) {
  return new Promise(resolve => {
    setTimeout(() => { resolve('') }, millisec);
  })
}

export async function get_bus_routes(){
  try{
    routes = new Map<string, busRoute>;
    var routesResponse = await fetch(`https://api.wmata.com/Bus.svc/json/jRoutes?api_key=${key}`);
    var rawBus = await routesResponse.json();
  //  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
 //   bar1.start(Object.keys(rawBus.Routes).length, 0);
    console.log("Caching bus routes...")
    for(const route of rawBus.Routes){
      var routeResponse = await fetch(`https://api.wmata.com/Bus.svc/json/jRouteDetails?RouteID=${route.RouteID}&api_key=${key}`);
      var rawRoute = await routeResponse.json()
      const temp : busRoute = {
        name: route.Name,
        description: route.LineDescription,
        lastUpdated: Date.now(),
        paths: rawRoute
      }
      routes.set(route.RouteID, temp);
  //    bar1.increment()
      await delay(100)
    }
 //   bar1.stop();
  } catch (e){
    console.log("Something went wrong caching bus routes")
    console.error(e)
    return "ERROR"
  }
  console.log("finished caching bus routes!");
  return "SUCCESS"
  console.log("------FINISHED-------")
}

export async function get_bus_stops(){
  try{
    stops = new Map<string, busStop>;
    var stopsResponse = await fetch(`https://api.wmata.com/Bus.svc/json/jStops?api_key=${key}`);
    var rawStops = await stopsResponse.json();
    console.log("Caching bus stops");
    for(const stop of rawStops.Stops){
      const temp : busStop={
        name: stop.Name,
        lat: stop.Lat,
        lon: stop.Lon,
        routes: stop.Routes,
        lastUpdated: undefined,
        nextBus:undefined
      }
      stops.set(stop.StopID, temp);
    }
  } catch(e){
    console.error(e);
    return "ERROR"
  }
  console.log("Bus stops cahced!")
  return "SUCCESS"
}

/*get_bus_stops().then(() =>{
  get_next_bus_data("1000031")
  get_next_bus_data("1000032")
  get_next_bus_data("1000033")
  get_next_bus_data("1000034")
  get_next_bus_data("1000035")
  get_next_bus_data("1000036")
  get_next_bus_data("1000037")
  get_next_bus_data("1000038")
  get_next_bus_data("1000039")
  get_next_bus_data("1000040")
})*/
//console.log(Date.now())

function getNextBus(){
  // Provide stopID
  // Check when next bus info on this stop was updated
  // If recent enough, send that data.
  // If not, push stop to queue. Wait to get the data.
}

export function get_bus_stop_info(id:string){
  return stops.get(id);
}
export function get_bus_route_info(route:string){
  return routes.get(route);
}
/**
 * Gets real time train predictions from WMATA's API
 * Will rerun every 10 seconds
 *
async function get_bus_data(stopID : number){
    let rawTrains;
	try {
		var trainResponse = await fetch(`GET https://api.wmata.com/NextBusService.svc/json/jPredictions?StopID=${stopID}?api_key=${key}`);
        rawTrains = await trainResponse.json();
        if(rawTrains === undefined){
            throw new Error("Proper data structure wasn't found within json file")
        }
        trains = parseTrains(rawTrains.Predictions)
    } catch(e){
      if(trainResponse === undefined){
        console.log(" NETWORK ERROR: Unable to get respomse ")
        return "ERROR"
      }
      else{
        console.log(trainResponse.headers.get('date') + " --- Error getting new train data: "+ e)
        return "ERROR"
      }
    }
    lastUpdated.next_train = trainResponse.headers.get('date');
 //   console.log(lastUpdated.next_train + " --- Got new train data")
    setTimeout(get_train_data, 10000);
    return "SUCCESS"
}*/

//get_bus_routes()
//get_bus_stops()
export * from "./bus"