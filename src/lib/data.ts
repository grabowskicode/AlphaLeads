import { Lead } from "./types";

export function classifyLead(lead: Lead) {
  const oneStar = lead.reviews_per_score_1 || 0;
  const rating = lead.rating || 0;
  const reviews = lead.review_count || 0;

  // 1. FRESH OPPORTUNITIES (Focus: Needs Website)
  // Logic: No website, or unverified Google Profile.
  if (!lead.website || lead.is_verified === false) {
    return {
      type: "fresh",
      label: !lead.website ? "Needs Website" : "Unclaimed Profile",
      color: "text-blue-400",
      pitch: !lead.website
        ? "Pitch: Custom Website Development"
        : "Pitch: GMB Verification Service",
    };
  }

  // 2. PAIN HUNTER (Focus: Bad Reviews)
  // Logic: Low rating (<4.5), Low volume (<50), or Has 1-star reviews.
  if (rating < 4.5 || reviews < 50 || oneStar > 0) {
    let label = "Growth Opportunity";
    if (rating < 4.5) label = "Reputation Repair";
    if (oneStar > 0) label = "Toxic Review Removal";

    return {
      type: "pain",
      label: label,
      color: "text-red-400",
      pitch:
        oneStar > 0
          ? `Critical: Has ${oneStar} bad reviews.`
          : `Fragile: Only ${reviews} reviews. Needs padding.`,
    };
  }

  // 3. UNCATEGORIZED (Good businesses)
  return {
    type: "other",
    label: "Qualified Lead",
    color: "text-green-400",
    pitch: "Standard Outreach",
  };
}
