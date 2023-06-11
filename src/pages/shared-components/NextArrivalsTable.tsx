import React, { useEffect, useState } from 'react';
import {stationCodeNameMap, train, fares, entrance, station} from "../../interfaces_and_classes"

export default function NextArrivalsTable(props: any) {
  const [trains, setTrains] = useState([]);
  const [station, setStation] = useState(props.station)
  const [group, setGroup] = useState(props.group)

  useEffect(() => {
    fetch(`/api/nextarrival?station=${station}&group=${group}`)
	.then(res => res.json())
	.then(value=>{
	//	console.log(value);
		setTrains(value)
	})
  },[]);
  return (
    <div>
		<table className="table">
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
						<th>{t.Line}</th>
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