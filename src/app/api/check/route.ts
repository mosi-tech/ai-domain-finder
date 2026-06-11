import { NextRequest, NextResponse } from "next/server";

const NAMECHEAP_API_USER = process.env.NAMECHEAP_API_USER!;
const NAMECHEAP_API_KEY = process.env.NAMECHEAP_API_KEY!;
const NAMECHEAP_CLIENT_IP = process.env.NAMECHEAP_CLIENT_IP!;
const NAMECHEAP_SANDBOX = process.env.NAMECHEAP_SANDBOX !== "false";

const API_URL = NAMECHEAP_SANDBOX
  ? "https://api.sandbox.namecheap.com/xml.response"
  : "https://api.namecheap.com/xml.response";

interface DomainCheck {
  domain: string;
  available: boolean;
  price?: number;
  isPremium?: boolean;
}

async function checkNamecheap(domains: string[]): Promise<DomainCheck[]> {
  const domainList = domains.join(",");
  console.log(`[Namecheap] Checking ${domains.length} domains against ${NAMECHEAP_SANDBOX ? 'SANDBOX' : 'PRODUCTION'} API`);
  const url = `${API_URL}?ApiUser=${NAMECHEAP_API_USER}&ApiKey=${NAMECHEAP_API_KEY}&UserName=${NAMECHEAP_API_USER}&Command=namecheap.domains.check&ClientIp=${NAMECHEAP_CLIENT_IP}&DomainList=${domainList}`;

  const response = await fetch(url);
  const text = await response.text();

  const results: DomainCheck[] = [];
  const domainRegex = /DomainCheckResult[^>]*Domain="([^"]+)"[^>]*Available="([^"]+)"[^>]*IsPremiumName="([^"]+)"[^>]*(?:IsPremiumDomain="([^"]+)")?[^>]*/g;
  let match;

  while ((match = domainRegex.exec(text)) !== null) {
    const domain = match[1];
    const available = match[2].toLowerCase() === "true";
    const isPremium = match[3].toLowerCase() === "true" || (match[4] !== undefined && match[4].toLowerCase() === "true");
    results.push({ domain, available, isPremium });
  }

  if (results.length === 0) {
    const altRegex = /DomainCheckResult[^>]*Domain="([^"]+)"[^>]*Available="([^"]+)"[^>]*/g;
    while ((match = altRegex.exec(text)) !== null) {
      results.push({
        domain: match[1],
        available: match[2].toLowerCase() === "true",
      });
    }
  }

  if (results.length === 0) {
    throw new Error(`Namecheap API returned no results. Response: ${text.substring(0, 500)}`);
  }

  return results;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { domains } = body as { domains: string[] };

  if (!domains || !Array.isArray(domains) || domains.length === 0) {
    return NextResponse.json({ error: "No domains provided" }, { status: 400 });
  }

  if (domains.length > 50) {
    return NextResponse.json(
      { error: "Maximum 50 domains per request" },
      { status: 400 }
    );
  }

  try {
    const results = await checkNamecheap(domains);
    return NextResponse.json({
      results,
      checked: results.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Namecheap API error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}