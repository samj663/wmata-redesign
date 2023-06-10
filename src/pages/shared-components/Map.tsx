import { data } from 'jquery';
import React, { useState, useEffect, useRef} from 'react';
//import { useLocation } from 'react-router-dom';
import lines from "./Metro_Lines_Regional.json";
import stations from "./Metro_Stations_Regional.json";
var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
 
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

export default function Map(props : any) {
  var map : any = useRef(null);
  const mapContainer = useRef(null);
  const [lng, setLng] = useState(0);
  const [lat, setLat] = useState(0);
  const [zoom, setZoom] = useState(15);
  const [geojson_markers, setMarkers] = useState<any>(null)

  useEffect(()=>{
    setLng(props.lon);
    setLat(props.lat);
    setMarkers(props.markers);
    setZoom(props.zoom);
  
    if (map.current) return; // initialize map only once
    else{
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: process.env.REACT_APP_MAPBOX_STYLE,
            center: [lng, lat],
            zoom: zoom
        });
        map.current.on("load", () =>{
            map.current.addSource('Lines', {
                'type': 'geojson',
                'data': lines
            })
            map.current.addSource('Stations', {
                'type': 'geojson',
                'data': stations
            });
            map.current.addLayer({
                'id': 'blue_line',
                'type': 'line',
                'source': 'Lines',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#009CDE',
                    'line-width': 8,
                    'line-offset': 0

                },
                'filter': ['==', "GIS_ID",  "MetroFullLn_5"]
            });
            map.current.addLayer({
                'id': 'silver_line',
                'type': 'line',
                'source': 'Lines',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#919D9D',
                    'line-width': 8,
                    'line-offset': 0
                },
                'filter': ['==', "GIS_ID",  "MetroFullLn_6"]
            });
            map.current.addLayer({
                'id': 'orange_line',
                'type': 'line',
                'source': 'Lines',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#ED8B00',
                    'line-width': 8,
                    'line-offset': 0,
                },
                'filter': ['==', "GIS_ID",  "MetroFullLn_2"]
            });
            map.current.addLayer({
                'id': 'yellow_line',
                'type': 'line',
                'source': 'Lines',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#FFD100',
                    'line-width': 8,
                    'line-offset': 0
                },
                'filter': ['==', "GIS_ID",  "MetroFullLn_4"]
            });
            map.current.addLayer({
                'id': 'green_line',
                'type': 'line',
                'source': 'Lines',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#00B140',
                    'line-width': 8,
                    'line-offset': 0
                },
                'filter': ['==', "GIS_ID",  "MetroFullLn_3"]
            });
            
            map.current.addLayer({
                'id': 'red_line',
                'type': 'line',
                'source': 'Lines',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#BF0D3E',
                    'line-width': 8,
                    'line-offset': 0
                },
                'filter': ['==', "GIS_ID",  "MetroFullLn_1"]
            });
            map.current.addLayer({
                'id': 'station-circles',
                'type': 'circle',
                'source': 'Stations',
                'paint': {
                    'circle-radius': 6,
                    'circle-color': '#ffffff',
                    'circle-stroke-width': 5
                },
                'filter': ['==', '$type', 'Point']
            });
        })
        map.current.flyTo({ 
            'center': [lng,lat], 
            'zoom': zoom
        });
    }
  },[lat,lng])

  useEffect(() => {
    if (!map.current ) return; // wait for map to initialize
    map.current.jumpTo({ 
        'center': [lng,lat], 
        'zoom': zoom || 16.5
    });
    map.current.on("load", () =>{
     //   console.log(lines);
        if(geojson_markers == null) return;
        for (const feature of geojson_markers!.features) {
            const el = document.createElement('div');
            if(feature.properties.type == "Elevator"){
                el.className = 'elevator-marker';
            }
            else if(feature.properties.type == "Escalator"){
                el.className = 'escalator-marker';
            }
            else el.className = 'marker';
        new mapboxgl.Marker(el).setLngLat(feature.geometry.coordinates).addTo(map.current);
        }
    })
    map.current.on('click', 'station-circles', (e:any) => {
        console.log(e);
        map.current.flyTo({
        'center': e.features[0].geometry.coordinates,
        'zoom': 16.5
        });
        });
  /*  map.current.on("click", () => {
         map.current.flyTo({ 
            'center': [lng,lat], 
            'zoom': zoom || 16.5
        });
    });*/
  },[lat,lng]);
  
  return (
    <div ref={mapContainer} className="map-container"></div>
  );

}

