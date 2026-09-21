export interface HealthScore {
  score: number;
  seoScore: number;
  readabilityScore: number;
  mediaScore: number;
  issues: string[];
  recommendations: string[];
}

export function calculateBlogHealthScore(blogData: any): HealthScore {
  let score = 0;
  let seoScore = 0;
  let readabilityScore = 0;
  let mediaScore = 0;
  const issues: string[] = [];
  const recommendations: string[] = [];

  // ── 1. Title (10 pts) ────────────────────────────────────
  const hasRealTitle =
    blogData.title &&
    blogData.title.trim().length >= 5 &&
    blogData.title.trim() !== 'Untitled Blog';

  if (hasRealTitle) {
    score += 10;
    readabilityScore += 25;
  } else {
    issues.push('A descriptive title (at least 5 characters) is missing.');
  }

  // ── 2. Content blocks ────────────────────────────────────
  const blocks: any[] = blogData.blocks || [];

  if (blocks.length === 0) {
    issues.push('Blog content is empty. Add some blocks.');
  } else {
    // Word count (max 20 pts)
    const textBlocks = blocks.filter(b => b.type === 'text');
    let totalWords = 0;
    textBlocks.forEach(tb => {
      const content = tb.data?.content || '';
      totalWords += content.split(/\s+/).filter((w: string) => w.length > 0).length;
    });

    if (totalWords >= 300) {
      score += 20;
      readabilityScore += 50;
    } else if (totalWords >= 100) {
      score += 10;
      readabilityScore += 25;
      recommendations.push(`Content is thin (${totalWords} words). Aim for 300+ for better SEO.`);
    } else if (totalWords > 0) {
      score += 5;
      readabilityScore += 10;
      recommendations.push(`Content too short (${totalWords} words). Need at least 100 to publish.`);
    }

    // CTA (10 pts)
    const hasCta = blocks.some(b => b.type === 'cta');
    if (hasCta) {
      score += 10;
      readabilityScore += 25;
    }
    // Subtitle in hero (5 pts)
    const heroBlock = blocks.find(b => b.type === 'hero');
    if (heroBlock?.data?.subtitle?.trim()) {
      score += 5;
    } else if (heroBlock) {
      recommendations.push('Add a subtitle to your Hero Section for better readability.');
    }
  }

  // ── 3. SEO metadata (max 25 pts) ─────────────────────────
  const seo = blogData.seo || {};

  if (seo.metaTitle && seo.metaTitle.length >= 30 && seo.metaTitle.length <= 60) {
    score += 10;
    seoScore += 40;
  } else {
    issues.push('SEO Meta Title should be 30–60 characters.');
  }

  if (seo.metaDescription && seo.metaDescription.length >= 100 && seo.metaDescription.length <= 160) {
    score += 10;
    seoScore += 40;
  } else {
    issues.push('SEO Meta Description should be 100–160 characters.');
  }

  if (seo.keywords && seo.keywords.length >= 2) {
    score += 5;
    seoScore += 20;
  } else {
    recommendations.push('Add at least 2–5 SEO keywords.');
  }

  // ── 4. Media (max 15 pts) ─────────────────────────────────
  // Check correct field names used by HeroBlock
  const hasCoverImage = blogData.coverImage?.url;
  const hasHeroImage = blocks.some(
    b => b.type === 'hero' && (b.data?.imageUrl || b.data?.heroImageUrl)
  );

  if (hasCoverImage || hasHeroImage) {
    score += 15;
    mediaScore += 100;
  } else {
    issues.push('A hero or cover image is required for better engagement.');
  }

  // ── Normalize ────────────────────────────────────────────
  score            = Math.min(100, Math.max(0, score));
  seoScore         = Math.min(100, Math.max(0, seoScore));
  readabilityScore = Math.min(100, Math.max(0, readabilityScore));
  mediaScore       = Math.min(100, Math.max(0, mediaScore));

  return { score, seoScore, readabilityScore, mediaScore, issues, recommendations };
}
