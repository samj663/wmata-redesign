/**
 * These are public access tokens so they don't need to be secured.
 * Mapbox also provides the ability provide url restrictions
 */

export var REACT_APP_MAPBOX_STYLE_MONOCHROME = process.env.REACT_APP_MAPBOX_STYLE_MONOCHROME || "mapbox://styles/samuelj246/cllmeecax02ik01p89omef3g2"
export var REACT_APP_MAPBOX_KEY = process.env.REACT_APP_MAPBOX_KEY_PUBLIC || "pk.eyJ1Ijoic2FtdWVsajI0NiIsImEiOiJjbGxrMHgzOWwwdjkwM2VwYXpnMGdieHluIn0.LTf2Lj9kuERyDhhWYGHkOw"
export var REACT_APP_MAPBOX_STYLE = process.env.REACT_APP_MAPBOX_STYLE || 'mapbox://styles/samuelj246/clj0ed7g7018v01qi7k96f2oe'
export const API_URL = ((process.env.REACT_APP_API_URL === undefined)) ? 'https://wmata-backend.onrender.com':process.env.REACT_APP_API_URL;

export * from './tokens'