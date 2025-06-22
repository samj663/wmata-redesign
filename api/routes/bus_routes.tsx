import * as backend from "../backend";
import * as rail from "../rail";
import * as bus from "../bus";
import * as query from "../database_user_query";
const express = require("express");
const path = require("path");
export const app = express();

export function expressapp(app:any){
    app.get(
      "/bus/schedule/timetable/:stop_id/:day/:month/:year",
      async function (request: any, response: any) {
        if (
          request.params.stop_id &&
          request.params.day &&
          request.params.month &&
          request.params.year
        ) {
          response.json(
            await query.get_bus_schedule_timetable_TESTING(
              request.params.stop_id,
              `${request.params.year}-${request.params.month}-${request.params.day} EST`,
            ),
          );
        }
      },
    );

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
      if (request.params.stopid !== undefined) {
        var info = bus.bus_stops.get(request.params.stopid);
        if (info === undefined) {
          response.json({ error: "Stop not found" });
        } else {
          response.json(info);
        }
      } else response.json({ error: "Stop not found" });
    });
    
    app.get(
      "/bus/nearby/:lat/:lon/:radius",
      function (request: any, response: any) {
        response.set("Access-Control-Allow-Origin", "*");
        if (backend.bootstrap_status.bus_stops === "RUNNING") {
          response.json({ error: "System is booting up. Please try again later." });
        } else if (backend.bootstrap_status.bus_stops === "ERROR") {
          response.json({
            error:
              "System ran into error fetching bus stops. Please try again later.",
          });
        } else {
          if (
            request.params.lat == undefined ||
            request.params.lon == undefined ||
            request.params.radius == undefined
          ) {
            response.json({
              error: "Parameters weren't given.",
            });
          } else {
            response.json(
              bus.get_nearest_bus_stops(
                request.params.lat,
                request.params.lon,
                request.params.radius,
              ),
            );
          }
        }
      },
    );
    
    app.get("/bus/stop/:stopid", function (request: any, response: any) {
      response.set("Access-Control-Allow-Origin", "*");
      if (backend.bootstrap_status.bus_stops === "RUNNING") {
        response.json({ error: "System is booting up. Please try again later." });
      } else if (backend.bootstrap_status.bus_stops === "ERROR") {
        response.json({
          error:
            "System ran into error fetching bus stops. Please try again later.",
        });
      } else {
        response.json(bus.bus_stops.get(request.params.stopid));
      }
    });
    
    app.get(
      "/bus/routes/:route?/:direction?",
      function (request: any, response: any) {
        response.set("Access-Control-Allow-Origin", "*");
        if (backend.bootstrap_status.bus_routes === "RUNNING") {
          response.json({ error: "System is booting up. Please try again later." });
        } else if (backend.bootstrap_status.bus_routes === "ERROR") {
          response.json({
            error:
              "System ran into error fetching bus routes. Please try again later.",
          });
        } else {
          if (request.params.route) {
            if (request.params.direction == "1") {
              response.json(
                bus.bus_routes.get(request.params.route)?.paths.Direction1,
              );
            } else if (request.params.direction == "0") {
              response.json(
                bus.bus_routes.get(request.params.route)?.paths.Direction0,
              );
            } else {
              response.json(bus.bus_routes.get(request.params.route));
            }
          } else {
            response.json(bus.bus_route_list);
          }
        }
      },
    );
    
    app.get(
      "/bus/routes/:route/:direction/stops",
      function (request: any, response: any) {
        response.set("Access-Control-Allow-Origin", "*");
        if (backend.bootstrap_status.bus_routes === "RUNNING") {
          response.json({
            error: "System is booting up. Please try again later.",
          });
        } else if (backend.bootstrap_status.bus_routes === "ERROR") {
          response.json({
            error:
              "System ran into error fetching bus routes. Please try again later.",
          });
        } else {
          if (request.params.route) {
            if (request.params.direction == "1") {
              response.json(
                bus.bus_routes.get(request.params.route)?.paths.Direction1.Stops,
              );
            } else if (request.params.direction == "0") {
              response.json(
                bus.bus_routes.get(request.params.route)?.paths.Direction0.Stops,
              );
            } else {
              response
                .json({
                  error:
                    'Invalid direction number. Valid direction numbers are "1" and "0".',
                })
                .status(400);
            }
          } else {
            response
              .json({
                error: "Invalid Route.",
              })
              .status(400);
          }
        }
      },
    );
    app.get(
      "/bus/schedule/run/:trip_id",
      async function (request: any, response: any) {
        if (request.params.trip_id) {
          response.json(await query.get_bus_scheduled_run(request.params.trip_id));
        }
      },
    );
    app.get(
      "/bus/route/path/:route",
      async function (request: any, response: any) {
          response.json(await query.get_bus_route_path(request.params.route));
        
      },
    );
    app.get(
      "/bus/route/path/:route/geojson",
      async function (request: any, response: any) {
          response.json(await query.get_bus_route_path_geojson(request.params.route));
        
      },
    );
}
