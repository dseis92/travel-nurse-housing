const RAPID_KEY = import.meta.env.VITE_RAPIDAPI_KEY as string | undefined

const PLACES_URL = 'https://google-maps-api-free.p.rapidapi.com/google-autocomplete'
const PLACES_HOST = 'google-maps-api-free.p.rapidapi.com'

if (!RAPID_KEY) {
  console.warn('[placesAutocomplete] Missing VITE_RAPIDAPI_KEY in .env.local')
}

export type PlaceSuggestion = {
  id: string
  description: string
  mainText?: string
  secondaryText?: string
}

/**
 * Call the RapidAPI "google-maps-api-free" /google-autocomplete endpoint.
 * This wraps your curl:
 *
 * curl --request GET \
 *   --url 'https://google-maps-api-free.p.rapidapi.com/google-autocomplete?input=...' \
 *   --header 'x-rapidapi-host: google-maps-api-free.p.rapidapi.com' \
 *   --header 'x-rapidapi-key: ...'
 */
export async function autocompletePlaces(input: string): Promise<PlaceSuggestion[]> {
  const trimmed = input.trim()
  if (!trimmed) return []

  if (!RAPID_KEY) {
    // No key: bail early
    return []
  }

  let url: URL
  try {
    url = new URL(PLACES_URL)
  } catch (err) {
    console.error('[placesAutocomplete] Invalid PLACES_URL', PLACES_URL, err)
    return []
  }

  url.searchParams.set('input', trimmed)

  let res: Response
  try {
    res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPID_KEY,
        'x-rapidapi-host': PLACES_HOST,
      },
    })
  } catch (err) {
    console.error('[placesAutocomplete] Network error', err)
    return []
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[placesAutocomplete] HTTP error', res.status, res.statusText, text)
    return []
  }

  let data: any
  try {
    data = await res.json()
  } catch (err) {
    console.error('[placesAutocomplete] Failed to parse JSON', err)
    return []
  }

  // For debugging: log the raw response once so we can see the real shape
  if (import.meta.env.DEV) {
    console.debug('[placesAutocomplete] Raw response sample:', data)
  }

  // Try common Google Places/Proxy shapes
  const predictions =
    data?.predictions ??
    data?.data ??
    data?.results ??
    (Array.isArray(data) ? data : [])

  if (!Array.isArray(predictions)) {
    console.warn('[placesAutocomplete] Unexpected response shape (no array)', data)
    return []
  }

  return predictions.map((p: any, index: number): PlaceSuggestion => {
    const description =
      p.description ??
      p.formatted_address ??
      p.name ??
      JSON.stringify(p)

    const mainText =
      p.structured_formatting?.main_text ??
      p.main_text ??
      undefined

    const secondaryText =
      p.structured_formatting?.secondary_text ??
      p.secondary_text ??
      undefined

    const id =
      p.place_id ??
      p.id ??
      `${description}-${index}`

    return {
      id: String(id),
      description: String(description),
      mainText,
      secondaryText,
    }
  })
}
