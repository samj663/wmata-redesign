import * as backend from "../backend";
import * as rail from "../rail";
import * as bus from "../bus";
import * as query from "../database_user_query";
const express = require("express");
const path = require("path");
export const app = express();

export function expressapp(app:any){


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

app.get(
  "/rail/schedule/run/:trip_id",
  async function (request: any, response: any) {
    if (request.params.trip_id) {
      response.json(await query.get_rail_scheduled_run(request.params.trip_id));
    }
  },
);


app.get(
  "/rail/schedule/timetable/:stop_id/:day/:month/:year",
  async function (request: any, response: any) {
    if (
      request.params.stop_id &&
      request.params.day &&
      request.params.month &&
      request.params.year
    ) {
      response.json(
        await query.get_rail_schedule_timetable(
          request.params.stop_id,
          `${request.params.month}-${request.params.day}-${request.params.year}`,
        ),
      );
    }
  },
);

app.get("/rail/schedule/:stop", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  if (rail.schedule_data == null) {
    response.json({ error: "System is booting up. Please try again later." });
  } else if (backend.bootstrap_status.bus_stops === "ERROR") {
    response.json({
      error:
        "System ran into error fetching bus stops. Please try again later.",
    });
  } else {
    if (request.params.stop) {
      let code = rail.stationNames.getCode(request.params.stop)!;
      let output = rail.schedule_data.get(code);
      if (output == undefined) {
        output = [];
      }
      if (rail.stations.get(code) === undefined) {
        response.json({ error: "Invalid station" });
        return;
      }
      if (output == undefined) {
        output = [];
      }
      response.json(output);
      //response.json(rail.schedule_data.get(request.params.stop))
    } else {
      response.json({
        error: "Station is invalid",
      });
    }
  }
});
app.get("/rail/schedule/full/:stop", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  if (rail.schedule_data_full == null) {
    response.json({ error: "System is booting up. Please try again later." });
  } else if (backend.bootstrap_status.bus_stops === "ERROR") {
    response.json({
      error:
        "System ran into error fetching bus stops. Please try again later.",
    });
  } else {
    if (request.params.stop) {
      let code = rail.stationNames.getCode(request.params.stop)!;
      let output = rail.schedule_data_full.get(code);
      if (output == undefined) {
        output = [];
      }
      if (rail.stations.get(code) === undefined) {
        response.json({ error: "Invalid station" });
        return;
      }
      if (output == undefined) {
        output = [];
      }
      response.json(output);
      //response.json(rail.schedule_data.get(request.params.stop))
    } else {
      response.json({
        error: "Station is invalid",
      });
    }
  }
});

app.get(
  "/rail/schedule/full/:stop/includeTransf",
  function (request: any, response: any) {
    response.set("Access-Control-Allow-Origin", "*");
    if (rail.schedule_data_full == null) {
      response.json({ error: "System is booting up. Please try again later." });
    } else if (backend.bootstrap_status.bus_stops === "ERROR") {
      response.json({
        error:
          "System ran into error fetching bus stops. Please try again later.",
      });
    } else {
      if (request.params.stop) {
        let code = rail.stationNames.getCode(request.params.stop)!;
        let output = rail.schedule_data_full.get(code);
        if (output == undefined) {
          output = [];
        }
        if (rail.stations.get(code) === undefined) {
          response.json({ error: "Invalid station" });
          return;
        }
        if (output == undefined) {
          output = [];
        }
        if (rail.stations.get(code)?.StationTogether1 !== "") {
          let temp = rail.schedule_data_full.get(
            rail.stations.get(code)!.StationTogether1,
          );

          if (temp != undefined) {
            output = output.concat(temp);
            if (output == undefined) {
              output = [];
            }
          }
        }
        response.json(output);
        //response.json(rail.schedule_data.get(request.params.stop))
      } else {
        response.json({
          error: "Station is invalid",
        });
      }
    }
  },
);

app.get("/rail/schedule/feed/info", function (request: any, response: any) {
  response.set("Access-Control-Allow-Origin", "*");
  if (rail.schedule_data_full == null) {
    response.json({ error: "System is booting up. Please try again later." });
  } else if (backend.bootstrap_status.bus_stops === "ERROR") {
    response.json({
      error:
        "System ran into error fetching bus stops. Please try again later.",
    });
  } else {
    response.json(rail.schedule_feed_info);
  }
});

app.get(
  "/rail/schedule/:stop/includeTransf",
  function (request: any, response: any) {
    response.set("Access-Control-Allow-Origin", "*");
    if (rail.schedule_data == null) {
      response.json({ error: "System is booting up. Please try again later." });
    } else if (backend.bootstrap_status.bus_stops === "ERROR") {
      response.json({
        error:
          "System ran into error fetching bus stops. Please try again later.",
      });
    } else {
      if (request.params.stop) {
        let code = rail.stationNames.getCode(request.params.stop)!;
        let output = rail.schedule_data.get(code);
        if (output == undefined) {
          output = [];
        }
        if (rail.stations.get(code) === undefined) {
          response.json({ error: "Invalid station" });
          return;
        }
        if (rail.stations.get(code)?.StationTogether1 !== "") {
          let temp = rail.schedule_data.get(
            rail.stations.get(code)!.StationTogether1,
          );

          if (temp != undefined) {
            output = output.concat(temp);
            if (output == undefined) {
              output = [];
            }
          }
        }
        response.json(output);
        //response.json(rail.schedule_data.get(request.params.stop))
      } else {
        response.json({
          error: "Station is invalid",
        });
      }
    }
  },
);
}