import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

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
    const info = await ytdl.getInfo(url);
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