import React, { useCallback, useEffect, useState, useRef } from 'react';

export default function NextArrivalsTable(props: any) {
  const [trains, setTrains] = useState([]);
  const timer = useRef<number[]>([])

  const getNextTrain = useCallback(() => {
		for(const e of timer.current){
			clearTimeout(e);
		}
		fetch(`/api/nextarrival?station=${props.station}&group=${props.group}`)
		.then(res => res.json())
		.then(value=>{
			setTrains(value)
			timer.current.push(window.setTimeout(()=>{getNextTrain()}, 10000))
		})
		.catch(function(error) {
			console.log('There has been a problem with your fetch operation: ' + error.message);
			throw error;
		});
  },[props.group, props.station, timer]);

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
						<th scope="col-1">Line</th>
						<th scope="col-1">Cars</th>
						<th scope="col-9">Destination</th>
						<th scope="col-1">Time</th>
					</tr>
				</thead>
				<tbody className="table-group-divider">
					{trains.map((t: any, index:number) =>
						<tr key={index}>
							<td className="text-center col-1"><div className={"circle-table-margin transfer-station-circle "+t.Line}>{t.Line}</div></td>
							<td className="col-1">{t.Car}</td>
							<td className="col-9">{t.DestinationName}</td>
							<td className="col-1">{t.Min}</td>
						</tr>
					)}
				</tbody>
			</table>
    </div>
  );
}