/**
 * Next.js Instrumentation hook — runs once when the server process starts.
 * We use this to register the autonomous scrape+analyze pipeline scheduler.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only run in the Node.js runtime (not Edge), and only when the pipeline is enabled
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.DISABLE_AUTO_PIPELINE === 'true') return;

  // Lazy-import so the scheduler is only bundled server-side
  const { schedulePipeline } = await import('@/lib/pipeline');
  schedulePipeline();
}
