import { readState, freshness } from '#lib/server/storage';
export async function load({
  locals,
  cookies,
}: {
  locals: App.Locals;
  cookies: { get: (name: string) => string | undefined };
}) {
  const { analysis, tours } = await readState();
  return {
    token: locals.token,
    theme: ['light', 'dark'].includes(cookies.get('nairrator-theme') ?? '')
      ? (cookies.get('nairrator-theme') as 'light' | 'dark')
      : ('system' as const),
    workspace: analysis
      ? {
          analysis,
          tour: tours.filter((t) => t.analysisId === analysis.id).at(-1) ?? null,
          freshness: await freshness(analysis),
          tours: tours.map((t) => ({ id: t.id, title: t.title })),
        }
      : null,
    providers: {
      openai: !!process.env.OPENAI_API_KEY,
      ollama: !!process.env.OLLAMA_MODEL,
      speech: !!(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID),
      localOnly: process.env.NAIRRATOR_LOCAL_ONLY !== 'false',
    },
  };
}
