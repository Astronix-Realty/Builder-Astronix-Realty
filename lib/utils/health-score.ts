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

  // 1. Content Structure (Readability & Titles) - Max 40 points
  if (blogData.title && blogData.title.length >= 5) {
    score += 10;
    readabilityScore += 25;
  } else {
    issues.push("A descriptive title (at least 5 characters) is missing.");
  }

  const blocks = blogData.blocks || [];
  if (blocks.length === 0) {
    issues.push("Blog content is empty. Add some blocks.");
  } else {
    // Word Count (Max 20 points)
    const textBlocks = blocks.filter((b: any) => b.type === 'text');
    let totalWords = 0;
    textBlocks.forEach((tb: any) => {
      const content = tb.data?.content || '';
      totalWords += content.split(/\s+/).filter((word: string) => word.length > 0).length;
    });

    if (totalWords >= 300) {
      score += 20;
      readabilityScore += 50;
    } else if (totalWords > 0) {
      score += 10;
      readabilityScore += 25;
      recommendations.push(`Content is thin (${totalWords} words). Aim for 300+ words.`);
    }

    // CTA (Max 10 points)
    const hasCta = blocks.some((b: any) => b.type === 'cta');
    if (hasCta) {
      score += 10;
      readabilityScore += 25;
    } else {
      recommendations.push("Consider adding a Call to Action (CTA) block.");
    }
    
    // Subtitle check (Often in hero block)
    const heroBlock = blocks.find((b: any) => b.type === 'hero');
    if (heroBlock && heroBlock.data?.subtitle) {
      score += 10;
    }
  }

  // 2. SEO Checks (Metadata) - Max 25 points
  const seo = blogData.seo || {};
  if (seo.metaTitle && seo.metaTitle.length >= 30 && seo.metaTitle.length <= 60) {
    score += 10;
    seoScore += 40;
  } else {
    issues.push("SEO Meta Title should be 30-60 characters.");
  }

  if (seo.metaDescription && seo.metaDescription.length >= 100 && seo.metaDescription.length <= 160) {
    score += 10;
    seoScore += 40;
  } else {
    issues.push("SEO Meta Description should be 100-160 characters.");
  }

  if (seo.keywords && seo.keywords.length >= 2) {
    score += 5;
    seoScore += 20;
  } else {
    recommendations.push("Add at least 2-5 SEO keywords.");
  }

  // 3. Media Checks (Hero Image / Cover Image) - Max 15 points
  const hasCoverImage = blogData.coverImage?.url;
  const hasHeroImage = blocks.some((b: any) => b.type === 'hero' && (b.data?.portraitImage || b.data?.coverImage));
  
  if (hasCoverImage || hasHeroImage) {
    score += 15;
    mediaScore += 100;
  } else {
    issues.push("A hero or cover image is required for better engagement.");
  }

  // Normalize scores (cap at 100)
  score = Math.min(100, score);
  seoScore = Math.min(100, seoScore);
  readabilityScore = Math.min(100, readabilityScore);
  mediaScore = Math.min(100, mediaScore);

  return {
    score,
    seoScore,
    readabilityScore,
    mediaScore,
    issues,
    recommendations
  };
}
