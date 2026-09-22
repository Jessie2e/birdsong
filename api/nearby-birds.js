const EBIRD_ENDPOINT =
  "https://api.ebird.org/v2/data/obs/geo/recent";

function clamp(value, min, max, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.min(max, Math.max(min, number));
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({
      error: "Method not allowed.",
    });
  }

  const apiKey = process.env.EBIRD_API_KEY;

  if (!apiKey) {
    return response.status(503).json({
      error:
        "Birdsong's eBird connection needs its API key before nearby practice can go live.",
      code: "EBIRD_API_KEY_MISSING",
    });
  }

  const lat = Number(request.query.lat);
  const lng = Number(request.query.lng);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return response.status(400).json({
      error: "A valid latitude and longitude are required.",
    });
  }

  const dist = clamp(request.query.dist, 1, 50, 25);
  const back = clamp(request.query.back, 1, 30, 7);

  const url = new URL(EBIRD_ENDPOINT);
  url.searchParams.set("lat", lat.toFixed(2));
  url.searchParams.set("lng", lng.toFixed(2));
  url.searchParams.set("dist", String(dist));
  url.searchParams.set("back", String(back));
  url.searchParams.set("cat", "species");
  url.searchParams.set("sppLocale", "en");

  try {
    const ebirdResponse = await fetch(url, {
      headers: {
        "X-eBirdApiToken": apiKey,
      },
    });

    if (!ebirdResponse.ok) {
      const details = await ebirdResponse.text();

      console.error(
        "eBird API error:",
        ebirdResponse.status,
        details
      );

      return response.status(502).json({
        error:
          "eBird didn't return nearby sightings right now. Try again in a moment.",
      });
    }

    const observations = await ebirdResponse.json();

    const safeObservations = observations.map((observation) => ({
      speciesCode: observation.speciesCode,
      comName: observation.comName,
      sciName: observation.sciName,
      obsDt: observation.obsDt,
      howMany: observation.howMany ?? null,
    }));

    response.setHeader(
      "Cache-Control",
      "s-maxage=900, stale-while-revalidate=3600"
    );

    return response.status(200).json({
      observations: safeObservations,
      radiusKm: dist,
      daysBack: back,
    });
  } catch (error) {
    console.error("Nearby birds proxy failed:", error);

    return response.status(502).json({
      error:
        "Birdsong couldn't reach eBird right now. Try again in a moment.",
    });
  }
}
