//import React from 'react';
//import { render, screen } from '@testing-library/react';
//import App from './App';
//import Station from './pages/Station'
import * as r from "../api/routes"
import * as backend from "../api/backend"
const {default : fetch} = require('node-fetch');
const request = require("supertest");
const app = require("../api/routes")

jest.setTimeout(120000)

var station_info_test:any;
var bus_route_test:any;
var fares_test:any;
/*
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText("WMATA Information Hub");
  expect(linkElement).toBeInTheDocument();
});

test('renders learn react link', () => {
  render(<Station  station="Tysons"/>);
  const linkElement = screen.getByText("Tysons");
  expect(linkElement).toBeInTheDocument();
});
*/
beforeAll(async() => {
  await backend.delay(2000)
});

describe("GET / ", () => {
  
  test("/api", async () => {
    await backend.delay(500)
    const response = await request("http://localhost:4000").get("/api")
    .expect('This is the api backend');
    expect(response.statusCode).toBe(200);
  });

  test('/api/*', async () => {
    await backend.delay(500)
     const response = await request(app).get('/api/*')
     expect(response.body).toEqual({error:"ummm... that wasn't a valid endpoint"})
  });

  test("/api/nextarrival", async () => {
    await backend.delay(500)
    const response = await request(app).get("/api/nextarrival")
    expect(response.body).toEqual({"error": "Provide station"});
    expect(response.statusCode).toBe(400);
  });

  test("/api/stationList", async () => {
    await backend.delay(500)
    const response = await request(app).get("/api/stationList")
    expect(response.body).toEqual(stationlist)
  });

  test('/api/stationInfo?station=A01', async () => {
    await backend.delay(500)
    await get_test_station_info("A01")
    const response = await request(app).get('/api/stationInfo?station=A01')
    expect(response.body.Code).toEqual(station_info_test.Code)
    expect(response.body.Name).toEqual(station_info_test.Name)
    expect(response.body.StationTogether1).toEqual(station_info_test.StationTogether1)
    expect(response.body.Address).toEqual(station_info_test.Address)
  });

  test('/api/stationInfo?station=F01', async () => {
    await backend.delay(500)
    await get_test_station_info("F01")
    const response = await request(app).get('/api/stationInfo?station=F01')
    expect(response.body.Code).toEqual(station_info_test.Code)
    expect(response.body.Name).toEqual(station_info_test.Name)
    expect(response.body.StationTogether1).toEqual(station_info_test.StationTogether1)
    expect(response.body.Address).toEqual(station_info_test.Address)
  });

  test('/api/nextarrival?station=A01', async () => {
    await backend.delay(500)
    const response = await request(app).get('/api/nextarrival?station=A01')
    expect(response.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        Car: expect.any(String), 
        Destination: expect.any(String), 
        DestinationCode: expect.any(String),
        DestinationName: expect.any(String),
        Group: expect.any(String),
        Line: expect.any(String), 
        LocationCode: "A01", 
        LocationName: "Metro Center",
        Min:expect.any(String)
      })
    ]))
  });

  test('/api/nextarrival?station=B01', async () => {
    await backend.delay(500)
    const response = await request(app).get('/api/nextarrival?station=B01')
    expect(response.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        Car: expect.any(String), 
        Destination: expect.any(String), 
        DestinationCode: expect.any(String),
        DestinationName: expect.any(String),
        Group: expect.any(String),
        Line: expect.any(String), 
        LocationCode: "B01", 
        LocationName: "Gallery Pl-Chinatown",
        Min:expect.any(String)
      })
    ]))
  });

  test('/api/nextarrival?station=F01', async () => {
    await backend.delay(500)
    const response = await request(app).get('/api/nextarrival?station=F01')
    expect(response.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        Car: expect.any(String), 
        Destination: expect.any(String), 
        DestinationCode: expect.any(String),
        DestinationName: expect.any(String),
        Group: expect.any(String),
        Line: expect.any(String), 
        LocationCode: "F01", 
        LocationName: "Gallery Pl-Chinatown",
        Min:expect.any(String)
      })
    ]))
  });

  test('/api/fares?sourcestation=F01&destinationstation=N01', async () => {
    await backend.delay(500)
    await get_fare_info("F01","N01")
    const response = await request(app).get("/api/fares?sourcestation=F01&destinationstation=N01")
    expect(response.body).toEqual(fares_test)
  });

  test('/api/entrances', async () => {
    await backend.delay(500)
    await get_fare_info("F01","N01")
    const response = await request(app).get("/api/entrances?station=A01")
    expect(response.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        Name: expect.any(String), 
        Description: expect.any(String), 
        Lat: expect.any(Number),
        Lon: expect.any(Number),
        Type: expect.any(String)
      })
    ]))
  });

  test('/api/busStop?stopid=1000031', async () => {
    await backend.delay(500)
    await get_fare_info("F01","N01")
    const response = await request(app).get("/api/busStop?stopid=1000031")
    expect(response.body).toEqual(expect.objectContaining({
      name: "MARTIN LUTHER KING JR AVE SW + DARRINGTON ST SW", 
      lat: expect.any(Number),
      lon: expect.any(Number),
      routes: expect.any(Array),
    }))
  });

  test('/api/bootstrap', async () => {
    get_bus_route("A4")
    let isDone = false
    while(isDone === false){
      const response = await request(app).get('/api/bootstrap')
      expect(response.body).toBeInstanceOf(Object)
      if(response.body.bus_routes === "SUCCESS"){
        isDone = true
      }
      else {
        console.log(response.body.bus_routes + " --- Routes is not done. Retrying in 10 seconds")
        await backend.delay(10000)
      }
    }
  });

  test('/api/busRoute/direction1/stops?route=A4', async () => {
    await get_bus_route("A4");
    const response = await request(app).get("/api/busRoute/direction1/stops?route=A4")
    expect(response.body).toEqual(bus_route_test.Direction1.Stops)
  });

})

async function get_bus_route(route:string){
  bus_route_test = await(await fetch(`https://api.wmata.com/Bus.svc/json/jRouteDetails?RouteID=${route}&api_key=${process.env.WMATA_KEY}`)).json();
}
async function get_test_station_info(station:string){
  station_info_test = await (await fetch(`https://api.wmata.com/Rail.svc/json/jStationInfo?StationCode=${station}&api_key=${process.env.WMATA_KEY}`)).json();
}

async function get_fare_info(source:string, dest:string){
  var temp = await (await fetch(`https://api.wmata.com/Rail.svc/json/jSrcStationToDstStationInfo?FromStationCode=${source}&ToStationCode=${dest}&api_key=${process.env.WMATA_KEY}`)).json();
  fares_test = temp.StationToStationInfos[0].RailFare;
}

var stationlist = ["Metro Center", "Farragut North", "Dupont Circle", "Woodley Park-Zoo/Adams Morgan", "Cleveland Park", "Van Ness-UDC", 
"Tenleytown-AU", "Friendship Heights", "Bethesda", "Medical Center", "Grosvenor-Strathmore", "North Bethesda", "Twinbrook", "Rockville", 
"Shady Grove", "Gallery Pl-Chinatown", "Judiciary Square", "Union Station", "Rhode Island Ave-Brentwood", "Brookland-CUA", "Fort Totten", 
"Takoma", "Silver Spring", "Forest Glen", "Wheaton", "Glenmont", "NoMa-Gallaudet U", "Metro Center", "McPherson Square", "Farragut West", 
"Foggy Bottom-GWU", "Rosslyn", "Arlington Cemetery", "Pentagon", "Pentagon City", "Crystal City", "Ronald Reagan Washington National Airport", 
"Potomac Yard", "Braddock Road", "King St-Old Town", "Eisenhower Avenue", "Huntington", "Federal Triangle", "Smithsonian", "L'Enfant Plaza", 
"Federal Center SW", "Capitol South", "Eastern Market", "Potomac Ave", "Stadium-Armory", "Minnesota Ave", "Deanwood", "Cheverly", "Landover", 
"New Carrollton", "Mt Vernon Sq 7th St-Convention Center", "Shaw-Howard U", "U Street/African-Amer Civil War Memorial/Cardozo", "Columbia Heights", 
"Georgia Ave-Petworth", "Fort Totten", "West Hyattsville", "Hyattsville Crossing", "College Park-U of Md", "Greenbelt", "Gallery Pl-Chinatown", 
"Archives-Navy Memorial-Penn Quarter", "L'Enfant Plaza", "Waterfront", "Navy Yard-Ballpark", "Anacostia", "Congress Heights", "Southern Avenue", 
"Naylor Road", "Suitland", "Branch Ave", "Benning Road", "Capitol Heights", "Addison Road-Seat Pleasant", "Morgan Boulevard", "Downtown Largo", 
"Van Dorn Street", "Franconia-Springfield", "Court House", "Clarendon", "Virginia Square-GMU", "Ballston-MU", "East Falls Church", "West Falls Church", 
"Dunn Loring-Merrifield", "Vienna/Fairfax-GMU", "McLean", "Tysons", "Greensboro", "Spring Hill", "Wiehle-Reston East", "Reston Town Center", "Herndon", 
"Innovation Center", "Washington Dulles International Airport", "Loudoun Gateway", "Ashburn"]

export{}