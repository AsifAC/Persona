import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { searchType, body } = await req.json()

    if (!searchType) {
      return new Response(JSON.stringify({ error: 'Missing searchType' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const baseUrl = Deno.env.get('ENFORMIONGO_BASE_URL')
    const apiKeyName = Deno.env.get('ENFORMIONGO_API_KEY_NAME')
    const apiKeyPassword = Deno.env.get('ENFORMIONGO_API_KEY_PASSWORD')
    const clientType = Deno.env.get('ENFORMIONGO_CLIENT_TYPE') || 'Persona-Web'

    if (!baseUrl || !apiKeyName || !apiKeyPassword) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const endpointMap: Record<string, string | undefined> = {
      PersonSearch: Deno.env.get('ENFORMIONGO_ENDPOINT_PERSON_SEARCH'),
      DevAPIContactEnrich: Deno.env.get('ENFORMIONGO_ENDPOINT_CONTACT_ENRICHMENT'),
      DevAPIContactEnrichPlus: Deno.env.get('ENFORMIONGO_ENDPOINT_CONTACT_ENRICHMENT_PLUS'),
      ReversePhoneSearch: Deno.env.get('ENFORMIONGO_ENDPOINT_REVERSE_PHONE'),
      CriminalSearchV2: Deno.env.get('ENFORMIONGO_ENDPOINT_CRIMINAL_RECORDS'),
      PropertySearchV2: Deno.env.get('ENFORMIONGO_ENDPOINT_PROPERTY_RECORDS'),
      AddressID: Deno.env.get('ENFORMIONGO_ENDPOINT_ADDRESS_SEARCH'),
    }
    const upstreamUrl = endpointMap[searchType] || baseUrl

    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'galaxy-ap-name': apiKeyName,
        'galaxy-ap-password': apiKeyPassword,
        'galaxy-search-type': searchType,
        'galaxy-client-type': clientType,
      },
      body: JSON.stringify(body ?? {}),
    })

    const contentType = upstream.headers.get('content-type') || ''
    const payload = contentType.includes('application/json')
      ? await upstream.json()
      : await upstream.text()

    if (!upstream.ok) {
      return new Response(JSON.stringify({
        error: 'Upstream request failed',
        status: upstream.status,
        detail: payload,
      }), {
        status: upstream.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      typeof payload === 'string' ? payload : JSON.stringify(payload),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': contentType || 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
