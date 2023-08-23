/**
 * This file defines all the endpoints for this project's API
 * @author Samuel Johnson
 */

import * as backend from "./backend"
import * as rail from "./rail"
import * as bus from "./bus"
const express = require('express')
const path = require('path');
export const app = express()

require('dotenv').config({path: path.resolve(__dirname,"..",".env.local")});
app.use(express.static(path.join(__dirname, 'client/build')));
//--------------------------------------------------------------------
//         Below is all the GET endpoint functions
//         Note: any parameters defined for each funciton
//         is referring to what you have to put in the URL.
//--------------------------------------------------------------------

app.get('/api', function(request : any, response : any){
    response.send('This is the api backend')
});

/**
 * Gets next arrivals of a given station
 * @param station The station you want to get the next arrivals from
 * @param group what group of trains you want to get. Accepted inputs are "1" and "2" Note: In WMATA's api,
 * trains are put in 2 groups to denote what tracks they are one. However, it doesn't correlate to the physical
 * track number.
 * @returns json file containing array of train objecs. See "train" interface in interfaces_and_classes.tsx
 */
app.get('/api/nextarrival', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    if(request.query.station == null){
        response.status(400).json({error: "Provide station"});
    }
    else{
        let code = rail.stationNames.getCode(request.query.station)!;
        let output =  rail.trains.get(code)
        
        if(rail.stations.get(code) === undefined){
            response.json({error:"Invalid station"})
            return;
        }
        if( rail.stations.get(code)?.StationTogether1 !== ''){
            let temp = rail.trains.get(rail.stations.get(code)!.StationTogether1);
            output = output!.concat(temp!);
        }

        if(output === undefined) response.json({error:"No trains found"});
        else{
            if (request.query.group === "1") response.json(output.filter(x=>x.Group === "1"));
            else if (request.query.group === "2") response.json(output.filter(x=>x.Group === "2"));
            else response.json(rail.trains.get(code));
        }
    }
});

/**
 * Gets the fare information from one station to another. The fare is determined on how far you 
 * travel so it will depend on which station you start and end at
 * @param sourcestation The origin station
 * @param destinationstation The destination station
 * @returns json with object that contains fare information. See "fares" interface in interfaces_and_classes.tsx
 */
app.get('/api/fares', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    if(request.query.sourcestation == null && request.query.destinationstation == null){
        response.status(400).json({error:"Provide source and destination station"});
    }
    let source = rail.stationNames.getCode(request.query.sourcestation)!;
    let dest = rail.stationNames.getCode(request.query.destinationstation)!;
    let output = rail.stations.get(source)?.fares.get(dest);

    if(output === undefined) response.status(404);

    else response.json(output);
});

/**
 * Gets all entrances from a certain station
 * @param station What station you want to get the entrances from.
 * @return json with array of entrances. See "entrance" interface in interfaces_and_classes.tsx
 */
app.get('/api/entrances', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    if(request.query.station == null){
        response.status(400).json({error:"Provide station"});
    }
    else{
        let code = rail.stationNames.getCode(request.query.station)!;
        let output = rail.stations.get(code)?.entrances
        if(output === undefined) response.status(404);
        else response.json(output);
    }
});

app.get('/api/stationInfo', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    if(request.query.station == null){
        response.status(400).json({error:"Provide station"});
    }
    else{
        let code = rail.stationNames.getCode(request.query.station)!;
        let output = rail.stations.get(code)
        if(output === undefined) response.status(404);
        else response.json(output);
    }
});

app.get('/api/stationList', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    let code = rail.stationNames.getCode(request.query.station)!;
    let output = rail.stations.get(code)
    if(request.query.get === "codes")response.json(rail.stationNames.codeArray);
    else if(request.query.get === "names")response.json(rail.stationNames.nameArray);
    else if(output === undefined) response.json(rail.stationNames.nameArray);
    else response.json(output);
});

app.get('/api/alerts', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    let output = []
    if(request.query.line !== undefined){
        for(const e of rail.railAlerts){
            let temp = e.LinesAffected.split(/;[\s]?/).filter(function(fn : any) { return fn !== ''; })
            if(temp.includes(request.query.line)){
                output.push(e);
            }
        }
        response.json(output);
        return;
    }
    else{
        response.json(rail.railAlerts);
    }
});

/**
 * Gets the time when data was last fetched from WMATA's api
 * @returns json object. See lastUpdated variable to see what's in the object
 */
app.get('/api/lastupdate', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    response.json(backend.lastUpdated);
});

app.get('/api/busStop', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    if(backend.bootstrap_status.bus_stops === "RUNNING"){
        response.json({error:"System is booting up. Please try again later."})
    }
    else if(backend.bootstrap_status.bus_stops=== "ERROR"){
        response.json({error:"System ran into error fetching bus stops. Please try again later."})
    }
    else response.json(bus.bus_stops.get(request.query.stopid));
});
app.get('/api/busRoute', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    if(backend.bootstrap_status.bus_routes === "RUNNING"){
        response.json({error:"System is booting up. Please try again later."})
    }
    else if(backend.bootstrap_status.bus_routes === "ERROR"){
        response.json({error:"System ran into error fetching bus routes. Please try again later."})
    }
    else response.json(bus.bus_routes.get(request.query.route));
});

app.get('/api/busRouteList', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    if(backend.bootstrap_status.bus_route_list === "RUNNING"){
        response.json({error:"System is booting up. Please try again later."})
    }
    else if(backend.bootstrap_status.bus_route_list === "ERROR"){
        response.json({error:"System ran into error fetching bus routes. Please try again later."})
    }
    else {

        response.json(bus.bus_route_list)
    };
});

app.get('/api/busRoute/direction0', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    if(backend.bootstrap_status.bus_routes === "RUNNING"){
        response.json({error:"System is booting up. Please try again later."})
    }
    else if(backend.bootstrap_status.bus_routes === "ERROR"){
        response.json({error:"System ran into error fetching bus routes. Please try again later."})
    }
    else response.json(bus.bus_routes.get(request.query.route)?.paths.Direction0);
});

app.get('/api/busRoute/direction0/stops', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    if(backend.bootstrap_status.bus_routes === "RUNNING"){
        response.json({error:"System is booting up. Please try again later."})
    }
    else if(backend.bootstrap_status.bus_routes === "ERROR"){
        response.json({error:"System ran into error fetching bus routes. Please try again later."})
    }
    else response.json(bus.bus_routes.get(request.query.route)?.paths.Direction0.Stops);
});

app.get('/api/busRoute/direction1', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    if(backend.bootstrap_status.bus_routes === "RUNNING"){
        response.json({error:"System is booting up. Please try again later."})
    }
    else if(backend.bootstrap_status.bus_routes === "ERROR"){
        response.json({error:"System ran into error fetching bus routes. Please try again later."})
    }
    else response.json(bus.bus_routes.get(request.query.route)?.paths.Direction1);
});

app.get('/api/busRoute/:route/direction/:directionNum/stops/:onlyStops', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    if(backend.bootstrap_status.bus_routes === "RUNNING"){
        response.json({error:"System is booting up. Please try again later."})
    }
    else if(backend.bootstrap_status.bus_routes === "ERROR"){
        response.json({error:"System ran into error fetching bus routes. Please try again later."})
    }
    else {
        if(request.params.directionNum === '0'){
            if(request.params.onlyStops === 'true'){
                response.json(bus.bus_routes.get(request.params.route)?.paths.Direction0.Stops);
            }
            else response.json(bus.bus_routes.get(request.params.route)?.paths.Direction0);
        }
        else if(request.params.directionNum === '1'){
            if(request.params.onlyStops === 'true'){
                response.json(bus.bus_routes.get(request.params.route)?.paths.Direction1.Stops)
            }
            else response.json(bus.bus_routes.get(request.params.route)?.paths.Direction1);
        }
        else{
            response.json(bus.bus_routes.get(request.params.route));
        }
    }
});

app.get('/api/busRoute/direction1/stops', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    if(backend.bootstrap_status.bus_routes === "RUNNING"){
        response.json({error:"System is booting up. Please try again later."})
    }
    else if(backend.bootstrap_status.bus_routes === "ERROR"){
        response.json({error:"System ran into error fetching bus routes. Please try again later."})
    }
    else response.json(bus.bus_routes.get(request.query.route)?.paths.Direction1.Stops);
});

app.get('/api/bootstrap', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    response.json(backend.bootstrap_status);
});

app.get('/api/errorLog', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    if(request.query.key === process.env.ERROR_LOG_KEY) response.json(backend.error_log);
    else response.json({error:"Invalid key"});
});

app.get('/api/nextBus', async function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    if(request.query.stopid !== undefined){
        await bus.get_next_bus_data(request.query.stopid)
        var info = bus.bus_stops.get(request.query.stopid)
        if(info === undefined){
            response.json({error: "Stop not found"})
        }
        else{
            response.json(info)
        }
    }
    else response.json({error:"Invalid key"});
});

/**
 * Catchall function to handle invalid endpoints.
 */
app.get('/api/*', function(request : any, response : any){
    response.set('Access-Control-Allow-Origin', '*');
    response.json({error:"ummm... that wasn't a valid endpoint"});
});

export var server :any = app.listen(process.env.BACKEND_PORT ,() => {
        backend.main();
        console.log(`Example app listening on port ${process.env.BACKEND_PORT}`);
    });

export var shutdown = function (message: string){
    console.log(message)
    server.close();
}
/*
app.get('/api/queue', function(request : any, response : any){
    let output = []
    if(request.query.line !== undefined){
        for(const e of railAlerts){
            let temp = e.LinesAffected.split(/;[\s]?/).filter(function(fn : any) { return fn !== ''; })
            if(temp.includes(request.query.line)){
                output.push(e);
            }
        }
        response.json(output);
        return;
    }
    else{
        response.json(railAlerts);
    }
});*/
module.exports = app