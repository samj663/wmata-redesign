/**
 * This is the code that preprocesses data from WMATA's api and defines the endpoints for my own api.
 * @author Samuel Johnson
 */

//import * as bus from "./bus"
import { ESMap } from "typescript";
///const cliProgress = require('cli-progress');
import {stationCodeNameMap, train, fares, entrance, station, busStop, busRoute, error_template} from "./interfaces_and_classes"
const {default : fetch} = require('node-fetch');
//const express = require('express')
const path = require('path');
//const app = express()

require('dotenv').config({path: path.resolve(__dirname,"..",".env.local")});
//app.use(express.static(path.join(__dirname, 'client/build')));

var key = process.env.WMATA_KEY
export var stationNames : stationCodeNameMap;
export var trains : ESMap<string, train[]>;
export var stations: ESMap<string, station>;
export var railAlerts: any;
export var error_log :error_template[] = []

export var lastUpdated = {
    next_train: null, 
    stations_fares_entrances: null, 
    alerts: null};

export var bootstrap_status = { 
    bus_routes: "RUNNING",
    bus_stops: "RUNNING",
    rail_stations: "RUNNING",
    next_train: "RUNNING",
    stations_fares_entrances: "RUNNING",
    rail_alerts: "RUNNING"
};

/**
 * Starts up backend system and manage when to get next arrival data
 */
export async function main(){
    
    var status1 = await get_data();
    bootstrap_status.rail_stations = status1
    if(status1 === "ERROR"){
        console.log("Retrying fetching station, fare, and entrance data in 5 seconds")
        setTimeout(()=>{get_data}, 5000)
    }
    var status2 = await get_train_data();
    if(status2 === "ERROR"){
        console.log("Retrying fetching train data in 5 seconds")
        setTimeout(get_train_data, 5000)
    }
    var status3 = await get_rail_alerts();
    if(status3 === "ERROR"){
        console.log("Retrying fetching train alerts data in 5 seconds")
        setTimeout(get_rail_alerts, 5000)
    }

    bootstrap_bus_stops();
    bootstrap_bus_routes();
}

export async function bootstrap_bus_stops(){
    bootstrap_status.bus_stops = "RUNNING"
    var status = await get_bus_stops()
    bootstrap_status.bus_stops = status

    if(status ==="ERROR"){
        console.log("Bus stop caching ran into Error. Trying again in 10 seconds")
        setTimeout(bootstrap_bus_stops, 10000);
    }
}

export async function bootstrap_bus_routes(){
    bootstrap_status.bus_routes = "RUNNING"
    var status = await get_bus_routes()
    bootstrap_status.bus_routes = status

    if(status ==="ERROR"){
        console.log("Bus routes caching ran into Error. Trying again in 10 seconds")
        setTimeout(bootstrap_bus_routes, 10000);
    }
}

/**
 * Gets real time train predictions from WMATA's API
 * Will rerun every 10 seconds
 */
export async function get_train_data(){
    let rawTrains;
	try {
        bootstrap_status.next_train = "RUNNING"
		var trainResponse = await fetch(`https://api.wmata.com/StationPrediction.svc/json/GetPrediction/All?api_key=${key}`);
        rawTrains = await trainResponse.json();
        if(rawTrains === undefined){
            throw new Error("Proper data structure wasn't found within json file")
        }
        trains = parseTrains(rawTrains.Trains)
        
    } catch(e:any){
        console.log("---- ERROR has been caught. Check Log ----")
        var error:error_template ={
            timestamp: Date.now().toString(),
            function: "get_train_data",
            error: e.message,
            trace: e.stack
        }
        error_log.push(error)
        return "ERROR"
    }
    lastUpdated.next_train = trainResponse.headers.get('date');
    bootstrap_status.next_train = "SUCCESS"
    setTimeout(get_train_data, 10000);
    return "SUCCESS"
}

/**
 * Gets stations, entrances, and fare information from WMATA's API
 * Will rerun every hour.
 */
export async function get_data() {
	let rawStations, rawEntrances, rawFares;
	try {
        bootstrap_status.stations_fares_entrances = "RUNNING"
		var stationResponse = await fetch(`https://api.wmata.com/Rail.svc/json/jStations?api_key=${key}`);
        var entrancesResponse = await fetch(`https://api.wmata.com/Rail.svc/json/jStationEntrances?api_key=${key}`);
        var faresResponse = await fetch(`https://api.wmata.com/Rail.svc/json/jSrcStationToDstStationInfo?api_key=${key}`);
		rawStations = await stationResponse.json();
        rawEntrances = await entrancesResponse.json();
        rawFares = await faresResponse.json();
        if(rawEntrances.Entrances === undefined || rawFares.StationToStationInfos === undefined || rawStations.Stations === undefined){
            throw new Error("Proper data structure wasn't found within json file(s)")
        }
        let e = parseEntrances(rawEntrances.Entrances);
        let f = parseFares(rawFares.StationToStationInfos);
        stations = parseStations(rawStations.Stations, f, e);
	} catch(e:any){
        console.log("---- ERROR has been caught. Check Log ----")
        bootstrap_status.stations_fares_entrances = "ERROR"

        var error:error_template ={
            timestamp: Date.now().toString(),
            function: "get_data",
            error: e.message,
            trace: e.stack
        }
        error_log.push(error)
        return "ERROR"
    }
    bootstrap_status.stations_fares_entrances = "SUCCESS"

    lastUpdated.stations_fares_entrances = stationResponse.headers.get('date');
    setTimeout(get_train_data, 3600000);
    return "SUCCESS"
}

export async function get_rail_alerts(){
    let rawAlerts;
	try {
        bootstrap_status.rail_alerts = "RUNNING"
        var alertsResponse= await fetch(`https://api.wmata.com/Incidents.svc/json/Incidents?api_key=${key}`);
		let date = alertsResponse.headers.get('date');
        rawAlerts = await alertsResponse.json();
        railAlerts = rawAlerts.Incidents;
        lastUpdated.alerts = date;
	} catch(e:any){
        bootstrap_status.rail_alerts = "ERROR"
        console.log("---- ERROR has been caught. Check Log ----")
        var error:error_template ={
            timestamp: Date.now().toString(),
            function: "get_rail_alerts",
            error: e.message,
            trace: e.stack
        }
        error_log.push(error)
        return "ERROR"
    }
    bootstrap_status.rail_alerts = "SUCCESS"
    setTimeout(get_rail_alerts, 60000);
    return "SUCCESS"
}

function parseEntrances(entrances : any[]): ESMap<string,entrance[]>{
    var output = new Map();
    for(const e of entrances){
        if(output.get(e.StationCode1) === undefined) output.set(e.StationCode1, []);
        if(e.StationCode2 !== "" && output.get(e.StationCode2) === undefined) output.set(e.StationCode2, []);
        let temp = output.get(e.StationCode1);
        if(temp !== undefined){
            if(e.Description.toLowerCase().includes("elevator")){
                temp.push({Name: e.Name, Lat:e.Lat, Lon: e.Lon, Description: e.Description, Type: "Elevator"});
            }
            else temp.push({Name: e.Name, Lat:e.Lat, Lon: e.Lon, Description: e.Description, Type: "Escalator"});
            output.set(e.StationCode1, temp);
        }
        if(e.StationCode2 !== ""){
            let temp = output.get(e.StationCode2);
            if(temp !== undefined){
                if(e.Description.toLowerCase().includes("elevator")){
                    temp.push({Name: e.Name, Lat:e.Lat, Lon: e.Lon, Description: e.Description, Type: "Elevator"});
                }
                else temp.push({Name: e.Name, Lat:e.Lat, Lon: e.Lon, Description: e.Description, Type: "Escalator"});
                output.set(e.StationCode2, temp);
            }
        }
    }
    return output;
}

function parseFares(fares: any[]){
    var output = new Map();
    for(const f of fares){
        if(output.get(f.SourceStation) === undefined) output.set(f.SourceStation, new Map());

        let temp = output.get(f.SourceStation)

        if(temp !== undefined){
            temp.set(f.DestinationStation,f.RailFare)
            output.set(f.SourceStation, temp);
        }
    }
    return output;
}

function parseStations(stations: any[], fares: ESMap<string,ESMap<string,fares>>, entrances: ESMap<string,entrance[]>){
    var temp_code_to_name = new Map<string,string>();
    var temp_name_to_code = new Map<string,string>();
    var temp_code_array = [];
    var temp_name_array = [];
    var output = new Map<string, station>();
    if(stations !== null){
        for(const s of stations){
            temp_code_to_name.set(s.Code, s.Name);
            temp_name_to_code.set(s.Name, s.Code);
            temp_code_array.push(s.Code);
            temp_name_array.push(s.Name);
            let station : station = {
                Code : s.Code,
                Name : s.Name,
                StationTogether1: s.StationTogether1,
                StationTogether2: s.StationTogether2,
                LineCode1: s.LineCode1,
                LineCode2: s.LineCode2,
                LineCode3: s.LineCode3,
                LineCode4: s.LineCode4,
                Lat: s.Lat,
                Lon: s.Lon,
                Address: s.Address,
                fares: fares.get(s.Code)!,
                entrances: entrances.get(s.Code)!,
                lines : [s.LineCode1]
            };
            output.set(s.Code, station);
        }
    }
    for (const e of temp_code_array){
        let s = output.get(e)!
        if(s.LineCode2 !== null) s.lines.push(s.LineCode2);
        if(s.LineCode3 !== null) s.lines.push(s.LineCode3);
        if(s.LineCode4 !== null) s.lines.push(s.LineCode4);
        for(const f of temp_code_array){
            if(temp_code_to_name.get(e) === temp_code_to_name.get(f) && e !== f){
                let t = output.get(f)!
                if(t.LineCode1 !== null) s.lines.push(t.LineCode1);
                if(t.LineCode2 !== null) s.lines.push(t.LineCode2);
                if(t.LineCode3 !== null) s.lines.push(t.LineCode3);
                if(t.LineCode4 !== null) s.lines.push(t.LineCode4);

            }
        }
        output.set(e,s);
    }
    stationNames = new stationCodeNameMap(temp_code_to_name, temp_name_to_code, temp_code_array, temp_name_array);
    return output;
}

function parseTrains(trains: train[]) : ESMap<string, train[]>{
    var output : ESMap<string, train[]> = new Map();
    for(const e of trains){
        if(output.get(e.LocationCode) === undefined) output.set(e.LocationCode, []);
        let temp = output.get(e.LocationCode);
        if(temp !== undefined){
            temp.push(e);
            output.set(e.LocationCode,temp);
        }
    }
    return output;
}

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
      return;
    } catch(e:any){
        bootstrap_status.rail_alerts = "ERROR"
        console.log("---- ERROR has been caught. Check Log ----")
        var error:error_template ={
            timestamp: Date.now().toString(),
            function: "get_next_bus",
            error: e.message,
            trace: e.stack
        }
        error_log.push(error)
        return "ERROR"
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
  } catch(e:any){
    bootstrap_status.rail_alerts = "ERROR"
    console.log("---- ERROR has been caught. Check Log ----")
    var error:error_template ={
        timestamp: Date.now().toString(),
        function: "get_bus_routes",
        error: e.message,
        trace: e.stack
    }
    error_log.push(error)
    return "ERROR"
}
  console.log("finished caching bus routes!");
  return "SUCCESS"
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
  } catch(e:any){
    bootstrap_status.rail_alerts = "ERROR"
    console.log("---- ERROR has been caught. Check Log ----")
    var error:error_template ={
        timestamp: Date.now().toString(),
        function: "get_bus_stops",
        error: e.message,
        trace: e.stack
    }
    error_log.push(error)
    return "ERROR"
}
  console.log("Bus stops cahced!")
  return "SUCCESS"
}


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

//--------------------------------------------------------------------
//         Below is all the GET endpoint functions
//         Note: any parameters defined for each funciton
//         is referring to what you have to put in the URL.
//--------------------------------------------------------------------

/*
app.get('/api', function(request : any, response : any){
    response.send('This is the api backend')
});

/**
 * Gets next arrivals of a given station
 * @param station The station you want to get the next arrivals from
 * @param group what group of trains you want to get. Accepted imputs are "1" and "2" Note: In WMATA's api,
 * trains are put in 2 groups to denote what tracks they are one. However, it doesn't correlate to the actual
 * track number.
 * @returns json files containing array of train objecs. See "train" interface in interfaces_and_classes.tsx
 *
app.get('/api/nextarrival', function(request : any, response : any){
    if(request.query.station == null){
        response.status(400).send("Provide station");
    }
    else{
        let code = stationNames.getCode(request.query.station)!;
        let output =  trains.get(code)
        
        if(stations.get(code) === undefined){
            response.send("Invalid station")
            return;
        }
        if( stations.get(code)?.StationTogether1 !== ''){
            let temp = trains.get(stations.get(code)!.StationTogether1);
            output = output!.concat(temp!);
        }

        if(output === undefined) response.send("No trains found");
        else{
            if (request.query.group === "1") response.json(output.filter(x=>x.Group === "1"));
            else if (request.query.group === "2") response.json(output.filter(x=>x.Group === "2"));
            else response.json(trains.get(code));
        }
    }
});*/

/**
 * Gets the fare information from one station to another. The fare is determined on how far you 
 * travel so it will depend on which station you start and end at
 * @param sourcestation The origin station
 * @param destinationstation The destination station
 * @returns json with object that contains fare information. See "fares" interface in interfaces_and_classes.tsx
 *
app.get('/api/fares', function(request : any, response : any){
    if(request.query.sourcestation == null && request.query.destinationstation == null){
        response.status(400).send("Provide source and destination station");
    }
    let source = stationNames.getCode(request.query.sourcestation)!;
    let dest = stationNames.getCode(request.query.destinationstation)!;
    let output = stations.get(source)?.fares.get(dest);

    if(output === undefined) response.status(404);

    else response.json(output);
});

/**
 * Gets all entrances from a certain station
 * @param station What station you want to get the entrances from.
 * @return json with array of entrances. See "entrance" interface in interfaces_and_classes.tsx
 *
app.get('/api/entrances', function(request : any, response : any){
    if(request.query.station == null){
        response.status(400).send("Provide station");
    }
    else{
        let code = stationNames.getCode(request.query.station)!;
        let output = stations.get(code)?.entrances
        if(output === undefined) response.status(404);
        else response.json(output);
    }
});

app.get('/api/stationInfo', function(request : any, response : any){
    if(request.query.station == null){
        response.status(400).send("Provide station");
    }
    else{
        let code = stationNames.getCode(request.query.station)!;
        let output = stations.get(code)
        if(output === undefined) response.status(404);
        else response.send(output);
    }
});

app.get('/api/stationList', function(request : any, response : any){
    let code = stationNames.getCode(request.query.station)!;
    let output = stations.get(code)
    if(request.query.get === "codes")response.json(stationNames.codeArray);
    else if(request.query.get === "names")response.json(stationNames.nameArray);
    else if(output === undefined) response.json(stationNames.nameArray);
    else response.json(output);
});

app.get('/api/alerts', function(request : any, response : any){
    let output = []
    if(request.query.line !== undefined){
        for(const e of railAlerts){
            let temp = e.LinesAffected.split(/;[\s]?/).filter(function(fn : any) { return fn !== ''; })
            if(temp.includes(request.query.line)){
                output.push(e);
            }
        }
        response.json(output);
        return;
    }
    else{
        response.send(railAlerts);
    }
});*/
/*
app.get('/api/queue', function(request : any, response : any){
    let output = []
    if(request.query.line !== undefined){
        for(const e of railAlerts){
            let temp = e.LinesAffected.split(/;[\s]?/).filter(function(fn : any) { return fn !== ''; })
            if(temp.includes(request.query.line)){
                output.push(e);
            }
        }
        response.json(output);
        return;
    }
    else{
        response.send(railAlerts);
    }
});*/

/**
 * Gets the time when data was last fetched from WMATA's api
 * @returns json object. See lastUpdated variable to see what's in the object
 *
app.get('/api/lastupdate', function(request : any, response : any){
    response.json(lastUpdated);
});

app.get('/api/busStop', function(request : any, response : any){
    if(bootstrap_status.bus_stops === "RUNNING"){
        response.send("System is booting up. Please try again later.")
    }
    else if(bootstrap_status.bus_stops=== "ERROR"){
        response.send("System ran into error fetching bus stops. Please try again later.")
    }
    else{
        response.json(bus.get_bus_stop_info(request.query.stopid));
    }
});

app.get('/api/busRoute', function(request : any, response : any){
    if(bootstrap_status.bus_routes === "RUNNING"){
        response.send("System is booting up. Please try again later.")
    }
    else if(bootstrap_status.bus_routes === "ERROR"){
        response.send("System ran into error fetching bus routes. Please try again later.")
    }
    else{
        response.json(bus.get_bus_route_info(request.query.route));
    }
});

app.get('/api/bootstrap', function(request : any, response : any){
    response.json(bootstrap_status);
});

app.get('/api/errorLog', function(request : any, response : any){
    if(request.query.key === process.env.ERROR_LOG_KEY) response.json(error_log);
    else response.send("Invalid key");
});
*/

/**
 * Catchall function to handle invalid endpoints.
 *
app.get('/api/*', function(request : any, response : any){
    response.send("ummm... that wasn't a valid endpoint");
});

app.listen(process.env.PORT || 4000,() => {
    main();
    console.log(`Example app listening on port ${process.env.PORT || 4000}`);
});

export * as backend from "./backend"
*/