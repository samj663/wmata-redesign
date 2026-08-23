/**
 * This file defines all the endpoints for this project's API
 * @author Samuel Johnson
 */

import * as backend from "./backend";
import * as rail from "./rail";
import * as bus from "./bus";
import * as query from "./database_user_query";
import * as old_routes from "./routes/old_routes"
import * as bus_routes from "./routes/bus_routes"
import * as rail_schedule from "./routes/rail_schedule"
const express = require("express");
const path = require("path");
export const app = express();
//const https = require("https");
//const fs = require("fs");
old_routes.expressapp(app);
bus_routes.expressapp(app);
rail_schedule.expressapp(app);


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



/*
    Below are rewrites of endpoints above to make them more clear.
    These will be the new endpoints when all other projects are updated to use them.
*/

app.get("/", function (request: any, response: any) {
  response.send("This is the DC Metro API backend");
});

/**
 * Returns status of the  services that fetches data frequently
 * @param service which specific service you want to check
 * @returns json with status of the service requested
 */
app.get("/status/:service", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=600");
  if (request.params.service == "bus_arrival") {
    response.json(backend.fetch_status.bus_arrival);
  } else if (request.params.service == "rail_arrival") {
    response.json(backend.fetch_status.rail_arrival);
  } else if (request.params.service == "bus_alerts") {
    response.json(backend.fetch_status.bus_alerts);
  } else if (request.params.service == "rail_alerts") {
    response.json(backend.fetch_status.rail_alerts);
  } else if (request.params.service == "bus_database_status") {
    response.json(backend.fetch_status.rail_alerts);
  } else {
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
 * Gets next arrivals of a given station
 * @param station The station you want to get the next arrivals from
 * @param group what group of trains you want to get. Accepted inputs are "1" and "2" Note: In WMATA's api,
 * trains are put in 2 groups to denote what tracks they are one. However, it doesn't correlate to the physical
 * track number.
 * @returns json file containing array of train objecs. See "train" interface in interfaces_and_classes.tsx
 */
app.get(
  ["/rail/arrival/:station/{:group}","/rail/arrival/:station"],
  function (request: any, response: any) {
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
  },
);

/**
 * Gets next arrivals of a given station that includes arrivals from transfer stations
 * @param station The station you want to get the next arrivals from
 * @param group what group of trains you want to get. Accepted inputs are "1" and "2". Put any other value to include both groups
 * Note: In WMATA's api, trains are put in 2 groups to denote what tracks they are one. However, it doesn't correlate to the physical
 * track number.
 * @returns json file containing array of train objecs. See "train" interface in interfaces_and_classes.tsx
 */
app.get(
  ["/rail/arrival/:station/{:group}/transf", "/rail/arrival/:station//transf"],
  function (request: any, response: any) {
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
  },
);

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
      error: "Provide source and destination station",
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

app.get(["/rail/stations/list/{:get}", "/rail/stations/list"], function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=31557600");
  let code = rail.stationNames.getCode(request.params.station)!;
  let output = rail.stations.get(code);
  if (request.params.get === "codes")
    response.json(rail.stationNames.codeArray);
  else if (request.params.get === "names")
    response.json(rail.stationNames.nameArray);
  else if (request.params.get === "lines")
    response.json(Object.fromEntries(rail.stationNames.lineArray));
  else if (output === undefined) response.json(rail.stationNames.nameArray);
  else response.json(output);
});

app.get(["/rail/stations/{:station}","/rail/stations"], function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=604800");
  if (request.params.station == null) {
    let temp: any = [];
    rail.stations.forEach((e: any) => temp.push(e));
    response.json(temp);
  } else {
    let code = rail.stationNames.getCode(request.params.station)!;
    let output = rail.stations.get(code);
    if (output === undefined) response.status(404).json({ error: "Invalid station" });
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

app.get(
  ["/rail/outages/escalator/{:station}", "/rail/outages/escalator"],
  function (request: any, response: any) {
    response.set("Access-Control-Allow-Origin", "*");
    if (backend.bootstrap_status.stations_fares_entrances === "RUNNING") {
      response.json({
        error: "System is booting up. Please try again later.",
      });
    } else if (backend.bootstrap_status.stations_fares_entrances === "ERROR") {
      response.json({
        error:
          "System ran into error fetching bus routes. Please try again later.",
      });
    } else {
      if (request.params.station != undefined) {
        if (rail.stations.get(request.params.station) === undefined) {
          response.json({ error: "Invalid station" });
          return;
        } else {
          response.json(
            rail.escalator_elevator_outages.filter(
              (x: any) =>
                x.UnitType == "ESCALATOR" &&
                x.StationCode ==
                  rail.stations.get(request.params.station)!.Code,
            ),
          );
        }
      } else {
        response.json(
          rail.escalator_elevator_outages.filter(
            (x: any) => x.UnitType == "ESCALATOR",
          ),
        );
      }
    }
  },
);

app.get(
  ["/rail/outages/elevator/{:station}", "/rail/outages/elevator"],
  function (request: any, response: any) {
    response.set("Access-Control-Allow-Origin", "*");
    if (backend.bootstrap_status.stations_fares_entrances === "RUNNING") {
      response.json({
        error: "System is booting up. Please try again later.",
      });
    } else if (backend.bootstrap_status.stations_fares_entrances === "ERROR") {
      response.json({
        error:
          "System ran into error fetching bus routes. Please try again later.",
      });
    } else {
      if (request.params.station != undefined) {
        if (rail.stations.get(request.params.station) === undefined) {
          response.json({ error: "Invalid station" });
          return;
        } else {
          response.json(
            rail.escalator_elevator_outages.filter(
              (x: any) =>
                x.UnitType == "ELEVATOR" &&
                x.StationCode ==
                  rail.stations.get(request.params.station)!.Code,
            ),
          );
        }
      } else {
        response.json(
          rail.escalator_elevator_outages.filter(
            (x: any) => x.UnitType == "ELEVATOR",
          ),
        );
      }
    }
  },
);

app.get(
  "/app/ios/active",
  function (request: any, response: any) {
    response.set("Access-Control-Allow-Origin", "*");
    if (backend.bootstrap_status.stations_fares_entrances === "RUNNING") {
      response.json({
        error: "System is booting up. Please try again later.",
      });
    } else if (backend.bootstrap_status.stations_fares_entrances === "ERROR") {
      response.json({
        error:
          "System ran into error fetching bus routes. Please try again later.",
      });
    } else {
      response.json({versions:backend.app_versions.ios.active})
    }
  },
);

//Catchall function to handle invalid endpoints.
app.get("/*all", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  response.json({
    error: "ummm... that wasn't a valid endpoint",
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
