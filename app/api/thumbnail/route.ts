import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shortcode = searchParams.get('shortcode');

  if (!shortcode) {
    return NextResponse.json({ error: 'shortcode required' }, { status: 400 });
  }

  try {
    // Try Instagram media endpoint
    const igUrl = `https://www.instagram.com/p/${shortcode}/media/?size=l`;
    const res = await fetch(igUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const buffer = await res.arrayBuffer();
      return new NextResponse(Buffer.from(buffer), {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
    }

    // Fallback: return a placeholder
    return NextResponse.redirect(
      `https://placehold.co/360x640/111111/666666?text=@${shortcode}`,
      302
    );
  } catch {
    return NextResponse.redirect(
      `https://placehold.co/360x640/111111/666666?text=Reel`,
      302
    );
  }
}
