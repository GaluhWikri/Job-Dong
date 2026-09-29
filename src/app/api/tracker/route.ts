import { NextRequest, NextResponse } from 'next/server';
import { getTrackerRows } from '@/lib/tracker-sheet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // ?fresh=1 → paksa baca ulang dari Google (tombol Sinkron & auto-refresh).
  const fresh = request.nextUrl.searchParams.get('fresh') === '1';
  const { rows, error } = await getTrackerRows({ fresh });
  return NextResponse.json({ success: !error, rows, error });
}
