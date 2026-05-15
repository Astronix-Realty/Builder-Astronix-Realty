export interface HealthScore {
  score: number;
  seoScore: number;
  readabilityScore: number;
  mediaScore: number;
  issues: string[];
  recommendations: string[];
}

export function calculateBlogHealthScore(blogData: any): HealthScore {
  let score = 100;
  let seoScore = 100;
  let readabilityScore = 100;
  let mediaScore = 100;
  const issues: string[] = [];
  const recommendations: string[] = [];

  // 1. SEO Checks (Title & Description)
  const seo = blogData.seo || {};
  if (!seo.metaTitle || seo.metaTitle.length < 30 || seo.metaTitle.length > 60) {
    seoScore -= 20;
    score -= 10;
    issues.push("SEO Meta Title should be between 30 and 60 characters.");
  }
  if (!seo.metaDescription || seo.metaDescription.length < 100 || seo.metaDescription.length > 160) {
    seoScore -= 20;
    score -= 10;
    issues.push("SEO Meta Description should be between 100 and 160 characters.");
  }
  if (!seo.keywords || seo.keywords.length < 2) {
    seoScore -= 10;
    score -= 5;
    recommendations.push("Add at least 2-5 SEO keywords.");
  }

  // 2. Media Checks (Cover Image & Block Images)
  if (!blogData.coverImage || !blogData.coverImage.url) {
    mediaScore -= 30;
    score -= 15;
    issues.push("A cover image is required for publishing.");
  }
  
  // 3. Content Structure (Readability & CTA)
  const blocks = blogData.blocks || [];
  if (blocks.length === 0) {
    readabilityScore -= 50;
    score -= 30;
    issues.push("Blog content is empty. Add some blocks.");
  } else {
    // Check for CTA
    const hasCta = blocks.some((b: any) => b.type === 'cta');
    if (!hasCta) {
      readabilityScore -= 10;
      score -= 5;
      recommendations.push("Consider adding a Call to Action (CTA) block to improve conversion.");
    }

    // Check Text Word Count
    const textBlocks = blocks.filter((b: any) => b.type === 'text');
    let totalWords = 0;
    textBlocks.forEach((tb: any) => {
      const content = tb.data?.content || '';
      totalWords += content.split(/\s+/).filter((word: string) => word.length > 0).length;
    });

    if (totalWords < 300) {
      readabilityScore -= 20;
      score -= 10;
      issues.push(`Content is too thin (${totalWords} words). Aim for at least 300 words for SEO.`);
    }
  }

  // Normalize scores
  score = Math.max(0, Math.min(100, score));
  seoScore = Math.max(0, Math.min(100, seoScore));
  readabilityScore = Math.max(0, Math.min(100, readabilityScore));
  mediaScore = Math.max(0, Math.min(100, mediaScore));

  return {
    score,
    seoScore,
    readabilityScore,
    mediaScore,
    issues,
    recommendations
  };
}
