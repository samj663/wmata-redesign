/**
 * This file defines all the endpoints for this project's API
 * @author Samuel Johnson
 */

import * as backend from "./backend";
import * as rail from "./rail";
import * as bus from "./bus";
const express = require("express");
const path = require("path");
export const app = express();
//const https = require("https");
//const fs = require("fs");

require("dotenv").config({
  path: path.resolve(__dirname, "../..", ".env.local"),
});
app.use(express.static(path.join(__dirname, "client/build")));

//app.use(require('express-status-monitor')());
//app.use(require('express-status-monitor')());
//--------------------------------------------------------------------
//         Below is all the GET endpoint functions
//         Note: any parameters defined for each funciton
//         is referring to what you have to put in the URL.
//--------------------------------------------------------------------

app.get("/api", function (request: any, response: any) {
  response.send("This is the DC Metro API backend");
});

/**
 * Gets next arrivals of a given station
 * @param station The station you want to get the next arrivals from
 * @param group what group of trains you want to get. Accepted inputs are "1" and "2" Note: In WMATA's api,
 * trains are put in 2 groups to denote what tracks they are one. However, it doesn't correlate to the physical
 * track number.
 * @returns json file containing array of train objecs. See "train" interface in interfaces_and_classes.tsx
 */
app.get("/api/nextarrival", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=20");
  if (request.query.station == null) {
    response.status(400).json({ error: "Provide station" });
  } else {
    let code = rail.stationNames.getCode(request.query.station)!;
    let output = rail.trains.get(code);
    if (output) {
      if (rail.stations.get(code) === undefined) {
        response.json({ error: "Invalid station" });
        return;
      }
      if (
        rail.stations.get(code)?.StationTogether1 !== "" &&
        request.query.includeTransf == "true"
      ) {
        let temp = rail.trains.get(rail.stations.get(code)!.StationTogether1);
        if (temp) output = output.concat(temp);
      }
      if (request.query.group === "1")
        response.json(output.filter((x) => x.Group === "1"));
      else if (request.query.group === "2")
        response.json(output.filter((x) => x.Group === "2"));
      else response.json(output);
    } else {
      response.json({ error: "No trains found at station" });
      return;
    }
  }
  /*  #swagger.responses[200] = {
        description: "Some description...",
        content: {
          "application/json": {
            schema:{
              type: array{
                items:{
                  $ref: "#/components/schemas/NextRailArrival"
                }
              }
            }
          }           
        }
      }   
  */
});

/**
 * Gets the fare information from one station to another. The fare is determined on how far you
 * travel so it will depend on which station you start and end at
 * @param sourcestation The origin station
 * @param destinationstation The destination station
 * @returns json with object that contains fare information. See "fares" interface in interfaces_and_classes.tsx
 */
app.get("/api/fares", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=604800");
  if (
    request.query.sourcestation == null &&
    request.query.destinationstation == null
  ) {
    response
      .status(400)
      .json({ error: "Provide source and destination station" });
  }
  let source = rail.stationNames.getCode(request.query.sourcestation)!;
  let dest = rail.stationNames.getCode(request.query.destinationstation)!;
  let output = rail.stations.get(source)?.fares.get(dest);

  if (output === undefined)
    response.status(404).json({ error: "Fare not found" });
  else response.json(output);
});

/**
 * Gets all entrances from a certain station
 * @param station What station you want to get the entrances from.
 * @return json with array of entrances. See "entrance" interface in interfaces_and_classes.tsx
 */
app.get("/api/entrances", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=604800");
  if (request.query.station == null) {
    response.status(400).json({ error: "Provide station" });
  } else {
    let code = rail.stationNames.getCode(request.query.station)!;
    let output = rail.stations.get(code)?.entrances;
    if (output === undefined) response.status(404);
    else response.json(output);
  }
});

app.get("/api/stationInfo", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=604800");
  if (request.query.station == null) {
    let temp: any = [];
    rail.stations.forEach((e: any) => temp.push(e));
    response.json(temp);
  } else {
    let code = rail.stationNames.getCode(request.query.station)!;
    let output = rail.stations.get(code);
    if (output === undefined) response.status(404);
    else response.json(output);
  }
});

app.get("/api/trainpositions", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.json(rail.train_positions);
});

app.get("/api/stationList", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=31557600");
  let code = rail.stationNames.getCode(request.query.station)!;
  let output = rail.stations.get(code);
  if (request.query.get === "codes") response.json(rail.stationNames.codeArray);
  else if (request.query.get === "names")
    response.json(rail.stationNames.nameArray);
  else if (request.query.get === "lines")
    response.json(Object.fromEntries(rail.stationNames.lineArray));
  else if (output === undefined) response.json(rail.stationNames.nameArray);
  else response.json(output);
});

app.get("/api/alerts", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=600");
  let output = [];
  if (request.query.line !== undefined) {
    for (const e of rail.railAlerts) {
      let temp = e.LinesAffected.split(/;[\s]?/).filter(function (fn: any) {
        return fn !== "";
      });
      if (temp.includes(request.query.line)) {
        output.push(e);
      }
    }
    response.json(output);
    return;
  } else {
    response.json(rail.railAlerts);
  }
});

app.get("/api/alerts/bus", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=600");
  let output = [];
  if (request.query.line !== undefined) {
    for (const e of bus.bus_alerts) {
      let temp = e.LinesAffected.split(/;[\s]?/).filter(function (fn: any) {
        return fn !== "";
      });
      if (temp.includes(request.query.line)) {
        output.push(e);
      }
    }
    response.json(output);
    return;
  } else {
    response.json(bus.bus_alerts);
  }
});

/**
 * Gets the time when data was last fetched from WMATA's api
 * @returns json object. See lastUpdated variable to see what's in the object
 */
app.get("/api/lastupdate", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.json(backend.lastUpdated);
});

app.get("/api/busStop", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  if (backend.bootstrap_status.bus_stops === "RUNNING") {
    response.json({ error: "System is booting up. Please try again later." });
  } else if (backend.bootstrap_status.bus_stops === "ERROR") {
    response.json({
      error:
        "System ran into error fetching bus stops. Please try again later.",
    });
  } else response.json(bus.bus_stops.get(request.query.stopid));
});

app.get("/api/nearestbusstop", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  if (backend.bootstrap_status.bus_stops === "RUNNING") {
    response.json({ error: "System is booting up. Please try again later." });
  } else if (backend.bootstrap_status.bus_stops === "ERROR") {
    response.json({
      error:
        "System ran into error fetching bus stops. Please try again later.",
    });
  } else {
    if(request.query.lat == undefined || request.query.lon == undefined || request.query.radius == undefined){
      response.json({
        error:
          "Parameters weren't given.",
      });
    }
    else{
      response.json(bus.get_nearest_bus_stops(request.query.lat, request.query.lon, request.query.radius));
    }
  };
});

app.get("/api/busRoute", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  if (backend.bootstrap_status.bus_routes === "RUNNING") {
    response.json({ error: "System is booting up. Please try again later." });
  } else if (backend.bootstrap_status.bus_routes === "ERROR") {
    response.json({
      error:
        "System ran into error fetching bus routes. Please try again later.",
    });
  } else response.json(bus.bus_routes.get(request.query.route));
});

app.get("/api/busRouteList", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  if (backend.bootstrap_status.bus_route_list === "RUNNING") {
    response.json({ error: "System is booting up. Please try again later." });
  } else if (backend.bootstrap_status.bus_route_list === "ERROR") {
    response.json({
      error:
        "System ran into error fetching bus routes. Please try again later.",
    });
  } else {
    response.json(bus.bus_route_list);
  }
});

app.get("/api/bootstrap", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.json(backend.bootstrap_status);
});

app.get("/api/nextBus", async function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  if (request.query.stopid !== undefined) {
    var info = bus.bus_stops.get(request.query.stopid);
    if (info === undefined) {
      response.json({ error: "Stop not found" });
    } else {
      response.json(info);
    }
  } else response.json({ error: "Stop not found" });
});

/*
    Below are rewrites of endpoints above to make them more clear.
    These will be the new endpoints when all other projects are updated to use them.
*/

app.get("/", function (request: any, response: any) {
  response.send("This is the DC Metro API backend");
});

/**
 * Gets next arrivals of a given station
 * @param station The station you want to get the next arrivals from
 * @param group what group of trains you want to get. Accepted inputs are "1" and "2" Note: In WMATA's api,
 * trains are put in 2 groups to denote what tracks they are one. However, it doesn't correlate to the physical
 * track number.
 * @returns json file containing array of train objecs. See "train" interface in interfaces_and_classes.tsx
 */
app.get("/rail/arrival/:station/:group?", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=20");
  if (request.params.station == null) {
    response.status(400).json({ error: "Provide station" });
  } else {
    let code = rail.stationNames.getCode(request.params.station)!;
    let output = rail.trains.get(code);
    if (output) {
      if (rail.stations.get(code) === undefined) {
        response.json({ error: "Invalid station" });
        return;
      }
      if (request.params.group === "1")
        response.json(output.filter((x) => x.Group === "1"));
      else if (request.params.group === "2")
        response.json(output.filter((x) => x.Group === "2"));
      else response.json(output);
    } else {
      response.json({ error: "No trains found at station" });
      return;
    }
  }
});

/**
 * Gets next arrivals of a given station that includes arrivals from transfer stations
 * @param station The station you want to get the next arrivals from
 * @param group what group of trains you want to get. Accepted inputs are "1" and "2". Put any other value to include both groups
 * Note: In WMATA's api, trains are put in 2 groups to denote what tracks they are one. However, it doesn't correlate to the physical
 * track number.
 * @returns json file containing array of train objecs. See "train" interface in interfaces_and_classes.tsx
 */
app.get("/rail/arrival/:station/:group?/transf", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=20");
  if (request.params.station == null) {
    response.status(400).json({ error: "Provide station" });
  } else {
    let code = rail.stationNames.getCode(request.params.station)!;
    let output = rail.trains.get(code);
    if (output) {
      if (rail.stations.get(code) === undefined) {
        response.json({ error: "Invalid station" });
        return;
      }
      if (rail.stations.get(code)?.StationTogether1 !== "") {
        let temp = rail.trains.get(rail.stations.get(code)!.StationTogether1);
        if (temp) output = output.concat(temp);
      }
      if (request.params.group === "1")
        response.json(output.filter((x) => x.Group === "1"));
      else if (request.params.group === "2")
        response.json(output.filter((x) => x.Group === "2"));
      else response.json(output);
    } else {
      response.json({ error: "No trains found at station" });
      return;
    }
  }
});

/**
 * Returns status of the  services that fetches data frequently
 * @param service which specific service you want to check 
 * @returns json with status of the service requested
 */
app.get("/status/:service", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=600");
  if (request.params.service == 'bus_arrival') {
    response.json(backend.fetch_status.bus_arrival);
  }
  else if (request.params.service == 'rail_arrival') {
    response.json(backend.fetch_status.rail_arrival);
  }
  else if (request.params.service == 'bus_alerts') {
    response.json(backend.fetch_status.bus_alerts);
  }
  else if (request.params.service == 'rail_alerts') {
    response.json(backend.fetch_status.rail_alerts);
  }
  else if (request.params.service == 'bus_database_status') {
    response.json(backend.fetch_status.rail_alerts);
  }
  else{
    response.status(400).json({ error: "Invalid service type" });
  }
});

/**
 * Returns status of the  services that fetches data frequently
 * @returns json with status of services
 */
app.get("/status", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=600");
  response.json(backend.fetch_status);
});

/**
 * NOTE: WMATA stopped using off-peak fares and simplified it to only using peak-fares all weekday until 9:30pm.
 * Gets the fare information from one station to another. The fare is determined on how far you
 * travel so it will depend on which station you start and end at
 * @param source The origin station
 * @param dest The destination station
 * @returns json with object that contains fare information. See "fares" interface in interfaces_and_classes.tsx
 */
app.get("/rail/fares/:source/to/:dest", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=604800");
  if (request.params.source == null || request.params.dest == null) {
    response.status(400).json({ 
      error: "Provide source and destination station" 
    });
  }
  let source = rail.stationNames.getCode(request.params.source)!;
  let dest = rail.stationNames.getCode(request.params.dest)!;
  let output = rail.stations.get(source)?.fares.get(dest);

  if (output === undefined)
    response.status(404).json({ error: "Fare not found" });
  else response.json(output);
});

/**
 * Gets all entrances from a certain station
 * @param station What station you want to get the entrances from.
 * @return json with array of entrances. See "entrance" interface in interfaces_and_classes.tsx
 */
app.get("/rail/entrances/:station", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=604800");
  if (request.params.station == null) {
    response.status(400).json({ error: "Provide station" });
  } else {
    let code = rail.stationNames.getCode(request.parsms.station)!;
    let output = rail.stations.get(code)?.entrances;
    if (output === undefined) response.status(404);
    else response.json(output);
  }
});

app.get("/rail/trainpositions", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.json(rail.train_positions);
});

app.get("/rail/stations/list/:get?", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=31557600");
  let code = rail.stationNames.getCode(request.params.station)!;
  let output = rail.stations.get(code);
  if (request.params.get === "codes") response.json(rail.stationNames.codeArray);
  else if (request.params.get === "names")
    response.json(rail.stationNames.nameArray);
  else if (request.params.get === "lines")
    response.json(Object.fromEntries(rail.stationNames.lineArray));
  else if (output === undefined) response.json(rail.stationNames.nameArray);
  else response.json(output);
});

app.get("/rail/stations/:station?", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=604800");
  if (request.params.station == null) {
    let temp: any = [];
    rail.stations.forEach((e: any) => temp.push(e));
    response.json(temp);
  } else {
    let code = rail.stationNames.getCode(request.params.station)!;
    let output = rail.stations.get(code);
    if (output === undefined) response.status(404);
    else response.json(output);
  }
});

app.get("/rail/alerts", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=600");
  let output = [];
  if (request.query.line !== undefined) {
    for (const e of rail.railAlerts) {
      let temp = e.LinesAffected.split(/;[\s]?/).filter(function (fn: any) {
        return fn !== "";
      });
      if (temp.includes(request.query.line)) {
        output.push(e);
      }
    }
    response.json(output);
    return;
  } else {
    response.json(rail.railAlerts);
  }
});

app.get("/rail/schedule/calendar", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=600");
  let output = [];
  if (rail.schedule_calendar_object == undefined) {
    response.json({
      error:
        "System ran into error getting rail schedule calendar. Please try again later.",
    });
  } else {
    //console.log(rail.schedule_calendar_object)
    response.json(rail.schedule_calendar_object);
  }
});



app.get("/bus/alerts", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=600");
  let output = [];
  if (request.query.line !== undefined) {
    for (const e of bus.bus_alerts) {
      let temp = e.LinesAffected.split(/;[\s]?/).filter(function (fn: any) {
        return fn !== "";
      });
      if (temp.includes(request.query.line)) {
        output.push(e);
      }
    }
    response.json(output);
    return;
  } else {
    response.json(bus.bus_alerts);
  }
});

app.get("/bus/arrival/:stopid", async function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  if (request.query.stopid !== undefined) {
    var info = bus.bus_stops.get(request.params.stopid);
    if (info === undefined) {
      response.json({ error: "Stop not found" });
    } else {
      response.json(info);
    }
  } else response.json({ error: "Stop not found" });
});

app.get("/bus/nearby/:lat/:lon/:radius", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  if (backend.bootstrap_status.bus_stops === "RUNNING") {
    response.json({ error: "System is booting up. Please try again later." });
  } else if (backend.bootstrap_status.bus_stops === "ERROR") {
    response.json({
      error:
        "System ran into error fetching bus stops. Please try again later.",
    });
  } else {
    if(request.params.lat == undefined || request.params.lon == undefined || request.params.radius == undefined){
      response.json({
        error:
          "Parameters weren't given.",
      });
    }
    else{
      response.json(bus.get_nearest_bus_stops(request.params.lat, request.params.lon, request.params.radius));
    }
  };
});

app.get("/bus/stop/:stopid", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  if (backend.bootstrap_status.bus_stops === "RUNNING") {
    response.json({ error: "System is booting up. Please try again later." });
  } 
  else if (backend.bootstrap_status.bus_stops === "ERROR") {
    response.json({
      error:
        "System ran into error fetching bus stops. Please try again later.",
    });
  } 
  else {
    response.json(bus.bus_stops.get(request.params.stopid))
  }
});

app.get("/bus/routes/:route?/:direction?", function (request: any, response: any) {
    response.set("Access-Control-Allow-Origin", "*");
    if (backend.bootstrap_status.bus_routes === "RUNNING") {
      response.json({ error: "System is booting up. Please try again later." });
    } 
    else if (backend.bootstrap_status.bus_routes === "ERROR") {
      response.json({
        error:
          "System ran into error fetching bus routes. Please try again later.",
      });
    } 
    else {
      if(request.params.route){
        if(request.params.direction == "1"){
          response.json(bus.bus_routes.get(request.params.route)?.paths.Direction1);
        }
        else if(request.params.direction == "0"){
          response.json(bus.bus_routes.get(request.params.route)?.paths.Direction0);
        }
        else{
          response.json(bus.bus_routes.get(request.params.route));
        }
      }
      else{
        response.json(bus.bus_route_list);
      }
    }
  },
);

app.get("/bus/routes/:route/:direction/stops", function (request: any, response: any) {
    response.set("Access-Control-Allow-Origin", "*");
    if (backend.bootstrap_status.bus_routes === "RUNNING") {
      response.json({ 
        error: "System is booting up. Please try again later." 
      });
    } 
    else if (backend.bootstrap_status.bus_routes === "ERROR") {
      response.json({
        error: "System ran into error fetching bus routes. Please try again later.",
      });
    } 
    else {
      if(request.params.route){
        if(request.params.direction == "1"){
          response.json(bus.bus_routes.get(request.params.route)?.paths.Direction1.Stops);
        }
        else if(request.params.direction == "0"){
          response.json(bus.bus_routes.get(request.params.route)?.paths.Direction0.Stops);
        }
        else{
          response.json({ 
            error: "Invalid direction number. Valid direction numbers are \"1\" and \"0\"." 
          }).status(400);
        }
      }
      else{
        response.json({ 
          error: "Invalid Route." 
        }).status(400);
      }
    }
  },
);
app.get("/rail/schedule/:stop", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  if (rail.schedule_data == null) {
    response.json({ error: "System is booting up. Please try again later." });
  } 
  else if (backend.bootstrap_status.bus_stops === "ERROR") {
    response.json({
      error:
        "System ran into error fetching bus stops. Please try again later.",
    });
  } 
  else {
    if(request.params.stop){
      let code = rail.stationNames.getCode(request.params.stop)!;
      let output = rail.schedule_data.get(code)
      if (output == undefined){
        output = []
      }
      if (rail.stations.get(code) === undefined) {
        response.json({ error: "Invalid station" });
        return;
      }
      if (output == undefined){
        output = []
      }
      response.json(output);
      //response.json(rail.schedule_data.get(request.params.stop))
    }
    else{
      response.json({ 
        error: "Station is invalid" 
      });
    }
  }
});
app.get("/rail/schedule/full/:stop", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  if (rail.schedule_data_full == null) {
    response.json({ error: "System is booting up. Please try again later." });
  } 
  else if (backend.bootstrap_status.bus_stops === "ERROR") {
    response.json({
      error:
        "System ran into error fetching bus stops. Please try again later.",
    });
  } 
  else {
    if(request.params.stop){
      let code = rail.stationNames.getCode(request.params.stop)!;
      let output = rail.schedule_data_full.get(code)
      if (output == undefined){
        output = []
      }
      if (rail.stations.get(code) === undefined) {
        response.json({ error: "Invalid station" });
        return;
      }
      if (output == undefined){
        output = []
      }
      response.json(output);
      //response.json(rail.schedule_data.get(request.params.stop))
    }
    else{
      response.json({ 
        error: "Station is invalid" 
      });
    }
  }
});

app.get("/rail/schedule/:stop/includeTransf", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  if (rail.schedule_data == null) {
    response.json({ error: "System is booting up. Please try again later." });
  } 
  else if (backend.bootstrap_status.bus_stops === "ERROR") {
    response.json({
      error:
        "System ran into error fetching bus stops. Please try again later.",
    });
  } 
  else {
    if(request.params.stop){
      let code = rail.stationNames.getCode(request.params.stop)!;
      let output = rail.schedule_data.get(code)
      if (output == undefined){
        output = []
      }
      if (rail.stations.get(code) === undefined) {
        response.json({ error: "Invalid station" });
        return;
      }
      if (rail.stations.get(code)?.StationTogether1 !== "") {
        let temp = rail.schedule_data.get(rail.stations.get(code)!.StationTogether1);

        if (temp != undefined) {
          output = output.concat(temp);
          if (output == undefined){
            output = []
          }
        }
      }
      response.json(output);
      //response.json(rail.schedule_data.get(request.params.stop))
    }
    else{
      response.json({ 
        error: "Station is invalid" 
      });
    }
  }
});

app.get("/rail/outages/escalator/:station?", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  if (backend.bootstrap_status.stations_fares_entrances === "RUNNING") {
    response.json({ 
      error: "System is booting up. Please try again later." 
    });
  } 
  else if (backend.bootstrap_status.stations_fares_entrances === "ERROR") {
    response.json({
      error: "System ran into error fetching bus routes. Please try again later.",
    });
  } 
  else {
    if(request.params.station != undefined){
      if (rail.stations.get(request.params.station) === undefined) {
        response.json({ error: "Invalid station" });
        return;
      }
      else{
        response.json(
          rail.escalator_elevator_outages.filter((x:any) => x.UnitType == "ESCALATOR" && x.StationCode == rail.stations.get(request.params.station)!.Code)
        )
      }
    }
    else{
      response.json(
        rail.escalator_elevator_outages.filter((x:any) => x.UnitType == "ESCALATOR")
      )
    }
  }
});

app.get("/rail/outages/elevator/:station?", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  if (backend.bootstrap_status.stations_fares_entrances === "RUNNING") {
    response.json({ 
      error: "System is booting up. Please try again later." 
    });
  } 
  else if (backend.bootstrap_status.stations_fares_entrances === "ERROR") {
    response.json({
      error: "System ran into error fetching bus routes. Please try again later.",
    });
  } 
  else {
    if(request.params.station != undefined){
      if (rail.stations.get(request.params.station) === undefined) {
        response.json({ error: "Invalid station" });
        return;
      }
      else{
        response.json(
          rail.escalator_elevator_outages.filter((x:any) => x.UnitType == "ELEVATOR" && x.StationCode == rail.stations.get(request.params.station)!.Code)
        )
      }
    }
    else{
      response.json(
        rail.escalator_elevator_outages.filter((x:any) => x.UnitType == "ELEVATOR")
      )
    }
  }
});

//Catchall function to handle invalid endpoints.
app.get("/*", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.json({ 
    error: "ummm... that wasn't a valid endpoint" 
  });
});

//Catchall function to handle invalid endpoints.
app.get("/api/*", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.json({ 
    error: "ummm... that wasn't a valid endpoint" 
  });
});

export const server: any = app.listen(process.env.BACKEND_PORT || 4000, () => {
  backend.main();
  console.log(`Example app listening on port ${process.env.BACKEND_PORT}`);
});

export var shutdown = function (message: string) {
  console.log(message);
  server.close();
};

/*
const server = https.createServer({
    key: fs.readFileSync("api/dc-metro-api-key.pem"),
    cert: fs.readFileSync("api/cert.pem"),
  },
  app);

server.listen(4000, () => {
    backend.main();
  console.log(`App listening on https://localhost:${4000}`);
});
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
        response.json(railAlerts);
    }
});*/

module.exports = server;
