# WMATA Redesign

This is a Web Application that serves real time information about the DC Metro system. Using WMATA's developer API, this app atempts to make next train arrvals, interactive maps, and system alerts more accesible and easier to read than WMATA's website. This was built with TypeScript, React, Express, and Bootstrap.

## Project Status

This is currently in development and has no planned release date. However, I do plan on working on it throught the summer.

**List of Features currently implemented**

1. Rail station information, alerts, fares, and train arrivals
2. Interactive map that shows rail lines, stations, and entraces
3. Next train arrivals page
4. Alerts page (Only shows rail alerts for now)

**List of Features to be implemented in the future**

1. Bus arrivals, stops, alerts, and map data
2. Popups for elements on the interactive maps
3. Separate interactive map page to explore the system
4. Search function to easily access different parts of the app
5. Visual redesign to adhere to WMATA's design principles

## Screenshots

![Screenshot of Metro Center Information screen. It includes real time arrivals, alerts, maps, and entrance locations](readme_files/Station-info-page.png?raw=true "Metro Center Station Information Screen on Desktop")

<p align="center">
<img width="32.5%" src="readme_files/mobile-station-info.png?raw=true">
<img width="32.5%" src="readme_files/mobile-station-map.png?raw=true">
<img width="32.5%" src="readme_files/mobile-next-arrival.png?raw=true">
</p>

## Setup & Installation

You will need your own WMATA api key to run the backend. You can signup for an account for free at [developer.wmata.com](https://developer.wmata.com). You will also need an api key from Mapbox. You can get a key from [mapbox.com](https://www.mapbox.com). Next, create a .env.local file in the root directtory to put your keys in. You also set the address of the backend and the style of the interactive maps here. The file should look like this below.

```
WMATA_KEY=<your api key>
REACT_APP_PROXY_ADDR='http://localhost:4000' (or wherever you're hosting the backend)
REACT_APP_MAPBOX_KEY=<your api key>
REACT_APP_MAPBOX_STYLE='mapbox://styles/samuelj246/clj0ed7g7018v01qi7k96f2oe' (Or you can put your own style)
```

After that, you should be able to run the commands below and start using the app.

To install:
```
npm install
```
To run backend:
```
tsc api/backend.tsx api/interfaces_and_classes.tsx --jsx react && node api/backend.js
```
To run frontend:
```
npm start
```
To visit frontent:
```
localhost:3000
```
To visit backend:
```
localhost:4000/api/<enter endpoint you want to call>
```
