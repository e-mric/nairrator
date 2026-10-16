import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { resolve } from 'node:path';
import { analyze } from '#lib/server/analysis';
import { readState, updateState, freshness, checkDataRoot } from '#lib/server/storage';
import { makeTour } from '#lib/server/tours';
import { explain, modelPayload, speech } from '#lib/server/providers';
import { levels } from '#lib/types';
import { capturePreview } from '#lib/server/local-preview';
import { reviewProject } from '#lib/server/review';
export async function POST({
  request,
  params,
  locals,
  url,
}: {
  request: Request;
  params: { action: string };
  locals: App.Locals;
  url: URL;
}) {
  try {
    if (params.action === 'session') return json({ token: locals.token });
    const text = await request.text();
    if (text.length > 16000) return json({ error: 'Request too large' }, { status: 413 });
    const body = JSON.parse(text);
    if (params.action === 'open') {
      const input = z
        .object({
          path: z.string().max(2000).optional(),
          sample: z.boolean(),
          exclusions: z.array(z.string().max(200)).max(30).default([]),
        })
        .parse(body);
      const root = input.sample ? resolve('fixtures/waypoint') : input.path;
      if (!root) throw new Error('Choose a local repository directory.');
      await checkDataRoot(root);
      const analysis = await analyze(root, input.sample, input.exclusions);
      await checkDataRoot(analysis.root);
      await updateState((s) => {
        s.analysis = analysis;
        s.analyses = s.analyses.filter((a) => a.id !== analysis.id);
        s.analyses.push(analysis);
      });
      const saved = await readState();
      return json({
        analysis,
        tour: null,
        freshness: await freshness(analysis),
        tours: saved.tours.map((t) => ({ id: t.id, title: t.title })),
      });
    }
    const state = await readState();
    if (params.action === 'reopen') {
      const { tourId } = z.object({ tourId: z.string() }).parse(body);
      const tour = state.tours.find((t) => t.id === tourId),
        analysis = state.analyses.find((a) => a.id === tour?.analysisId);
      if (!tour || !analysis) throw new Error('Saved tour snapshot not found.');
      await updateState((s) => {
        s.analysis = analysis;
        s.tours = s.tours.filter((t) => t.id !== tour.id);
        s.tours.push(tour);
      });
      return json({
        analysis,
        tour,
        freshness: await freshness(analysis),
        tours: state.tours.map((t) => ({ id: t.id, title: t.title })),
      });
    }
    const a = state.analysis;
    if (!a) throw new Error('Open a repository first.');
    if (params.action === 'freshness') return json(await freshness(a));
    if (params.action === 'tour') {
      if ((await freshness(a)).stale)
        throw new Error(
          'Source files changed. Reopen the selected directory before building a tour.',
        );
      const { entryId } = z.object({ entryId: z.string() }).parse(body);
      const tour = makeTour(a, entryId);
      await updateState((s) => {
        s.tours = s.tours.filter((t) => t.id !== tour.id);
        s.tours.push(tour);
      });
      return json(tour);
    }
    const input = z.object({ tourId: z.string() }).passthrough().parse(body);
    const tour = state.tours.find((t) => t.id === input.tourId && t.analysisId === a.id);
    if (!tour) throw new Error('Saved tour not found for this analysis.');
    if (params.action === 'capture-preview') {
      if ((await freshness(a)).stale)
        throw new Error('Refresh the sources before connecting a preview.');
      const p = z.object({ address: z.string().max(2000) }).parse(body);
      return json(await capturePreview(p.address, url.origin, a, tour));
    }
    if (params.action === 'progress') {
      const p = z
        .object({
          position: z
            .number()
            .int()
            .min(0)
            .max(tour.steps.length - 1),
          level: z.enum(levels),
        })
        .parse(body);
      await updateState((s) => {
        const t = s.tours.find((t) => t.id === tour.id)!;
        t.position = p.position;
        t.level = p.level;
      });
      return json({ ok: true });
    }
    if (params.action === 'preview') {
      if ((await freshness(a)).stale)
        throw new Error('Source selection changed. Refresh before preparing an external payload.');
      return json(modelPayload(a, tour));
    }
    if ((await freshness(a)).stale)
      throw new Error(
        'Source files changed. Refresh the repository before generating new explanations or narration.',
      );
    if (params.action === 'review') return json(reviewProject(a));
    if (params.action === 'explain') {
      const p = z
        .object({ provider: z.enum(['openai', 'ollama']), consent: z.boolean() })
        .parse(body);
      const next = await explain(a, tour, p.provider, p.consent);
      await updateState((s) => {
        const saved = s.tours.find((t) => t.id === next.id);
        if (saved) {
          next.position = saved.position;
          next.level = saved.level;
        }
        s.tours = s.tours.map((t) => (t.id === next.id ? next : t));
      });
      return json(next);
    }
    if (params.action === 'speech') {
      const p = z
        .object({ stepId: z.string(), level: z.enum(levels), consent: z.boolean() })
        .parse(body);
      const step = tour.steps.find((s) => s.id === p.stepId);
      if (!step) throw new Error('Step not found.');
      return new Response(new Uint8Array(await speech(step.explanations[p.level], p.consent)), {
        headers: { 'Content-Type': 'audio/mpeg' },
      });
    }
    return json({ error: 'Unknown operation' }, { status: 404 });
  } catch (e) {
    const message =
      e instanceof z.ZodError
        ? 'Invalid request or provider output.'
        : e instanceof Error
          ? e.message
          : 'Operation failed.';
    return json(
      {
        error: message.includes('fetch failed')
          ? 'Provider unavailable. Check server configuration; no fallback was used.'
          : message,
      },
      { status: 400 },
    );
  }
}
