import { useState, useEffect, useRef} from 'react';
import {REACT_APP_MAPBOX_KEY, REACT_APP_MAPBOX_STYLE} from "../../tokens"

var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
 
mapboxgl.accessToken = REACT_APP_MAPBOX_KEY;

/**
 * props.layer
 *  {
      'id': unique id
      'type': line, circle, etc.,
      'source': where,
      'layout': {
        context specific
      },
      'paint': {
        context specific
      }
    }
 * 
 */

/**
 * props.source
 * {
 *    'id': unique name to identify source
 *    'type': what format the data is in. Will be set to geojson
 *    'data': geojson formatted data
 * }
 * @param props 
 * @returns 
 */
export default function Map_General(props : any) {
  var map : any = useRef(null);
  const mapContainer = useRef(null);
  const [lng, setLng] = useState(0);
  const [lat, setLat] = useState(0);
  const [zoom, setZoom] = useState(15);
  var  markerTracker : any = useRef([])

  useEffect(()=>{
    setLng(props.lon);
    setLat(props.lat);
    setZoom(props.zoom);
    
    if (map.current) return; // initialize map only once
    else{
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: REACT_APP_MAPBOX_STYLE,
        center: [-77.021851 ,38.89834 ],
        zoom: zoom
      });

      map.current.on('idle',function(){ map.current.resize() })

      map.current.on("load", () =>{
        for(const source of props.sources){
          map.current.addSource(source.id, { 'type': source.type, 'data': source.data });
        }
        for(const layer of props.layers){
          map.current.addLayer(layer);
        }
        map.current.resize();
      })
    }
  },[props.layers, props.sources])

  useEffect(()=>{
    if (!map.current) return;

    if(props.sources !== null){
      for(const source of props.sources){
        if(map.current.getSource(source.source_id) !== undefined){
          map.current.getSource(source.source_id).setData(source.data)
        }
        else map.current.addSource(source.id, { 'type': source.type, 'data': source.data });
      }
      map.current.resize()
    }

    if(props.layers !== null){
      for(const layer of props.layers){
        if(map.current.getLayer(layer.id) === undefined){
          map.current.addLayer(layer)
        }
      }
    }
  },[props.sources, props.layers]);

  useEffect(()=>{
    map.current.on("click", () => {
         map.current.flyTo({ 
            'center': [lng,lat], 
            'zoom': zoom || 16.5
        });
    });
  },[props.lon, props.lat,lat,lng, props.markers, props.zoom, props.station, zoom]);
  return (
    <div ref={mapContainer} className="map-container"></div>
  );
}