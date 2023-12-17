/**
 * This is the code that preprocesses data from WMATA's api.
 * @author Samuel Johnson
 */

import * as backend from "./backend"
import { ESMap } from "typescript";
import {stationCodeNameMap, train, fares, entrance, station, busStop, busRoute, error_template} from "./interfaces_and_classes"
const {default : fetch} = require('node-fetch');
const path = require('path');
var GtfsRealtimeBindings = require('gtfs-realtime-bindings');

require('dotenv').config({path: path.resolve(__dirname,"../..",".env.local")});

var key = process.env.WMATA_KEY
export var stationNames : stationCodeNameMap;
export var trains : ESMap<string, train[]>;
export var stations: ESMap<string, station>;
export var railAlerts: any;
export var train_positions:any;

/**
 * Gets real time train predictions from WMATA's API
 * Will rerun every 10 seconds
 */
export async function get_train_data(){
    let rawTrains;
	try {
        backend.bootstrap_status.next_train = "RUNNING"
		var trainResponse = await fetch(`https://api.wmata.com/StationPrediction.svc/json/GetPrediction/All?api_key=${key}`);
        rawTrains = await trainResponse.json();
        if(rawTrains === undefined){
            throw new Error("Proper data structure wasn't found within json file")
        }
        trains = parseTrains(rawTrains.Trains)
        
    } catch(e:any){
        console.log("---- ERROR has been caught. Check Log ----")
        console.log(trainResponse)
        var error:error_template ={
            timestamp: Date.now().toString(),
            function: "get_train_data",
            error: e.message,
            trace: e.stack
        }
        backend.error_log.push(error)
        setTimeout(get_train_data, 20000);
        return "ERROR"
    }
    backend.lastUpdated.next_train = trainResponse.headers.get('date');
    backend.bootstrap_status.next_train = "SUCCESS"
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
        backend.bootstrap_status.stations_fares_entrances = "RUNNING"
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
        backend.bootstrap_status.stations_fares_entrances = "ERROR"

        console.log(e)

        var error:error_template ={
            timestamp: Date.now().toString(),
            function: "get_data",
            error: e.message,
            trace: e.stack
        }
        backend.error_log.push(error)
        return "ERROR"
    }
    backend.bootstrap_status.stations_fares_entrances = "SUCCESS"

    backend.lastUpdated.stations_fares_entrances = stationResponse.headers.get('date');
    setTimeout(get_train_data, 3600000);
    return "SUCCESS"
}

export async function get_rail_alerts(){
    let rawAlerts;
	try {
        backend.bootstrap_status.rail_alerts = "RUNNING"
        var alertsResponse= await fetch(`https://api.wmata.com/Incidents.svc/json/Incidents?api_key=${key}`);
		let date = alertsResponse.headers.get('date');
        rawAlerts = await alertsResponse.json();
        railAlerts = rawAlerts.Incidents;
        backend.lastUpdated.alerts = date;
	} catch(e:any){
        backend.bootstrap_status.rail_alerts = "ERROR"
        console.log("---- ERROR has been caught. Check Log ----")
        console.log(e)
        var error:error_template ={
            timestamp: Date.now().toString(),
            function: "get_rail_alerts",
            error: e.message,
            trace: e.stack
        }
        backend.error_log.push(error)
        return "ERROR"
    }
    backend.bootstrap_status.rail_alerts = "SUCCESS"
    setTimeout(get_rail_alerts, 60000);
    return "SUCCESS"
}

export async function get_train_positions(){
    var geojson:any = {
      "type": "FeatureCollection",
      "name": "train_positions",
      "features":[]
    }
    try{
        const res = await fetch(`https://api.wmata.com/gtfs/rail-gtfsrt-vehiclepositions.pb?api_key=${key}`)
        var b = Buffer.from(await res.arrayBuffer())
        var feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(b);
    
        feed.entity.forEach(function(entity:any) {
        if (entity.vehicle.position) {
            geojson.features.push(
            { "type": "Feature",
                "properties": {
                "line": entity.vehicle.trip.routeId, 
                "id": entity.vehicle.vehicle.id,
                "label": entity.vehicle.vehicle.label,
                "licensePlate": entity.vehicle.vehicle.licensePlate,
                "rotation":entity.vehicle.position.bearing
                },
                "geometry":{
                "type": "Point",
                "coordinates": [entity.vehicle.position.longitude, entity.vehicle.position.latitude] }
            })
        }});
    } catch(e:any){
        backend.bootstrap_status.train_positions = "ERROR"
        console.log("---- ERROR has been caught. Check Log ----")
        console.log(e)
        var error:error_template ={
            timestamp: Date.now().toString(),
            function: "get_train_positions",
            error: e.message,
            trace: e.stack
        }
        backend.error_log.push(error)
        setTimeout(get_train_positions, 5000); // Timeout might occur that will stop function. 
        return "ERROR"
    }
    setTimeout(get_train_positions, 5000);
    train_positions = geojson;
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
    var temp_line_array = new Map<string,string[]>();
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
        temp_line_array.set(s.Name,s.lines);
    }
    stationNames = new stationCodeNameMap(temp_code_to_name, temp_name_to_code, temp_code_array, temp_name_array, temp_line_array);
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