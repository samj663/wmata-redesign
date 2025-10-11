import React from "react";
import { API_URL } from "../tokens";
import Navbar from "./shared-components/Navbar";
import { AlertsOffCanvas } from "./shared-components/AlertsOffCanvas";

export default function Alerts() {
  const [alerts, setAlerts] = React.useState<any>([]);
  const [isLoading, setLoading] = React.useState(1);

  React.useEffect(() => {
    getAlerts();
  }, []);

  async function getAlerts() {
    setLoading(1);
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
    await fetch(`${API_URL}/bus/alerts`)
      .then((res) => res.json())
      .then((value) => {
        if (value !== null) {
          for (const e of value) {
            output.push(e);
          }
          //output.push(value);
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
    setLoading(0);
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

  const alertsPlaceholder = (t: any, index: number) => (
    <div className="placeholder-glow" key={index}>
      <div
        className={"placeholder align-items-center d-flex mb-2 pb-2 pt-2"}
        style={{ borderRadius: "10px", backgroundColor: "lightgray" }}
      >
        <div
          className={"placeholder transfer-station-circle col-2 m-2 "}
          key={index + t}
          id={index.toString()}
        >
          {}{" "}
        </div>
        <p className="placeholder m-0">{t.Description}</p>
      </div>
    </div>
  );

  function isThereAlerts() {
    if (alerts.length > 0) return alerts.map(alertsList);
    else if (isLoading === 0) {
      return (
        <p
          className="p-2 text-center"
          style={{
            backgroundColor: "lightgray",
            borderRadius: "15px",
            fontSize: "20px",
          }}
        >
          No alerts
        </p>
      );
    } else return [1].map(alertsPlaceholder);
  }

  return (
    <div className="m-4 text-center">
      <Navbar />
      <AlertsOffCanvas />
      <div style={{ height: "61px" }}></div>
      <h1 className="mb-4 text-center">Alerts</h1>
      {isThereAlerts()}
    </div>
  );
}
