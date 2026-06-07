export interface GeoPoint {
  lat: number;
  lng: number;
  city: string;
  province: string;
}

// Comprehensive Dutch city lookup table
const DUTCH_CITIES: Record<string, GeoPoint> = {
  // Noord-Holland
  amsterdam: { lat: 52.3676, lng: 4.9041, city: 'Amsterdam', province: 'Noord-Holland' },
  haarlem: { lat: 52.3873, lng: 4.6462, city: 'Haarlem', province: 'Noord-Holland' },
  alkmaar: { lat: 52.6324, lng: 4.7534, city: 'Alkmaar', province: 'Noord-Holland' },
  zaandam: { lat: 52.4384, lng: 4.8136, city: 'Zaandam', province: 'Noord-Holland' },
  hoorn: { lat: 52.6408, lng: 5.0589, city: 'Hoorn', province: 'Noord-Holland' },
  hilversum: { lat: 52.2292, lng: 5.1689, city: 'Hilversum', province: 'Noord-Holland' },
  purmerend: { lat: 52.5021, lng: 4.9597, city: 'Purmerend', province: 'Noord-Holland' },
  schiphol: { lat: 52.3105, lng: 4.7683, city: 'Schiphol', province: 'Noord-Holland' },
  'den helder': { lat: 52.9563, lng: 4.7601, city: 'Den Helder', province: 'Noord-Holland' },
  amstelveen: { lat: 52.3007, lng: 4.8595, city: 'Amstelveen', province: 'Noord-Holland' },
  'noord-holland': { lat: 52.5, lng: 4.9, city: 'Noord-Holland', province: 'Noord-Holland' },

  // Zuid-Holland
  rotterdam: { lat: 51.9225, lng: 4.4792, city: 'Rotterdam', province: 'Zuid-Holland' },
  'den haag': { lat: 52.0705, lng: 4.3007, city: 'Den Haag', province: 'Zuid-Holland' },
  haag: { lat: 52.0705, lng: 4.3007, city: 'Den Haag', province: 'Zuid-Holland' },
  delft: { lat: 52.0116, lng: 4.3571, city: 'Delft', province: 'Zuid-Holland' },
  leiden: { lat: 52.1601, lng: 4.4970, city: 'Leiden', province: 'Zuid-Holland' },
  dordrecht: { lat: 51.8133, lng: 4.6901, city: 'Dordrecht', province: 'Zuid-Holland' },
  zoetermeer: { lat: 52.0574, lng: 4.4940, city: 'Zoetermeer', province: 'Zuid-Holland' },
  gouda: { lat: 52.0116, lng: 4.7111, city: 'Gouda', province: 'Zuid-Holland' },
  westland: { lat: 52.0086, lng: 4.2100, city: 'Westland', province: 'Zuid-Holland' },
  'spijkenisse': { lat: 51.8482, lng: 4.3289, city: 'Spijkenisse', province: 'Zuid-Holland' },
  'south holland': { lat: 52.0, lng: 4.5, city: 'Zuid-Holland', province: 'Zuid-Holland' },
  'zuid-holland': { lat: 52.0, lng: 4.5, city: 'Zuid-Holland', province: 'Zuid-Holland' },

  // Utrecht
  utrecht: { lat: 52.0907, lng: 5.1214, city: 'Utrecht', province: 'Utrecht' },
  amersfoort: { lat: 52.1561, lng: 5.3878, city: 'Amersfoort', province: 'Utrecht' },
  veenendaal: { lat: 52.0267, lng: 5.5558, city: 'Veenendaal', province: 'Utrecht' },
  zeist: { lat: 52.0927, lng: 5.2326, city: 'Zeist', province: 'Utrecht' },
  nieuwegein: { lat: 52.0318, lng: 5.0878, city: 'Nieuwegein', province: 'Utrecht' },

  // Noord-Brabant
  eindhoven: { lat: 51.4416, lng: 5.4697, city: 'Eindhoven', province: 'Noord-Brabant' },
  tilburg: { lat: 51.5555, lng: 5.0913, city: 'Tilburg', province: 'Noord-Brabant' },
  breda: { lat: 51.5719, lng: 4.7683, city: 'Breda', province: 'Noord-Brabant' },
  'den bosch': { lat: 51.6998, lng: 5.3049, city: 'Den Bosch', province: 'Noord-Brabant' },
  helmond: { lat: 51.4817, lng: 5.6616, city: 'Helmond', province: 'Noord-Brabant' },
  'oss': { lat: 51.7658, lng: 5.5186, city: 'Oss', province: 'Noord-Brabant' },
  roosendaal: { lat: 51.5311, lng: 4.4629, city: 'Roosendaal', province: 'Noord-Brabant' },
  'noord-brabant': { lat: 51.6, lng: 5.2, city: 'Noord-Brabant', province: 'Noord-Brabant' },

  // Gelderland
  nijmegen: { lat: 51.8433, lng: 5.8729, city: 'Nijmegen', province: 'Gelderland' },
  arnhem: { lat: 51.9851, lng: 5.8987, city: 'Arnhem', province: 'Gelderland' },
  apeldoorn: { lat: 52.2112, lng: 5.9699, city: 'Apeldoorn', province: 'Gelderland' },
  ede: { lat: 52.0465, lng: 5.6651, city: 'Ede', province: 'Gelderland' },
  zwolle: { lat: 52.5168, lng: 6.0830, city: 'Zwolle', province: 'Overijssel' },
  gelderland: { lat: 52.0, lng: 5.8, city: 'Gelderland', province: 'Gelderland' },

  // Overijssel
  enschede: { lat: 52.2215, lng: 6.8937, city: 'Enschede', province: 'Overijssel' },
  hengelo: { lat: 52.2659, lng: 6.7935, city: 'Hengelo', province: 'Overijssel' },
  almelo: { lat: 52.3549, lng: 6.6626, city: 'Almelo', province: 'Overijssel' },
  deventer: { lat: 52.2550, lng: 6.1638, city: 'Deventer', province: 'Overijssel' },
  overijssel: { lat: 52.4, lng: 6.5, city: 'Overijssel', province: 'Overijssel' },

  // Groningen
  groningen: { lat: 53.2194, lng: 6.5665, city: 'Groningen', province: 'Groningen' },
  'ter apel': { lat: 52.8785, lng: 7.0698, city: 'Ter Apel', province: 'Groningen' },
  'ter-apel': { lat: 52.8785, lng: 7.0698, city: 'Ter Apel', province: 'Groningen' },
  hoogezand: { lat: 53.1667, lng: 6.7500, city: 'Hoogezand', province: 'Groningen' },
  veendam: { lat: 53.1107, lng: 6.8768, city: 'Veendam', province: 'Groningen' },

  // Friesland
  leeuwarden: { lat: 53.2012, lng: 5.7999, city: 'Leeuwarden', province: 'Friesland' },
  sneek: { lat: 53.0328, lng: 5.6601, city: 'Sneek', province: 'Friesland' },
  heerenveen: { lat: 52.9595, lng: 5.9233, city: 'Heerenveen', province: 'Friesland' },
  friesland: { lat: 53.1, lng: 5.8, city: 'Friesland', province: 'Friesland' },

  // Drenthe
  assen: { lat: 52.9925, lng: 6.5626, city: 'Assen', province: 'Drenthe' },
  emmen: { lat: 52.7830, lng: 6.9009, city: 'Emmen', province: 'Drenthe' },
  hoogeveen: { lat: 52.7244, lng: 6.4768, city: 'Hoogeveen', province: 'Drenthe' },
  drenthe: { lat: 52.8, lng: 6.6, city: 'Drenthe', province: 'Drenthe' },

  // Zeeland
  middelburg: { lat: 51.4988, lng: 3.6136, city: 'Middelburg', province: 'Zeeland' },
  vlissingen: { lat: 51.4429, lng: 3.5756, city: 'Vlissingen', province: 'Zeeland' },
  goes: { lat: 51.5046, lng: 3.8900, city: 'Goes', province: 'Zeeland' },
  zeeland: { lat: 51.5, lng: 3.8, city: 'Zeeland', province: 'Zeeland' },

  // Limburg
  maastricht: { lat: 50.8514, lng: 5.6910, city: 'Maastricht', province: 'Limburg' },
  venlo: { lat: 51.3704, lng: 6.1724, city: 'Venlo', province: 'Limburg' },
  roermond: { lat: 51.1933, lng: 5.9874, city: 'Roermond', province: 'Limburg' },
  heerlen: { lat: 50.8883, lng: 5.9797, city: 'Heerlen', province: 'Limburg' },
  sittard: { lat: 50.9997, lng: 5.8700, city: 'Sittard', province: 'Limburg' },
  limburg: { lat: 51.2, lng: 5.9, city: 'Limburg', province: 'Limburg' },

  // Flevoland
  almere: { lat: 52.3508, lng: 5.2647, city: 'Almere', province: 'Flevoland' },
  lelystad: { lat: 52.5185, lng: 5.4714, city: 'Lelystad', province: 'Flevoland' },
  flevoland: { lat: 52.5, lng: 5.5, city: 'Flevoland', province: 'Flevoland' },

  // National fallback
  nederland: { lat: 52.1326, lng: 5.2913, city: 'Nederland', province: 'Nationaal' },
  netherlands: { lat: 52.1326, lng: 5.2913, city: 'Nederland', province: 'Nationaal' },
};

// Province centroids for fallback
const PROVINCE_CENTROIDS: Record<string, GeoPoint> = {
  'Noord-Holland': { lat: 52.5209, lng: 4.8808, city: 'Noord-Holland', province: 'Noord-Holland' },
  'Zuid-Holland':  { lat: 52.0218, lng: 4.4938, city: 'Zuid-Holland', province: 'Zuid-Holland' },
  'Utrecht':       { lat: 52.0907, lng: 5.1214, city: 'Utrecht', province: 'Utrecht' },
  'Noord-Brabant': { lat: 51.5823, lng: 5.0454, city: 'Noord-Brabant', province: 'Noord-Brabant' },
  'Gelderland':    { lat: 52.0452, lng: 5.8718, city: 'Gelderland', province: 'Gelderland' },
  'Overijssel':    { lat: 52.4387, lng: 6.5018, city: 'Overijssel', province: 'Overijssel' },
  'Friesland':     { lat: 53.1041, lng: 5.8028, city: 'Friesland', province: 'Friesland' },
  'Groningen':     { lat: 53.2194, lng: 6.5665, city: 'Groningen', province: 'Groningen' },
  'Drenthe':       { lat: 52.9476, lng: 6.6230, city: 'Drenthe', province: 'Drenthe' },
  'Flevoland':     { lat: 52.5274, lng: 5.5997, city: 'Flevoland', province: 'Flevoland' },
  'Zeeland':       { lat: 51.4988, lng: 3.6136, city: 'Zeeland', province: 'Zeeland' },
  'Limburg':       { lat: 51.2000, lng: 5.9000, city: 'Limburg', province: 'Limburg' },
  'Nationaal':     { lat: 52.1326, lng: 5.2913, city: 'Nederland', province: 'Nationaal' },
};

export function geocodeText(text: string, provinces: string[]): GeoPoint | null {
  const lower = text.toLowerCase();

  // Try to find a city match in the text
  for (const [key, point] of Object.entries(DUTCH_CITIES)) {
    if (lower.includes(key)) return point;
  }

  // Fall back to province centroid
  for (const province of provinces) {
    if (PROVINCE_CENTROIDS[province]) return PROVINCE_CENTROIDS[province];
  }

  return null;
}

export function geocodeByProvince(province: string): GeoPoint | null {
  return PROVINCE_CENTROIDS[province] ?? null;
}

export function getAllProvinceCentroids(): GeoPoint[] {
  return Object.values(PROVINCE_CENTROIDS);
}
