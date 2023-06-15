/**
 * This is the code that preprocesses data from WMATA's api and defines the endpoints for my own api.
 * @author Samuel Johnson
 */

import { ESMap } from "typescript";
import {stationCodeNameMap, train, fares, entrance, station} from "./interfaces_and_classes"
const {default : fetch} = require('node-fetch');
const express = require('express')
const path = require('path');
require('dotenv').config({path: path.resolve(__dirname,"..",".env.local")});

const app = express()
app.use(express.static(path.join(__dirname, 'client/build')));

var key = process.env.WMATA_KEY
var stationNames : stationCodeNameMap;
var trains : ESMap<string, train[]>;
var stations: ESMap<string, station>;
var lastUpdated = {next_train: null, stations_fares_entrances: null, alerts: null};
var railAlerts: any;

/**
 * Starts up backend system and manage when to get next arrival data
 */
async function main(){
    var status1 = await get_data();
    if(status1 === "ERROR"){
        console.log("Retrying fetching station, fare, and entrance data in 5 seconds")
        setTimeout(get_data, 5000)
    }
    var status2 = await get_train_data();
    if(status2 === "ERROR"){
        console.log("Retrying fetching train data in 5 seconds")
        setTimeout(get_train_data, 5000)
    }
    var status3 = await get_rail_alerts();
    if(status3 === "ERROR"){
        console.log("Retrying fetching train data in 5 seconds")
        setTimeout(get_rail_alerts, 5000)
    }
}

/**
 * Gets real time train predictions from WMATA's API
 * Will rerun every 10 seconds
 */
async function get_train_data(){
    let rawTrains;
	try {
		var trainResponse = await fetch(`https://api.wmata.com/StationPrediction.svc/json/GetPrediction/All?api_key=${key}`);
        rawTrains = await trainResponse.json();
        if(rawTrains === undefined){
            throw new Error("Proper data structure wasn't found within json file")
        }
        trains = parseTrains(rawTrains.Trains)
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
}

/**
 * Gets stations, entrances, and fare information from WMATA's API
 * Will rerun every hour.
 */
async function get_data() {
	let rawStations, rawEntrances, rawFares;
	try {
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
	} catch (e) {
		console.error(e);
        return "ERROR"
	}
    lastUpdated.stations_fares_entrances = stationResponse.headers.get('date');
    setTimeout(get_train_data, 3600000);
    return "SUCCESS"
}

async function get_rail_alerts(){
    let rawAlerts;
	try {
        var alertsResponse= await fetch(`https://api.wmata.com/Incidents.svc/json/Incidents?api_key=${key}`);
		let date = alertsResponse.headers.get('date');
        rawAlerts = await alertsResponse.json();
        railAlerts = rawAlerts.Incidents;
        lastUpdated.alerts = date;
	} catch (e) {
		console.error(e);
        return "ERROR"
	}
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

//--------------------------------------------------------------------
//         Below is all the GET endpoint functions
//         Note: any parameters defined for each funciton
//         is referring to what you have to put in the URL.
//--------------------------------------------------------------------

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
 */
app.get('/api/nextarrival', function(request : any, response : any){
    if(request.query.station == null){
        response.status(400).send("Provide station");
    }
    else{
        let code = stationNames.getCode(request.query.station)!;
        let output =  trains.get(code)
        
        if(stations.get(code) === undefined) return;

        if( stations.get(code)?.StationTogether1 !== ''){
            let temp = trains.get(stations.get(code)!.StationTogether1);
            output = output!.concat(temp!);
        }

        if(output === undefined) response.status(404);
        else {
            if (request.query.group === "1") response.json(output.filter(x=>x.Group === "1"));
            else if (request.query.group === "2") response.json(output.filter(x=>x.Group === "2"));
            else response.json(trains.get(code));
        }
    }
});

/**
 * Gets the fare information from one station to another. The fare is determined on how far you 
 * travel so it will depend on which station you start and end at
 * @param sourcestation The origin station
 * @param destinationstation The destination station
 * @returns json with object that contains fare information. See "fares" interface in interfaces_and_classes.tsx
 */
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
 */
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
});

/**
 * Gets the time when data was last fetched from WMATA's api
 * @returns json object. See lastUpdated variable to see what's in the object
 */
app.get('/api/lastupdate', function(request : any, response : any){
    response.json(lastUpdated);
});

/**
 * Catchall function to handle invalid endpoints.
 */
app.get('/api/*', function(request : any, response : any){
    response.send("ummm... that wasn't a valid endpoint");
});

app.listen(process.env.PORT || 4000,() => {
    main();
    console.log(`Example app listening on port ${process.env.PORT || 4000}`);
});