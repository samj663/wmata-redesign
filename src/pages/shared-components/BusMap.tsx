import React, { useState, useEffect, useRef} from 'react';

var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
 
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

export default function BusMap(props : any) {
  var map : any = useRef(null);
  const mapContainer = useRef(null);

  useEffect(()=>{
    if(map.current == null) return;
    map.current.flyTo({
      center: props.center_to,
      zoom: 15
      })
  },[props.center_to])

  useEffect(()=>{
    if (map.current) return; // initialize map only once
    else{
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: process.env.REACT_APP_MAPBOX_STYLE,
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
  },[props.lon, props.lat, props.markers, props.zoom])


  useEffect(()=>{
    if (!map.current) return; // initialize map only once
    var bounds : any;
    if(props.line_path === null) return;
    else if(map.current.getSource('path') !== undefined){
      map.current.getSource('path').setData(props.line_path.data)

      const coordinates = props.line_path.data.geometry.coordinates

      bounds = new mapboxgl.LngLatBounds(coordinates[0],coordinates[0])

      for (const coord of coordinates) { bounds.extend(coord) }

      map.current.fitBounds(bounds, { padding: 20 });

    }
    if(props.stops === null) return ;
    else if(map.current.getSource('stops') !== undefined){
      console.log(props.stops)
      map.current.getSource('stops').setData(props.stops.data)
      map.current.resize()
    }
    map.current.on("click", () => {
      map.current.fitBounds(bounds, { padding: 20 });
    });
  },[props.line_path, props.direction1_path, props.route, props.stops])

  return (
    <div ref={mapContainer} className="map-container"></div>
  );
}