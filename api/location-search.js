export default async function handler(request, response) {
  if (request.method !== 'GET') { response.setHeader('Allow', 'GET'); return response.status(405).json({error:'Method not allowed.'}); }
  const query = typeof request.query.q === 'string' ? request.query.q.trim() : '';
  if (query.length < 2 || query.length > 100) return response.status(400).json({error:'Enter a city or ZIP code (2–100 characters).'});
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query); url.searchParams.set('count','6'); url.searchParams.set('language','en');
  // ZIP codes are US-specific; city searches remain worldwide.
  if (/^\d{5}$/.test(query)) url.searchParams.set('countryCode','US');
  try {
    const upstream = await fetch(url, {signal:AbortSignal.timeout(10000)});
    if (!upstream.ok) throw new Error('Place provider unavailable');
    const data = await upstream.json();
    const places = (data.results || []).filter(place => Number.isFinite(place.latitude) && Number.isFinite(place.longitude)).map(place => ({
      id:place.id, label:[place.name,place.admin1,place.country].filter(Boolean).join(', '), latitude:place.latitude, longitude:place.longitude,
    }));
    response.setHeader('Cache-Control','no-store');
    return response.status(200).json({places});
  } catch { return response.status(502).json({error:'We couldn’t search places right now. Try again in a moment.'}); }
}
