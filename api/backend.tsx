/**
 * This is the code that handles starting up the project and hodling logs and statuses of
 * the running project.
 * @author Samuel Johnson
 */

import * as bus from "./bus";
import * as rail from "./rail";
import "./routes";
import { error_template } from "./interfaces_and_classes";
import { shutdown } from "./routes";
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../..", ".env.local"),
});

export var error_log: error_template[] = [];

export var lastUpdated = {
  next_train: null,
  stations_fares_entrances: null,
  alerts: null,
};

export var bootstrap_status = {
  bus_routes: "RUNNING",
  bus_route_list: "RUNNING",
  bus_stops: "RUNNING",
  next_train: "RUNNING",
  train_positions: "RUNNING",
  stations_fares_entrances: "RUNNING",
  rail_alerts: "RUNNING",
  bus_alerts: "RUNNING",
};

const MAX_RETRY = 5;

/**
 * This keeps track of how many retrys happend when system starts up.
 * If it exceeds an amount, the program shuts down.
 */
export var bootstrap_retry_counter = {
  bus_routes: 0,
  bus_stops: 0,
  next_train: 0,
  stations_fares_entrances: 0,
  rail_alerts: 0,
  train_positions: 0,
};

/**
 * Starts up backend system and manage when to get next arrival data
 */
export async function main() {
  bootstrap_get_rail_alerts();
  bootstrap_get_data();
  bootstrap_get_train_data();
  bootstrap_bus_stops();
  bootstrap_bus_routes();
  bootstrap_train_positions();
  bootstrap_get_bus_alerts();
}
//get_bus_alerts_gtft_rt()
export async function bootstrap_get_rail_alerts() {
  bootstrap_status.rail_alerts = "RUNNING";
  //  var status = await rail.get_rail_alerts();
  var status = await rail.get_rail_alerts_gtft_rt();
  bootstrap_status.rail_alerts = status;

  if (status === "ERROR") {
    if (bootstrap_retry_counter.rail_alerts >= MAX_RETRY) {
      shutdown(
        "Max number of fetches during startup exceeded. Shutting down...n/ Cause: bootstrap_get_rail_alerts",
      );
    } else bootstrap_retry_counter.rail_alerts++;
    console.log("Bus stop caching ran into Error. Trying again in 10 seconds");
    setTimeout(bootstrap_get_rail_alerts, 10000);
  }
}

export async function bootstrap_get_bus_alerts() {
  bootstrap_status.bus_alerts = "RUNNING";
  //  var status = await rail.get_rail_alerts();
  var status = await bus.get_bus_alerts_gtft_rt();
  bootstrap_status.bus_alerts = status;

  if (status === "ERROR") {
    if (bootstrap_retry_counter.rail_alerts >= MAX_RETRY) {
      shutdown(
        "Max number of fetches during startup exceeded. Shutting down...n/ Cause: bootstrap_get_rail_alerts",
      );
    } else bootstrap_retry_counter.rail_alerts++;
    console.log("Bus stop caching ran into Error. Trying again in 10 seconds");
    setTimeout(bootstrap_get_bus_alerts, 10000);
  }
}

export async function bootstrap_get_train_data() {
  bootstrap_status.next_train = "RUNNING";
  var status = await rail.get_train_data();
  bootstrap_status.next_train = status;

  if (status === "ERROR") {
    if (bootstrap_retry_counter.next_train >= MAX_RETRY) {
      shutdown(
        "Max number of fetches during startup exceeded. Shutting down...n/ Cause: bootstrap_get_train_data",
      );
    } else bootstrap_retry_counter.next_train++;
    console.log("Bus stop caching ran into Error. Trying again in 10 seconds");
    setTimeout(bootstrap_get_train_data, 10000);
  }
}

export async function bootstrap_get_data() {
  bootstrap_status.stations_fares_entrances = "RUNNING";
  var status = await rail.get_data();
  bootstrap_status.stations_fares_entrances = status;

  if (status === "ERROR") {
    if (bootstrap_retry_counter.stations_fares_entrances >= MAX_RETRY) {
      shutdown(
        "Max number of fetches during startup exceeded. Shutting down...n/ Cause: bootstrap_get_data",
      );
    } else bootstrap_retry_counter.stations_fares_entrances++;
    console.log("Bus stop caching ran into Error. Trying again in 10 seconds");
    setTimeout(bootstrap_get_data, 10000);
  }
}

export async function bootstrap_bus_stops() {
  bootstrap_status.bus_stops = "RUNNING";
  var status = await bus.get_bus_stops();
  bootstrap_status.bus_stops = status;

  if (status === "ERROR") {
    if (bootstrap_retry_counter.bus_stops >= MAX_RETRY) {
      shutdown(
        "Max number of fetches during startup exceeded. Shutting down...n/ Cause: bootstrap_bus_stop",
      );
    } else bootstrap_retry_counter.bus_stops++;
    console.log("Bus stop caching ran into Error. Trying again in 10 seconds");
    setTimeout(bootstrap_bus_stops, 10000);
  }
}

export async function bootstrap_bus_routes() {
  bootstrap_status.bus_routes = "RUNNING";
  var status = await bus.get_bus_routes();
  bootstrap_status.bus_routes = status;

  if (status === "ERROR") {
    if (bootstrap_retry_counter.bus_routes >= MAX_RETRY) {
      shutdown(
        "Max number of fetches during startup exceeded. Shutting down...n/ Cause: bootstrap_bus_routes",
      );
    } else bootstrap_retry_counter.bus_routes++;
    console.log(
      "Bus routes caching ran into Error. Trying again in 10 seconds",
    );
    setTimeout(bootstrap_bus_routes, 10000);
  }
}

export async function bootstrap_train_positions() {
  bootstrap_status.train_positions = "RUNNING";
  var status = await rail.get_train_positions();
  bootstrap_status.train_positions = status;

  if (status === "ERROR") {
    if (bootstrap_retry_counter.train_positions >= MAX_RETRY) {
      shutdown(
        "Max number of fetches during startup exceeded. Shutting down...n/ Cause: bootstrap_bus_routes",
      );
    } else bootstrap_retry_counter.train_positions++;
    console.log(
      "Bus routes caching ran into Error. Trying again in 10 seconds",
    );
    setTimeout(bootstrap_train_positions, 5000);
  }
}

/**
 * Delays a function. Used to make sute rate limit isn't exceeded when calling WMATA's API.
 * @param millisec how long to delay the function in milliseconds.
 * @returns a promise
 */
export function delay(millisec: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("");
    }, millisec);
  });
}
