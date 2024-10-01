import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';


// // Function to get the user's IP address
// async function getUserIpAddress(req: NextRequest): Promise<string | undefined> { // {{ edit_1 }}
//   const forwarded = req.headers.get('x-forwarded-for'); // Use .get() method
//   const ip = (typeof forwarded === 'string' ? forwarded.split(/, /)[0] : req.ip) || ''; // Use req.ip instead of req.socket.remoteAddress
//   console.log("this is fake" + ip); // Corrected variable name
//   return ip; // Return undefined if no valid IPv4 address is found
// }

// Define the POST function
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, url, quality } = body;

  // Handle different actions
  switch (action) {
    case 'getInfo':
      return getVideoInfo(url);
    case 'getDownloadLink':
      return getDownloadLink(url, quality);
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

// Function to get video information
async function getVideoInfo(url: string) { // {{ edit_2 }}
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Create an agent with a static IPv6 address
  const agent = ytdl.createAgent(undefined, {
    localAddress: '192.168.0.118', // Fallback to a default IP if none found
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

