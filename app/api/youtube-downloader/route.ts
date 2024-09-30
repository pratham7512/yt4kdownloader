import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';


// Function to get the user's IP address
async function getUserIpAddress(req: NextRequest): Promise<string | undefined> { // {{ edit_1 }}
  const ip = req.headers.get('x-forwarded-for') || req.ip; // Get IP from headers or request
  const ipArray = ip ? ip.split(',') : [];
  const userIp = ipArray.length > 0 ? ipArray[0].trim() : undefined; // Get the first IP and trim whitespace
  console.log(userIp);
  return userIp; // Return the first IP if multiple are present
}

// Define the POST function
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, url, quality } = body;

  // Handle different actions
  switch (action) {
    case 'getInfo':
      return getVideoInfo(url,req);
    case 'getDownloadLink':
      return getDownloadLink(url, quality);
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

// Function to get video information
async function getVideoInfo(url: string, req: NextRequest) { // {{ edit_2 }}
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Create an agent with a static IPv6 address
  const agent = ytdl.createAgent(undefined, {
    localAddress: await getUserIpAddress(req) || '0.0.0.0', // Fallback to a default IP if none found
  });

  try {
    const info = await ytdl.getInfo(url, { agent });
    const qualities = info.formats.map(format => ({
      itag: format.itag,
      qualityLabel: format.qualityLabel,
      container: format.container,
      codecs: format.codecs,
    }));

    return NextResponse.json({
      title: info.videoDetails.title,
      qualities,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch video info' }, { status: 500 });
  }
}


async function getDownloadLink(url: string, quality: string) {
  if (!url || !quality) {
    return NextResponse.json({ error: 'URL and quality are required' }, { status: 400 });
  }

  try {
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality });
    if (!format) {
      return NextResponse.json({ error: 'Requested quality not available' }, { status: 404 });
    }

    return NextResponse.json({
      downloadUrl: format.url,
      contentLength: format.contentLength,
    });
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
  }
}

