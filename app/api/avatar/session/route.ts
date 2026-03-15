import RunwayML from '@runwayml/sdk';
import { NextRequest } from 'next/server';

// Allow up to 30s on Vercel — session polling can take ~5–15s
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const avatarId: string | undefined = body?.avatarId;

    if (!avatarId) {
      return Response.json({ error: 'avatarId is required' }, { status: 400 });
    }

    // Support either variable name in .env
    const apiKey =
      process.env.RUNWAYML_API_SECRET ?? process.env.Runway_API_Key;

    if (!apiKey) {
      console.error('No Runway API key found in environment');
      return Response.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const client = new RunwayML({ apiKey });

    // Step 1: Create the session (60s max = ~1 min of talk time)
    const { id: sessionId } = await client.realtimeSessions.create({
      model: 'gwm1_avatars',
      avatar: { type: 'custom', avatarId },
      maxDuration: 60,
    });

    // Step 2: Poll until READY (max ~25s to stay inside maxDuration)
    for (let i = 0; i < 25; i++) {
      const session = await client.realtimeSessions.retrieve(sessionId);

      if (session.status === 'READY') {
        // Return sessionId + sessionKey — the client SDK handles the /consume
        // call itself using the correct headers (see @runwayml/avatars-react/dist/api.js)
        const sessionKey = (session as unknown as { sessionKey: string })
          .sessionKey;
        return Response.json({ sessionId, sessionKey });
      }

      if (session.status === 'FAILED' || session.status === 'CANCELLED') {
        const reason =
          (session as unknown as { failure?: string }).failure ?? session.status;
        console.error('Session failed:', reason);
        return Response.json(
          { error: `Session failed: ${reason}` },
          { status: 500 }
        );
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    return Response.json(
      { error: 'Session timed out waiting to become ready' },
      { status: 504 }
    );
  } catch (err) {
    console.error('Session route error:', err);
    return Response.json(
      { error: 'Unexpected error creating session' },
      { status: 500 }
    );
  }
}
