import { ESMap } from "typescript";

export class stationCodeNameMap{
    code: ESMap<string, string>;
    name: ESMap<string, string>;
    codeArray: string[]
    nameArray: string[];
    constructor(code: ESMap<string, string>, name: ESMap<string, string>, codeArray: string[], nameArray: string[]){
        this.code = code;
        this.name = name;
        this.codeArray = codeArray;
        this.nameArray = nameArray;
    }
    get(input: string): string | undefined{
        let c = this.code.get(input);
        let n = this.name.get(input);
        if(c === undefined) return n;
        return c;
    }
    getCode(input:string): string | undefined{
        let c = this.code.get(input);
        let n = this.name.get(input);
        if(c === undefined) return n;
        return input;
    }
}

export interface train{
    Car: string | null | undefined
    Destination: string | null | undefined,
    DestinationCode: string | null | undefined,
    DestinationName: string | null | undefined,
    Group: string,
    Line: string,
    LocationCode: string,
    LocationName: string,
    Min: string | null | undefined
}

export interface fares{
    PeakTime: number,
    OffPeakTime: number,
    SeniorDisabled: number
}

export interface entrance{
    Name: string,
    Description: string,
    Lat: number,
    Lon: number,
    Type: string
}

export interface station{
    Code : string,
    Name : string,
    StationTogether1: string,
    StationTogether2: string,
    LineCode1: string,
    LineCode2: string | null,
    LineCode3: string | null,
    LineCode4: string | null,
    Lat: number,
    Lon: number,
    Address: {
      Street: string,
      "City": string,
      "State": string,
      "Zip": string
    }
    entrances: entrance[];
    fares: ESMap<string,fares>;
    lines: string[]
}

export interface busStop{
    name: string,
    lat: number,
    lon: number,
    routes: string[],
    lastUpdated: number | undefined | null,
    nextBus: nextBus[] | undefined | null
}

export interface busRoute{
    name: string,
    description: string,
    lastUpdated: number,
    paths: any | undefined
}

export interface nextBus{
    route: string,
    min: number,
    directionText: string,
    directionNum: string,
    vehicleID: string
}

export interface error_template{
    timestamp: string;
    function: string;
    error: string;
    trace: string;
}
