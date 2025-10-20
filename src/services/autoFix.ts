import { refreshLiveNews } from './liveNewsService';

export interface FixProgress {
  stage: string;
  message: string;
  success?: boolean;
}

export async function autoFixDatabase(
  onProgress: (progress: FixProgress) => void
): Promise<boolean> {
  try {
    onProgress({
      stage: 'english',
      message: 'Fetching English news from RSS feeds...',
    });

    await refreshLiveNews('en', 'world');

    onProgress({
      stage: 'english',
      message: 'Successfully fetched English world news!',
      success: true,
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    onProgress({
      stage: 'arabic',
      message: 'Fetching Arabic news from RSS feeds...',
    });

    await refreshLiveNews('ar', 'world');

    onProgress({
      stage: 'arabic',
      message: 'Successfully fetched Arabic world news!',
      success: true,
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    onProgress({
      stage: 'complete',
      message: 'Database populated successfully! Refresh the page to see news.',
      success: true,
    });

    return true;
  } catch (error) {
    console.error('Auto-fix failed:', error);
    onProgress({
      stage: 'error',
      message: `Failed: ${error instanceof Error ? error.message : String(error)}`,
      success: false,
    });
    return false;
  }
}
