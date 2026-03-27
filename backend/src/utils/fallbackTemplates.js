/**
 * Build a realistic template email when the AI service is unavailable.
 * Uses real job + profile data so it doesn't look generic.
 */
function buildFallbackEmail(job, profile) {
  const { targetRole, skills = [], experience } = profile;
  const topSkills = skills.slice(0, 3).join(', ');
  const role = job.title || targetRole || 'the position';
  const company = job.company || 'your company';

  // Handle experience messaging
  let experienceText;
  if (experience == 0) {
    experienceText = "I am a motivated fresher looking for an entry-level opportunity.";
  } else {
    experienceText = `I have ${experience} years of experience in the industry.`;
  }

  const subject = `Application for ${role} – ${topSkills || 'Experienced Developer'}`;

  const body = `Dear ${company} Hiring Team,

I came across your ${role} opening and was immediately drawn to the work ${company} is doing. Your focus on building impactful products aligns closely with what I'm looking for in my next role.

${experienceText}${topSkills ? ` With hands-on experience in ${topSkills}, I've developed a strong foundation in delivering high-quality software.` : ''} ${skills.length > 0 ? `My background in ${skills[0]} has given me the practical skills your team is looking for.` : ''}

I'd love the opportunity to contribute to ${company}'s mission and discuss how my experience can add value to your team.

Thank you for your time and consideration.

Best regards,
[Your Name]`;

  return { subject, body, email: `Subject: ${subject}\n\n${body}` };
}

/**
 * Build a fallback resume analysis when the AI service is unavailable.
 */
function buildFallbackAnalysis(job, profile) {
  const { skills = [] } = profile;
  const topSkills = skills.slice(0, 3);
  const jobSkills = job.skills || [];

  const matchedJobSkills = jobSkills.filter(js =>
    skills.some(us => us.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(us.toLowerCase()))
  );
  const missingJobSkills = jobSkills.filter(js =>
    !skills.some(us => us.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(us.toLowerCase()))
  );

  const strongPoints = [
    topSkills.length > 0 ? `Experience with ${topSkills.join(', ')}` : 'Demonstrated technical skills',
    matchedJobSkills.length > 0 ? `Relevant skills: ${matchedJobSkills.slice(0, 3).join(', ')}` : 'Background aligns with role requirements',
    'Professional experience in software development',
  ].filter(Boolean);

  const weakPoints = [
    missingJobSkills.length > 0 ? `Missing required skills: ${missingJobSkills.slice(0, 3).join(', ')}` : 'Some specific technologies not mentioned',
    'Additional domain-specific examples could strengthen the application',
  ].filter(Boolean);

  const suggestions = [
    missingJobSkills.length > 0 ? `Learn or get certified in ${missingJobSkills[0]}` : 'Highlight more project outcomes with metrics',
    `Tailor your resume to emphasize ${job.title || 'this role'} specific experience`,
    'Add measurable achievements (e.g. "reduced load time by 40%")',
  ];

  const rawText = [
    'STRONG POINTS:\n' + strongPoints.map(p => `• ${p}`).join('\n'),
    'WEAK POINTS:\n' + weakPoints.map(p => `• ${p}`).join('\n'),
    'SUGGESTIONS:\n' + suggestions.map(p => `• ${p}`).join('\n'),
  ].join('\n\n');

  return { strongPoints, weakPoints, suggestions, rawText };
}

module.exports = { buildFallbackEmail, buildFallbackAnalysis };
