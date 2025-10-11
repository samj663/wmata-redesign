import React from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../tokens";
import { AlertsOffCanvas } from "./shared-components/AlertsOffCanvas";
import Navbar from "./shared-components/Navbar";

import train_img from "../images/greenline_metro_800_525_90.jpg";
import bus_img from "../images/WMATA_2006_Orion_VII_CNG_30_ft.jpg";
import next_arrivals_img from "../images/WMATA_PIDS_display.jpg";
import alerts_img from "../images/WMATA_PM35_at_Eisenhower_Avenue.jpg";

export default function Home() {
  const [alerts, setAlerts] = React.useState<any>([]);

  React.useEffect(() => {
    getAlerts();
  }, []);

  async function getAlerts() {
    let output: any = [];
    await fetch(`${API_URL}/rail/alerts`)
      .then((res) => res.json())
      .then((value) => {
        if (value !== null) {
          output = value;
          /*for (const f of value) {
            if (output.find((e: any) => e.IncidentID === f.IncidentID))
              continue;
            else output.push(f);
            }*/
        }
      });
    let temp: any = [];
    for (const e of output) {
      /*let array = e.LinesAffected.split(/;[\s]?/).filter(function (fn: any) {
        return fn !== "";
        });*/
      let array = e.line;
      if (array.length === 0) {
        for (const f of array) {
          let object: any = Object.create(e);
          //object.LinesAffected = f + ";";
          object.line = [f];
          temp.push(object);
        }
      } else {
        temp.push(e);
      }
    }
    output = temp;
    setAlerts(output);
  }

  const alertsList = (t: any, index: number) => (
    <div
      className={
        " d-flex text-center justify-content-center align-items-center m-1"
      }
      key={index}
      style={{ borderRadius: "15px" }}
    >
      <div
        className={
          "col-1 transfer-station-circle " +
          (t.line.length === 0 ? "-" : t.line[0])
        }
        key={index + t.line.length === 0 ? "-" : t.line[0]}
        id={index + t.line.length === 0 ? "-" : t.line[0]}
      >
        {" "}
        {t.line.length === 0 ? "-" : t.line[0]}{" "}
      </div>
      <p className="d-flex justify-content-center align-items-center m-1 p-2">
        {t.descriptionText}
      </p>
    </div>
  );

  return (
    <div
      className=" background-logo-new"
      style={{ height: "100%", zIndex: 0, backgroundColor: "white" }}
    >
      <Navbar />
      <div style={{ height: "61px" }}></div>
      <div className="container-fluid text-center" style={{ zIndex: 2 }}>
        <h1 id="page-header" aria-label="page header" className="mt-5 mb-5">
          DC Metro Information Hub
        </h1>
        <div className="row align-items-center">
          <div className="d-inline-block container text-center">
            <Link
              to="/stationlist"
              className="d-inline-block m-2 align-items-center card-custom"
            >
              <div className="card text-white bg-primary card-custom">
                <img
                  src={train_img}
                  className="card-img-top home-button-image card-image-custom"
                  alt=""
                ></img>
                <div className="card-footer">Rail</div>
              </div>
            </Link>
            <Link
              to="/busroutelist"
              className="d-inline-block m-2 gap-2 align-items-center card-custom"
            >
              <div className="card text-white bg-primary card-custom">
                <img
                  src={bus_img}
                  className="card-img-top home-button-image card-image-custom"
                  alt=""
                ></img>
                <div className="card-footer">Bus</div>
              </div>
            </Link>
            <Link
              to="/nexttrain"
              className="d-inline-block m-2 gap-2 align-items-center card-custom"
            >
              <div className="card text-white bg-primary card-custom">
                <img
                  src={next_arrivals_img}
                  className="card-img-top home-button-image card-image-custom"
                  alt=""
                ></img>
                <div className="card-footer">Next Arrival</div>
              </div>
            </Link>
            <Link
              to="/alerts"
              className="d-inline-block m-2 gap-2 align-items-center card-custom"
            >
              <div className="card text-white bg-primary card-custom">
                <img
                  src={alerts_img}
                  className="card-img-top home-button-image card-image-custom"
                  alt=""
                ></img>
                <div className="card-footer">Alerts</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <div
        className="offcanvas offcanvas-start"
        tabIndex={-1}
        id="offcanvasExample"
        aria-labelledby="offcanvasExampleLabel"
      >
        <div className="offcanvas-header text-center">
          <h1 className="offcanvas-title" id="offcanvasExampleLabel">
            Alerts
          </h1>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body">
          {!alerts.length ? (
            <h5
              className="p-2"
              style={{ backgroundColor: "lightgreen", borderRadius: "15px" }}
            >
              No alerts
            </h5>
          ) : (
            alerts.map(alertsList)
          )}
        </div>
      </div>
      <AlertsOffCanvas />
    </div>
  );
}
