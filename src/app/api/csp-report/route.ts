import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/utils/rateLimit';

/**
 * CSP violation collector. Browsers POST reports here; we log the directive and
 * a query-stripped URL only — never cookies, tokens or full referrers.
 */
export async function POST(request: NextRequest) {
  const rl = rateLimit('csp-report', getClientIp(request), 30, 60 * 1000);
  if (!rl.success) return new NextResponse(null, { status: 429 });

  const contentType = request.headers.get('content-type') || '';
  if (!/application\/(csp-report|reports\+json)/i.test(contentType)) {
    return new NextResponse(null, { status: 415 });
  }

  const raw = await request.text();
  if (raw.length > 8_000) return new NextResponse(null, { status: 413 });

  try {
    const body = JSON.parse(raw);
    const report = body?.['csp-report'] ?? (Array.isArray(body) ? body[0]?.body : body);
    if (report && typeof report === 'object') {
      const strip = (value: unknown) =>
        typeof value === 'string' ? value.split('?')[0].slice(0, 300) : undefined;

      console.warn('CSP violation:', {
        directive: strip(report['violated-directive'] ?? report.effectiveDirective),
        blocked: strip(report['blocked-uri'] ?? report.blockedURL),
        document: strip(report['document-uri'] ?? report.documentURL),
      });
    }
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}
