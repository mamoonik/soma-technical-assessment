export async function fetchPexelsImageUrl(query: string): Promise<string | null> {
    const apiKey = process.env.PEXELS_API_KEY;
    console.log("PEXELS key present?", !!apiKey); 
    if (!apiKey) return null;
  
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`;
    console.log("Pexels URL:", url); 
  
    const res = await fetch(url, { headers: { Authorization: apiKey } });
  
    console.log("Pexels status:", res.status); 
  
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.log("Pexels error body:", txt); 
      return null;
    }
  
    const data = await res.json();
    const photo = data?.photos?.[0];
    return photo?.src?.medium ?? photo?.src?.small ?? null;
  }