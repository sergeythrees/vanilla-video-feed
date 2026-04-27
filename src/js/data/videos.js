/**
 * @returns {Promise<Array<{id: string, src: string, title: string, author: string, poster: string}>>}
 */
export async function loadVideosFromDrive() {
  const response = await fetch('/api/videos');
  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.videos)) {
    return [];
  }
  return data.videos;
}
