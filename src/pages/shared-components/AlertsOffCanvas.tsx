import { useEffect, useState } from "react";
import { API_URL } from "../../tokens";

export function AlertsOffCanvas() {
  const [alerts, setAlerts] = useState<any>([]);
  useEffect(() => {
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
      className="offcanvas offcanvas-start"
      tabIndex={-1}
      id="alertsoffcanvas"
      aria-labelledby="alertsoffcanvas"
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
  );
}
