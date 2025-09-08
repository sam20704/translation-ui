// app/api/process-pdf/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // Forward the request to the improved API
  const url = new URL('/api/pdf/process', request.url);
  return fetch(url.toString(), {
    method: 'POST',
    body: await request.blob(),
    headers: {
      'Content-Type': request.headers.get('Content-Type') || 'multipart/form-data',
    },
  });
}
