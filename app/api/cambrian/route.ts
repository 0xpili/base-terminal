import { NextRequest, NextResponse } from 'next/server';

const CAMBRIAN_BASE_URL = 'https://opabinia.cambrian.network/api/v1';

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 60000; // 1 minute cache for pool data
const PRICE_CACHE_TTL = 10000; // 10 seconds for price data

function getCacheKey(url: string): string {
  return url;
}

function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any, ttl: number): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttl,
  });
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.CAMBRIAN_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Get the endpoint and params from query string
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint parameter required' },
        { status: 400 }
      );
    }

    // Build the Cambrian API URL
    const cambrianUrl = new URL(`${CAMBRIAN_BASE_URL}${endpoint}`);

    // Forward all other query params except 'endpoint'
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        cambrianUrl.searchParams.append(key, value);
      }
    });

    const cacheKey = getCacheKey(cambrianUrl.toString());

    // Check cache first
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log('Cache hit for:', cambrianUrl.toString());
      return NextResponse.json(cachedData);
    }

    // Make the request to Cambrian API
    console.log('Fetching from Cambrian API:', cambrianUrl.toString());

    const response = await fetch(cambrianUrl.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log('Cambrian API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Cambrian API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        url: cambrianUrl.toString()
      });

      return NextResponse.json(
        {
          error: errorData.message || 'Cambrian API error',
          status: response.status,
          details: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Cache the response based on endpoint type
    const ttl = endpoint?.includes('price') ? PRICE_CACHE_TTL : CACHE_TTL;
    setCache(cacheKey, data, ttl);

    return NextResponse.json(data);

  } catch (error) {
    console.error('Cambrian API proxy error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
