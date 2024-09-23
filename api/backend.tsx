/**
 * This is the code that handles starting up the project and hodling logs and statuses of
 * the running project.
 * @author Samuel Johnson
 */

import * as bus from "./bus";
import * as rail from "./rail";
import * as database from "./database";
import * as rail_db from "./read_rail_schedule";
import * as bus_db from "./read_bus_schedule";
import "./routes";
import { error_template } from "./interfaces_and_classes";
import { shutdown } from "./routes";
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../..", ".env.local"),
});

//export var error_log: error_template[] = [];

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

export var fetch_status = {
  bus_arrival: {
    status: "SUCCESS",
    last_success_timestamp: 0,
    last_error_timestamp: 0,
    error_function: "",
    error_code: "",
  },
  rail_arrival: {
    status: "SUCCESS",
    last_success_timestamp: 0,
    last_error_timestamp: 0,
    error_function: "",
    error_code: "",
  },
  rail_alerts: {
    status: "SUCCESS",
    last_success_timestamp: 0,
    last_error_timestamp: 0,
    error_function: "",
    error_code: "",
  },
  bus_alerts: {
    status: "SUCCESS",
    last_success_timestamp: 0,
    last_error_timestamp: 0,
    error_function: "",
    error_code: "",
  },
  bus_database_status: {
    service_id: 0,
    status: "SUCCESS",
    last_success_timestamp: 0,
    last_error_timestamp: 0,
    error_function: "",
    error_code: "",
  },
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
  // await bus_db.read_bus_schedule_new();

  // await bus_db.read_bus_schedule_new();
  // await rail_db.read_rail_schedule();
  await runAtSpecificTimeOfDay(4, 30, () => update_both_database());
  // await runAtSpecificTimeOfDay(4, 30, () => bus_db.read_bus_schedule_new());
  //  await runAtSpecificTimeOfDay(4, 35, () => rail_db.read_rail_schedule());
  await bootstrap_get_station_data();
  await bootstrap_bus_stops();
  await bootstrap_get_rail_alerts();
  await bootstrap_get_train_data();
  await bootstrap_train_positions();
  await bootstrap_get_bus_alerts();

  await rail.get_elevator_escalator_alerts();
  //await database.get_train_schedule_today()
  //await bus.read_bus_trip_data();
  await rail.update_rail_schedule();
  //await rail.update_full_rail_schedule()
  await database.update_bus_data();
  await bus.update_bus_data();
  //database.refresh_bus_database()

  await bootstrap_bus_routes();
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

async function update_both_database() {
  await bus_db.read_bus_schedule_new();
  await rail_db.read_rail_schedule();
}

export async function bootstrap_get_train_data() {
  bootstrap_status.next_train = "RUNNING";
  var status = await rail.get_train_data();
  bootstrap_status.next_train = status;

  if (status === "ERROR") {
    /*if (bootstrap_retry_counter.next_train >= MAX_RETRY) {
      shutdown(
        "Max number of fetches during startup exceeded. Shutting down...n/ Cause: bootstrap_get_train_data",
      );
    } else bootstrap_retry_counter.next_train++;*/
    console.log("get_train_data() ran into Error. Trying again in 10 seconds");
    setTimeout(bootstrap_get_train_data, 10000);
  }
}

export async function bootstrap_get_station_data() {
  bootstrap_status.stations_fares_entrances = "RUNNING";
  var status = await rail.get_station_data();
  bootstrap_status.stations_fares_entrances = status;

  if (status === "ERROR") {
    if (bootstrap_retry_counter.stations_fares_entrances >= MAX_RETRY) {
      shutdown(
        "Max number of fetches during startup exceeded. Shutting down...n/ Cause: bootstrap_get_data",
      );
    } else bootstrap_retry_counter.stations_fares_entrances++;
    console.log("Bus stop caching ran into Error. Trying again in 10 seconds");
    setTimeout(bootstrap_get_station_data, 10000);
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

export function handleErrors(
  error: any,
  functionName: string,
  service: string,
) {
  var time = Date.now();
  if (error.code == "ENOTFOUND") {
    console.error(`ERROR: "${functionName}" -- ${error.message}`);
  } else if (error.code == "CONNECT_TIMEOUT") {
    console.error(`ERROR: "${functionName}" -- Connection timeout to server`);
  } else if (error.code == "EHOSTUNREACH") {
    console.error(`ERROR: "${functionName}" -- No route to host`);
  } else {
    console.error(`ERROR: "${functionName}" -- ${error.message}`);
  }
  if (service == "bus_arrival") {
    fetch_status.bus_arrival.status = "ERROR";
    fetch_status.bus_arrival.last_error_timestamp = time;
    fetch_status.bus_arrival.error_function = functionName;
    fetch_status.bus_arrival.error_code = error.error_code;
  } else if (service == "rail_arrival") {
    fetch_status.rail_arrival.status = "ERROR";
    fetch_status.rail_arrival.last_error_timestamp = time;
    fetch_status.rail_arrival.error_function = functionName;
    fetch_status.rail_arrival.error_code = error.error_code;
  } else if (service == "bus_alerts") {
    fetch_status.bus_alerts.status = "ERROR";
    fetch_status.bus_alerts.last_error_timestamp = time;
    fetch_status.bus_alerts.error_function = functionName;
    fetch_status.bus_alerts.error_code = error.error_code;
  } else if (service == "rail_alerts") {
    fetch_status.rail_alerts.status = "ERROR";
    fetch_status.rail_alerts.last_error_timestamp = time;
    fetch_status.rail_alerts.error_function = functionName;
    fetch_status.rail_alerts.error_code = error.error_code;
  } else if (service == "bus_database_status") {
    fetch_status.bus_database_status.status = "ERROR";
    fetch_status.bus_database_status.last_error_timestamp = time;
    fetch_status.bus_database_status.error_function = functionName;
    fetch_status.bus_database_status.error_code = error.error_code;
  }
}

export function handleSuccess(service: string) {
  var time = Date.now();
  if (service == "bus_arrival") {
    if (fetch_status.bus_arrival.status != "SUCCESS") {
      console.info("SUCCESS: bus_arrival recovered");
    }
    fetch_status.bus_arrival.status = "SUCCESS";
    fetch_status.bus_arrival.last_success_timestamp = time;
  } else if (service == "rail_arrival") {
    if (fetch_status.rail_arrival.status != "SUCCESS") {
      console.info("SUCCESS: rail_arrival recovered");
    }
    fetch_status.rail_arrival.status = "SUCCESS";
    fetch_status.rail_arrival.last_success_timestamp = time;
  } else if (service == "bus_alerts") {
    if (fetch_status.bus_alerts.status != "SUCCESS") {
      console.info("SUCCESS: bus_alerts recovered");
    }
    fetch_status.bus_alerts.status = "SUCCESS";
    fetch_status.bus_alerts.last_success_timestamp = time;
  } else if (service == "rail_alerts") {
    if (fetch_status.rail_alerts.status != "SUCCESS") {
      console.info("SUCCESS: rail_alerts recovered");
    }
    fetch_status.rail_alerts.status = "SUCCESS";
    fetch_status.rail_alerts.last_success_timestamp = time;
  } else if (service == "bus_database_status") {
    if (fetch_status.bus_database_status.status != "SUCCESS") {
      console.info("SUCCESS: bus_database_status recovered");
    }
    fetch_status.bus_database_status.status = "SUCCESS";
    fetch_status.bus_database_status.last_success_timestamp = time;
  }
}

export async function runAtSpecificTimeOfDay(
  hour: number,
  minutes: number,
  func: any,
) {
  //console.log("HELLOOO");
  const twentyFourHours = 86400000;
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
  );
  const later = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minutes,
    0,
    0,
  ).getTime();
  let eta_ms = later - now.getTime();
  if (eta_ms < 0) {
    eta_ms += twentyFourHours;
  }
  // console.log(eta_ms);
  setTimeout(async function () {
    //run once
    // console.log("HEY");
    await func();

    // run every 24 hours from now on
    setInterval(func, twentyFourHours);
  }, eta_ms);
}

export async function update_database() {}
