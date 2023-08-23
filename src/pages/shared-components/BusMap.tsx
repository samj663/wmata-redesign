import {useEffect, useRef} from 'react';
import {REACT_APP_MAPBOX_STYLE_MONOCHROME} from "../../tokens"

var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');

 
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

export default function BusMap(props : any) {
  var {line_path, direction1_path, route, stops, center_to, lon, lat, markers, zoom} = props

  var map : any = useRef(null);
  const mapContainer = useRef(null);

  useEffect(()=>{
    if(map.current == null) return;
    map.current.flyTo({
      center: center_to,
      zoom: 15
      })
  },[center_to])

  useEffect(()=>{
    if (map.current) return; // initialize map only once
    else{
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: REACT_APP_MAPBOX_STYLE_MONOCHROME,
        center: [-77.021851 ,38.89834 ],
        zoom: 12
      });

      map.current.on('idle',function(){ map.current.resize() })

      map.current.on("load", () =>{
        map.current.addSource('path',{
          'type': 'geojson',
          'data': {
            "type": "Feature",
            "geometry": {
              "type": "LineString",
               "coordinates": [[38.89834,-77.021851],[38.90834,-77.031851]]
            },
          }
        })
        map.current.addSource('stops',{
          'type': 'geojson',
          'data': {
            "type": "FeatureCollection",
            "features": [
              {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                 "coordinates": [38.89834,-77.021851]
              },
              }
            ]
          }
        })
        map.current.addLayer({
          'id': 'route',
          'type': 'line',
          'source': 'path',
          'layout': {
          
          'line-cap': 'round'
          },
          'paint': {
          'line-color': '#000',
          'line-width': 6
          }
        });
        map.current.addLayer({
          'id': 'stop',
          'source': 'stops',
          'type': 'circle',
          'paint': {
            'circle-radius': 4,
              'circle-color': '#ffffff',
              'circle-stroke-width': 3
          },
          'filter': ['==', '$type', 'Point']
        });
        map.current.resize()
      })
    }
  },[lon, lat, markers, zoom])


  useEffect(()=>{
    if (!map.current) return; // initialize map only once
    var bounds : any;
    if(line_path === null) return;
    else if(map.current.getSource('path') !== undefined){
      map.current.getSource('path').setData(line_path.data)

      const coordinates = line_path.data.geometry.coordinates

      bounds = new mapboxgl.LngLatBounds(coordinates[0],coordinates[0])

      for (const coord of coordinates) { bounds.extend(coord) }

      map.current.fitBounds(bounds, { padding: 20 });

    }
    if(stops === null) return ;
    else if(map.current.getSource('stops') !== undefined){
      console.log(stops)
      map.current.getSource('stops').setData(stops.data)
      map.current.resize()
    }
    map.current.on("click", () => {
      map.current.fitBounds(bounds, { padding: 20 });
    });
  },[line_path, direction1_path, route, stops])

  return (
    <div ref={mapContainer} className="map-container"></div>
  );
}