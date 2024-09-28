import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core'; // Import useProxy
import fetch from 'node-fetch'; // Ensure you have node-fetch installed

// Assuming data has a specific structure, define its type
interface ProxyData {
  ip:string;
  port: string;
  speed: number;
  upTime: number; // Add this line
  protocols: string[]; // Add this line to include protocols
  anonymityLevel: string; // Add this line
}

async function getBestProxy() {
  const response = await fetch('https://proxylist.geonode.com/api/proxy-list?limit=500&page=1&sort_by=lastChecked&sort_type=desc');
  const data = await response.json();
  
  // Filter for proxies with port 80, HTTPS protocol, high uptime, and elite anonymity
  const proxies = (data as { data: ProxyData[] }).data
    .filter(proxy => 
      proxy.port === "80" && 
      proxy.protocols.includes('https') && 
      proxy.speed > 1 && // Speed threshold
      proxy.upTime > 90 && // Uptime threshold
      proxy.anonymityLevel === "elite" // Check for elite anonymity
    )
    .sort((a, b) => b.speed - a.speed); // Sort by speed descending

  return proxies.length > 0 ? proxies[0] : null; // Return the best proxy or null
}



export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, url, quality } = body;

  if (action === 'getInfo') {
    return getVideoInfo(url);
  } else if (action === 'getDownloadLink') {
    return getDownloadLink(url, quality);
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

async function getVideoInfo(url: string) {
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const proxy = await getBestProxy();
    const agent = proxy ? ytdl.createProxyAgent({ uri: `https://${proxy.ip}:${proxy.port}` }) : undefined; // Changed null to undefined
    const info = await ytdl.getInfo(url, { agent }); // Use dispatcher instead of agent
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
    console.log(error)
    return NextResponse.json({ error: 'Failed to fetch video info' }, { status: 500 });
  }
}

async function getDownloadLink(url: string, quality: string) {
  if (!url || !quality) {
    return NextResponse.json({ error: 'URL and quality are required' }, { status: 400 });
  }

  try {
    const proxy = await getBestProxy();
    const agent = proxy ? ytdl.createProxyAgent({ uri: `https://${proxy.ip}:${proxy.port}` }) : undefined;
    const info = await ytdl.getInfo(url, {agent});
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

