import React, { useCallback, useEffect, useState, useRef } from 'react';
import {stationCodeNameMap, train, fares, entrance, station} from "../../interfaces_and_classes"

export default function NextArrivalsTable(props: any) {
  const [trains, setTrains] = useState([]);
  const [station, setStation] = useState(props.station)
  const [group, setGroup] = useState(props.group)
	const timer = useRef<any>([])

  const getNextTrain = useCallback(() => {
		for(const e of timer.current){
			clearTimeout(e);
		}
		fetch(`/api/nextarrival?station=${station}&group=${group}`)
		.then(res => res.json())
		.then(value=>{
			setTrains(value)
			timer.current.push(window.setTimeout(()=>{getNextTrain()}, 10000))
		})
		.catch(function(error) {
			console.log('There has been a problem with your fetch operation: ' + error.message);
			throw error;
		});
  },[timer]);

  useEffect(() => {
		getNextTrain();
		return()=>{
      for(const e of timer.current){
				clearTimeout(e);
			}
    }
  },[props.station, props.group, timer, getNextTrain]);
  
  return (
    <div>
		<table className="table text-center">
			<thead>
				<tr>
					<th scope="col">Line</th>
					<th scope="col">Cars</th>
					<th scope="col">Destination</th>
					<th scope="col">Time</th>
				</tr>
			</thead>
			<tbody>
				{trains.map((t: train, index:number) =>
					<tr key={index}>
						<td className="text-center align-middle"><div className={"circle-table-margin transfer-station-circle "+t.Line}>{t.Line}</div></td>
						<td>{t.Car}</td>
						<td>{t.DestinationName}</td>
						<td>{t.Min}</td>
					</tr>
				)}
			</tbody>
		</table>
    </div>
  );
}