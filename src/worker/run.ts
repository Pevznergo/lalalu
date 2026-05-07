import { processNextQueuedJob } from "./process-job";

async function main() {
  const processed = await processNextQueuedJob();
  if (!processed) {
    console.log("No queued generation jobs.");
    return;
  }
  console.log(`Processed generation job ${processed.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
