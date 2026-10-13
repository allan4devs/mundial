import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export async function POST() {
  try {
    // Auth with X API v2 (OAuth 1.0a – server-side safe)
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_SECRET!,
    });

    // Dynamic content example (customize: e.g., pull from your context/hooks or AI)
    const postContent = `Fresh vibes from MVP LaJaVentures! ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} 🚀 #NextJS #TechAdventures`;

    // Post the tweet
    const tweet = await client.v2.tweet(postContent);
    console.log(`Posted! Tweet ID: ${tweet.data.id}`);  // Logs to Vercel dashboard

    return NextResponse.json({ success: true, tweetId: tweet.data.id });
  } catch (error) {
    console.error('X Post Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}