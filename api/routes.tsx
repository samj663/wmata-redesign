/**
 * This is the code that preprocesses data from WMATA's api and defines the endpoints for my own api.
 * @author Samuel Johnson
 */

import * as backend from "./backend"
//import * as bus from "./bus"
const express = require('express')
const path = require('path');
const app = express()

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
 * @param group what group of trains you want to get. Accepted imputs are "1" and "2" Note: In WMATA's api,
 * trains are put in 2 groups to denote what tracks they are one. However, it doesn't correlate to the actual
 * track number.
 * @returns json files containing array of train objecs. See "train" interface in interfaces_and_classes.tsx
 */
app.get('/api/nextarrival', function(request : any, response : any){
    if(request.query.station == null){
        response.status(400).send("Provide station");
    }
    else{
        let code = backend.stationNames.getCode(request.query.station)!;
        let output =  backend.trains.get(code)
        
        if(backend.stations.get(code) === undefined){
            response.send("Invalid station")
            return;
        }
        if( backend.stations.get(code)?.StationTogether1 !== ''){
            let temp = backend.trains.get(backend.stations.get(code)!.StationTogether1);
            output = output!.concat(temp!);
        }

        if(output === undefined) response.send("No trains found");
        else{
            if (request.query.group === "1") response.json(output.filter(x=>x.Group === "1"));
            else if (request.query.group === "2") response.json(output.filter(x=>x.Group === "2"));
            else response.json(backend.trains.get(code));
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
    if(request.query.sourcestation == null && request.query.destinationstation == null){
        response.status(400).send("Provide source and destination station");
    }
    let source = backend.stationNames.getCode(request.query.sourcestation)!;
    let dest = backend.stationNames.getCode(request.query.destinationstation)!;
    let output = backend.stations.get(source)?.fares.get(dest);

    if(output === undefined) response.status(404);

    else response.json(output);
});

/**
 * Gets all entrances from a certain station
 * @param station What station you want to get the entrances from.
 * @return json with array of entrances. See "entrance" interface in interfaces_and_classes.tsx
 */
app.get('/api/entrances', function(request : any, response : any){
    if(request.query.station == null){
        response.status(400).send("Provide station");
    }
    else{
        let code = backend.stationNames.getCode(request.query.station)!;
        let output = backend.stations.get(code)?.entrances
        if(output === undefined) response.status(404);
        else response.json(output);
    }
});

app.get('/api/stationInfo', function(request : any, response : any){
    if(request.query.station == null){
        response.status(400).send("Provide station");
    }
    else{
        let code = backend.stationNames.getCode(request.query.station)!;
        let output = backend.stations.get(code)
        if(output === undefined) response.status(404);
        else response.send(output);
    }
});

app.get('/api/stationList', function(request : any, response : any){
    let code = backend.stationNames.getCode(request.query.station)!;
    let output = backend.stations.get(code)
    if(request.query.get === "codes")response.json(backend.stationNames.codeArray);
    else if(request.query.get === "names")response.json(backend.stationNames.nameArray);
    else if(output === undefined) response.json(backend.stationNames.nameArray);
    else response.json(output);
});

app.get('/api/alerts', function(request : any, response : any){
    let output = []
    if(request.query.line !== undefined){
        for(const e of backend.railAlerts){
            let temp = e.LinesAffected.split(/;[\s]?/).filter(function(fn : any) { return fn !== ''; })
            if(temp.includes(request.query.line)){
                output.push(e);
            }
        }
        response.json(output);
        return;
    }
    else{
        response.send(backend.railAlerts);
    }
});
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
        response.send(railAlerts);
    }
});*/

/**
 * Gets the time when data was last fetched from WMATA's api
 * @returns json object. See lastUpdated variable to see what's in the object
 */
app.get('/api/lastupdate', function(request : any, response : any){
    response.json(backend.lastUpdated);
});

app.get('/api/busStop', function(request : any, response : any){
    if(backend.bootstrap_status.bus_stops === "RUNNING"){
        response.send("System is booting up. Please try again later.")
    }
    else if(backend.bootstrap_status.bus_stops=== "ERROR"){
        response.send("System ran into error fetching bus stops. Please try again later.")
    }
    else{
        response.json(backend.get_bus_stop_info(request.query.stopid));
    }
});

app.get('/api/busRoute', function(request : any, response : any){
    if(backend.bootstrap_status.bus_routes === "RUNNING"){
        response.send("System is booting up. Please try again later.")
    }
    else if(backend.bootstrap_status.bus_routes === "ERROR"){
        response.send("System ran into error fetching bus routes. Please try again later.")
    }
    else{
        response.json(backend.get_bus_route_info(request.query.route));
    }
});

app.get('/api/bootstrap', function(request : any, response : any){
    response.json(backend.bootstrap_status);
});

app.get('/api/errorLog', function(request : any, response : any){
    if(request.query.key === process.env.ERROR_LOG_KEY) response.json(backend.error_log);
    else response.send("Invalid key");
});

/**
 * Catchall function to handle invalid endpoints.
 */
app.get('/api/*', function(request : any, response : any){
    response.send("ummm... that wasn't a valid endpoint");
});

app.listen(process.env.PORT || 4000,() => {
    backend.main();
    console.log(`Example app listening on port ${process.env.PORT || 4000}`);
});