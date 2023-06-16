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

|             |             |             |
| ----------- | ----------- | ----------- |
|![](readme_files/mobile-station-info.png?raw=true ) | ![](readme_files/mobile-station-map.png?raw=true "") | ![](readme_files/mobile-next-arrival.png?raw=true "")|



## Installation

To install:
```
npm install
```
To run backend:
```
tsc src/backend.tsx src/interfaces_and_classes.tsx --jsx react && node src/backend.js
```
To run frontend:
```
npm start
```
To visi frontent:
```
localhost:3000
```
To visit backend:
```
localhost:4000/api/<enter endpoint you want to call>
```
