// Path: lib/fetcher.ts

/**
 * Reusable fetcher function for SWR (Stale-While-Revalidate).
 * @param url The API endpoint URL to fetch.
 * @returns A Promise resolving to the fetched data (specifically the 'images' array).
 */
export const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error('Failed to fetch carousel images');
    throw error;
  }
  
  const data = await res.json();
  return data.images as string[];
};