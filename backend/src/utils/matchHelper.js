/**
 * Parse a human-readable experience string like "2-4 years" into a numeric value.
 */
function parseUserExperience(expStr) {
  if (!expStr) return 0;
  const str = String(expStr).toLowerCase();
  // Range: "2-4 years" → take lower bound
  const range = str.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) return parseInt(range[1], 10);
  // Single: "3 years" or "3+"
  const single = str.match(/(\d+)/);
  if (single) return parseInt(single[1], 10);
  return 0;
}

/**
 * Check if a job title matches the user's target role.
 * Case-insensitive partial-word match.
 */
function checkRoleMatch(jobTitle, targetRole) {
  if (!jobTitle || !targetRole) return false;
  const j = jobTitle.toLowerCase();
  const r = targetRole.toLowerCase();
  // Exact contains
  if (j.includes(r) || r.includes(j)) return true;
  // Word-level: every word in targetRole must appear in jobTitle
  const roleWords = r.split(/\s+/).filter(w => w.length > 2);
  return roleWords.every(w => j.includes(w));
}

/**
 * Check if job experience requirement is within user's reach.
 * For freshers (0 experience): prioritize "Entry Level," "Junior," "0-1 years exp."
 * Do not show "Senior" roles to users with 0 experience.
 * Rule: job_exp <= user_exp + 1, but with fresher-specific logic
 */
function checkExperienceMatch(jobRequiredExp, userExpStr, jobTitle = '', jobDescription = '') {
  const userExp = parseUserExperience(userExpStr);
  
  // Special handling for freshers (0 years experience)
  if (userExp === 0) {
    const jobText = (jobTitle + ' ' + jobDescription).toLowerCase();
    // Prioritize entry-level keywords
    const entryLevelKeywords = ['entry level', 'entry-level', 'junior', '0-1 years', '0-2 years', 'fresher', 'graduate', 'beginner'];
    const hasEntryLevel = entryLevelKeywords.some(keyword => jobText.includes(keyword));
    
    // Exclude senior roles
    const seniorKeywords = ['senior', 'lead', 'principal', 'manager', 'director', 'architect', 'expert'];
    const isSenior = seniorKeywords.some(keyword => jobText.includes(keyword));
    
    if (isSenior) return false; // Don't show senior roles to freshers
    if (hasEntryLevel) return true; // Prioritize entry-level jobs
    return jobRequiredExp == null || jobRequiredExp <= 1; // Allow jobs with no requirement or 1 year max
  }
  
  // For experienced users: job_exp <= user_exp + 1
  if (jobRequiredExp == null) return true;
  return jobRequiredExp <= userExp + 1;
}

/**
 * Find which of the user's skills appear in the job description/skills array.
 */
function computeSkillMatches(job, userSkills) {
  if (!userSkills || userSkills.length === 0) {
    return { matchedSkills: [], unmatchedSkills: [] };
  }

  const haystack = [
    job.description || '',
    (job.skills || []).join(' '),
    job.title || '',
  ].join(' ').toLowerCase();

  const matchedSkills = [];
  const unmatchedSkills = [];

  for (const skill of userSkills) {
    if (!skill) continue;
    if (haystack.includes(skill.toLowerCase())) {
      matchedSkills.push(skill);
    } else {
      unmatchedSkills.push(skill);
    }
  }

  return { matchedSkills, unmatchedSkills };
}

/**
 * Build "Why this job fits you" reasons array.
 */
function buildWhyItFits(roleMatch, experienceMatch, matchedSkills, job) {
  const reasons = [];
  if (roleMatch) reasons.push('✔ Matches your target role');
  if (experienceMatch) reasons.push(`✔ Suitable for your experience level${job.requiredExperience ? ` (requires ${job.requiredExperience}+ years)` : ''}`);
  if (matchedSkills.length > 0) {
    reasons.push(`✔ Your ${matchedSkills.slice(0, 3).join(', ')} skills align with this role`);
  }
  if (!roleMatch)        reasons.push('✖ Title differs from your target role');
  if (!experienceMatch)  reasons.push(`✖ Requires more experience than you have${job.requiredExperience ? ` (${job.requiredExperience} yrs)` : ''}`);
  return reasons;
}

/**
 * Build full matchMetadata for a job given a user profile.
 */
function buildMatchMetadata(job, profile) {
  const { targetRole, experience, skills } = profile;
  const roleMatch = checkRoleMatch(job.title, targetRole);
  const experienceMatch = checkExperienceMatch(job.requiredExperience, experience, job.title, job.description);
  const { matchedSkills, unmatchedSkills } = computeSkillMatches(job, skills);
  const whyJobFitsYou = buildWhyItFits(roleMatch, experienceMatch, matchedSkills, job);

  return {
    roleMatch,
    experienceMatch,
    matchedSkills,
    unmatchedSkills,
    requiredExperience: job.requiredExperience ?? null,
    userExperienceLevel: parseUserExperience(experience),
    whyJobFitsYou,
  };
}

module.exports = {
  parseUserExperience,
  checkRoleMatch,
  checkExperienceMatch,
  computeSkillMatches,
  buildMatchMetadata,
};
