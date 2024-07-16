/**
 * This is the code that preprocesses data from WMATA's api.
 * @author Samuel Johnson
 */

import * as backend from "./backend";
import * as database from "./database";
import { ESMap } from "typescript";
import { stationCodeNameMap, train, fares, entrance, station } from "./interfaces_and_classes";
const { default: fetch } = require("node-fetch");
const path = require("path");
var GtfsRealtimeBindings = require("gtfs-realtime-bindings");

require("dotenv").config({
  path: path.resolve(__dirname, "../..", ".env.local"),
});

var key = process.env.WMATA_KEY;
export var stationNames: stationCodeNameMap;
export var trains: ESMap<string, train[]>;
export var stations: ESMap<string, station>;
export var railAlerts: any;
export var train_positions: any;
export var escalator_elevator_outages: any;
export var schedule_data: any;
export var schedule_calendar_map: any;
export var schedule_calendar_object: any;
export var schedule_data_full: any;

/**
 * Gets real time train predictions from WMATA's API
 * Will rerun every 10 seconds
 */
export async function get_train_data() {
  let rawTrains;
  try {
    backend.bootstrap_status.next_train = "RUNNING";
    var trainResponse = await fetch(
      `https://api.wmata.com/StationPrediction.svc/json/GetPrediction/All?api_key=${key}`,
    );
    let contentType = trainResponse.headers.get('content-type')
    if(contentType && contentType.includes('application/json')){
      rawTrains = await trainResponse.json();
      if (rawTrains === undefined) {
        throw new Error("Proper data structure wasn't found within json file");
      }
      trains = parseTrains(rawTrains.Trains);
    }
    else{
      throw new Error(trainResponse.text())
    }
  } catch (e: any) {
    backend.handleErrors(e, "rail/get_train_data", "rail_arrival")
    //I thought this wase.error(trainResponse);
    setTimeout(get_train_data, 20000);
    return "ERROR";
  }
  backend.handleSuccess("rail_arrival")
  backend.lastUpdated.next_train = trainResponse.headers.get("date");
  backend.bootstrap_status.next_train = "SUCCESS";
  setTimeout(get_train_data, 10000);
  return "SUCCESS";
}

/**
 * Gets stations, entrances, and fare information from WMATA's API
 * Will rerun every hour.
 */
export async function get_station_data() {
  let rawStations, rawEntrances, rawFares;
  try {
    backend.bootstrap_status.stations_fares_entrances = "RUNNING";
    var stationResponse = await fetch(
      `https://api.wmata.com/Rail.svc/json/jStations?api_key=${key}`,
    );
    var entrancesResponse = await fetch(
      `https://api.wmata.com/Rail.svc/json/jStationEntrances?api_key=${key}`,
    );
    var faresResponse = await fetch(
      `https://api.wmata.com/Rail.svc/json/jSrcStationToDstStationInfo?api_key=${key}`,
    );
    rawStations = await stationResponse.json();
    rawEntrances = await entrancesResponse.json();
    rawFares = await faresResponse.json();
    if (
      rawEntrances.Entrances === undefined ||
      rawFares.StationToStationInfos === undefined ||
      rawStations.Stations === undefined
    ) {
      throw new Error("Proper data structure wasn't found within json file(s)");
    }
    let e = parseEntrances(rawEntrances.Entrances);
    let f = parseFares(rawFares.StationToStationInfos);
    stations = parseStations(rawStations.Stations, f, e);
  } catch (e: any) {
    backend.handleErrors(e, "rail/get_station_data", "")
    backend.bootstrap_status.stations_fares_entrances = "ERROR";
    //console.error(e);
    setTimeout(get_station_data, 100000);
    return "ERROR";
  }
  backend.bootstrap_status.stations_fares_entrances = "SUCCESS";

  backend.lastUpdated.stations_fares_entrances =
    stationResponse.headers.get("date");
  setTimeout(get_station_data, 3600000);
  return "SUCCESS";
}

// Not in use. WMATA's alerts api stopped working.
// Currently uses gtfs-rt alerts instead
export async function get_rail_alerts() {
  let rawAlerts;
  try {
    backend.bootstrap_status.rail_alerts = "RUNNING";
    var alertsResponse = await fetch(
      `https://api.wmata.com/Incidents.svc/json/Incidents?api_key=${key}`,
    );
    let date = alertsResponse.headers.get("date");
    rawAlerts = await alertsResponse.json();
    backend.lastUpdated.alerts = date;
  } catch (e: any) {
    backend.bootstrap_status.rail_alerts = "ERROR";
    //console.error(e);
    return "ERROR";
  }
  backend.bootstrap_status.rail_alerts = "SUCCESS";
  setTimeout(get_rail_alerts, 60000);
  return "SUCCESS";
}

export async function get_elevator_escalator_alerts() {
  try {
    let outages;
   // backend.bootstrap_status.rail_alerts = "RUNNING";
    var alertsResponse = await fetch(
      `https://api.wmata.com/Incidents.svc/json/ElevatorIncidents?api_key=${key}`,
    );

    let contentType = alertsResponse.headers.get('content-type')
    if(contentType && contentType.includes('application/json')){
      outages = await alertsResponse.json();
      if (outages === undefined) {
        throw new Error("Proper data structure wasn't found within json file");
      }
      escalator_elevator_outages = outages.ElevatorIncidents
      let date = alertsResponse.headers.get("date");
       backend.lastUpdated.alerts = date;
    }
    else{
      throw new Error(alertsResponse.text())
    }
  } catch (e: any) {
   // backend.bootstrap_status.rail_alerts = "ERROR";
    //console.error(e);
    return "ERROR";
  }
  //backend.bootstrap_status.rail_alerts = "SUCCESS";
  setTimeout(get_elevator_escalator_alerts, 60000);
  return "SUCCESS";
}

export async function get_train_positions() {
  var geojson: any = {
    type: "FeatureCollection",
    name: "train_positions",
    features: [],
  };
  try {
    const res = await fetch(
      `https://api.wmata.com/gtfs/rail-gtfsrt-vehiclepositions.pb?api_key=${key}`,
    );
    var b = Buffer.from(await res.arrayBuffer());
    var feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(b);
    let trip_ids = feed.entity.map((x: any) => {
      return x.vehicle.trip.tripId;
    });
    feed.entity.forEach(function (entity: any) {
      if (entity.vehicle.position) {
        geojson.features.push({
          type: "Feature",
          properties: {
            line: entity.vehicle.trip.routeId,
            id: entity.vehicle.vehicle.id,
            label: entity.vehicle.vehicle.label,
            licensePlate: entity.vehicle.vehicle.licensePlate,
            rotation: entity.vehicle.position.bearing,
            destination: "not available"
          },
          geometry: {
            type: "Point",
            coordinates: [
              entity.vehicle.position.longitude,
              entity.vehicle.position.latitude,
            ],
          },
        });
      }
    });
  } catch (e: any) {
    backend.handleErrors(e, "rail/get_train_positions", "")
    backend.bootstrap_status.train_positions = "ERROR";
    //console.error(e);
    setTimeout(get_train_positions, 5000); // Timeout might occur that will stop function.
    return "ERROR";
  }
  setTimeout(get_train_positions, 5000);
  train_positions = geojson;
  return "SUCCESS";
}

function parseEntrances(entrances: any[]): ESMap<string, entrance[]> {
  var output = new Map();
  for (const e of entrances) {
    if (output.get(e.StationCode1) === undefined)
      output.set(e.StationCode1, []);
    if (e.StationCode2 !== "" && output.get(e.StationCode2) === undefined)
      output.set(e.StationCode2, []);
    let temp = output.get(e.StationCode1);
    if (temp !== undefined) {
      if (e.Description.toLowerCase().includes("elevator")) {
        temp.push({
          Name: e.Name,
          Lat: e.Lat,
          Lon: e.Lon,
          Description: e.Description,
          Type: "Elevator",
        });
      } else
        temp.push({
          Name: e.Name,
          Lat: e.Lat,
          Lon: e.Lon,
          Description: e.Description,
          Type: "Escalator",
        });
      output.set(e.StationCode1, temp);
    }
    if (e.StationCode2 !== "") {
      let temp = output.get(e.StationCode2);
      if (temp !== undefined) {
        if (e.Description.toLowerCase().includes("elevator")) {
          temp.push({
            Name: e.Name,
            Lat: e.Lat,
            Lon: e.Lon,
            Description: e.Description,
            Type: "Elevator",
          });
        } else
          temp.push({
            Name: e.Name,
            Lat: e.Lat,
            Lon: e.Lon,
            Description: e.Description,
            Type: "Escalator",
          });
        output.set(e.StationCode2, temp);
      }
    }
  }
  return output;
}

function parseFares(fares: any[]) {
  var output = new Map();
  for (const f of fares) {
    if (output.get(f.SourceStation) === undefined)
      output.set(f.SourceStation, new Map());

    let temp = output.get(f.SourceStation);

    if (temp !== undefined) {
      temp.set(f.DestinationStation, f.RailFare);
      output.set(f.SourceStation, temp);
    }
  }
  return output;
}

function parseStations(
  stations: any[],
  fares: ESMap<string, ESMap<string, fares>>,
  entrances: ESMap<string, entrance[]>,
) {
  var temp_code_to_name = new Map<string, string>();
  var temp_name_to_code = new Map<string, string>();
  var temp_code_array = [];
  var temp_name_array = [];
  var temp_line_array = new Map<string, string[]>();
  var output = new Map<string, station>();
  if (stations !== null) {
    for (const s of stations) {
      temp_code_to_name.set(s.Code, s.Name);
      temp_name_to_code.set(s.Name, s.Code);
      temp_code_array.push(s.Code);
      temp_name_array.push(s.Name);
      let station: station = {
        Code: s.Code,
        Name: s.Name,
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
        lines: [s.LineCode1],
      };
      output.set(s.Code, station);
    }
  }
  for (const e of temp_code_array) {
    let s = output.get(e)!;
    if (s.LineCode2 !== null) s.lines.push(s.LineCode2);
    if (s.LineCode3 !== null) s.lines.push(s.LineCode3);
    if (s.LineCode4 !== null) s.lines.push(s.LineCode4);
    for (const f of temp_code_array) {
      if (temp_code_to_name.get(e) === temp_code_to_name.get(f) && e !== f) {
        let t = output.get(f)!;
        if (t.LineCode1 !== null) s.lines.push(t.LineCode1);
        if (t.LineCode2 !== null) s.lines.push(t.LineCode2);
        if (t.LineCode3 !== null) s.lines.push(t.LineCode3);
        if (t.LineCode4 !== null) s.lines.push(t.LineCode4);
      }
    }
    output.set(e, s);
    temp_line_array.set(s.Name, s.lines);
  }
  stationNames = new stationCodeNameMap(
    temp_code_to_name,
    temp_name_to_code,
    temp_code_array,
    temp_name_array,
    temp_line_array,
  );
  return output;
}

function parseTrains(trains: train[]): ESMap<string, train[]> {
  var output: ESMap<string, train[]> = new Map();
  for (const e of trains) {
    if (output.get(e.LocationCode) === undefined)
      output.set(e.LocationCode, []);
    let temp = output.get(e.LocationCode);
    if (temp !== undefined) {
      temp.push(e);
      output.set(e.LocationCode, temp);
    }
  }
  return output;
}

export async function get_rail_alerts_gtft_rt() {
  var output: any = [];
  try {
    const res = await fetch(
      `https://api.wmata.com/gtfs/rail-gtfsrt-alerts.pb?api_key=${key}`,
    );
    var b = Buffer.from(await res.arrayBuffer());
    var feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(b);
    feed.entity.forEach(function (entity: any) {
      let line: any = []; //entity.alert.informedEntity[0].routeId
      entity.alert.informedEntity.forEach(function (e: any) {
        if (e.routeId === "RED") {
          line.push("RD");
        } else if (e.routeId === "ORANGE") {
          line.push("OR");
        } else if (e.routeId === "YELLOW") {
          line.push("YL");
        } else if (e.routeId === "GREEN") {
          line.push("GR");
        } else if (e.routeId === "BLUE") {
          line.push("BL");
        } else if (e.routeId === "SILVER") {
          line.push("SV");
        }
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
    backend.handleErrors(e, "rail/get_rail_alerts_gtft_rt", "rail_alerts")
    backend.bootstrap_status.train_positions = "ERROR";
    //console.error(e);
    setTimeout(get_rail_alerts_gtft_rt, 60000); // Timeout might occur that will stop function.
    return "ERROR";
  }
  railAlerts = output;
  backend.handleSuccess("rail_alerts")
  setTimeout(get_rail_alerts_gtft_rt, 60000);
  return "SUCCESS";
}

var full_schedule_refresh = 0

export async function update_rail_schedule(){
  await database.update_rail_data();
  let temp = await database.get_train_schedule_today()
  let temp2 = await database.get_train_schedule_calendar()
  let temp3;
  if (full_schedule_refresh == 180){
    temp3 = await database.get_train_schedule_all()
    full_schedule_refresh = 0
  }
  else{
    full_schedule_refresh += 1
  }
  
  /*if (schedule_data == undefined){
    schedule_data = new Map()
    for (const e of stationNames.codeArray){
      schedule_data.set(e, [])
    }
  }*/
  if((temp != null && temp2 != null) || (temp.length > 0 && temp2.length > 0)){
    schedule_data = new Map(Object.entries(groupBy(temp, "replace")));
    schedule_calendar_map =  new Map(Object.entries(groupBy(temp2, "service_date")));
    schedule_calendar_object = temp2;
    //console.log(schedule_data.get("A04"))
   /* for(const e of temp){

    }*/
    //console.log(schedule_data.get("F06"))
    //update_rail_schedule();
  }else{
    console.error("ERROR: Rail database get_train_schedule_today returned null")
  }
  if(temp3 != undefined){
    schedule_data_full = new Map(Object.entries(groupBy(temp3, "replace")));
    console.log("NOTICE: Updated full rail schedule")
  }
  setTimeout(update_rail_schedule, 20000)
}

export async function update_full_rail_schedule(){
  let temp = await database.get_train_schedule_all()
  /*if (schedule_data == undefined){
    schedule_data = new Map()
    for (const e of stationNames.codeArray){
      schedule_data.set(e, [])
    }
  }*/
  if((temp.length > 0)){
    schedule_data_full = new Map(Object.entries(groupBy(temp, "replace")));
    //schedule_calendar =  new Map(Object.entries(groupBy(temp2, "service_date")));
    //console.log(schedule_data_full.get("A04"))
   /* for(const e of temp){

    }*/
    //console.log(schedule_data.get("F06"))
    //update_rail_schedule();
  }
  else{
    console.error("ERROR: Rail database get_train_schedule_today returned null")
  }
  setTimeout(update_rail_schedule, 3_600_000)
}

var groupBy = function(xs: any, key:any) {
  return xs.reduce(function(rv:any, x:any) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};