const axios = require('axios');
const logger = require('./logger');

/**
 * Fetch jobs from RapidAPI JSearch.
 * @param {string} query   e.g. "Frontend Developer" or "React TypeScript"
 * @param {number} page    1-based page number
 * @param {number} limit   results per page (max 20)
 * @returns {Array} raw job objects
 */
async function fetchJobsFromJSearch(query, page = 1, limit = 20) {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    logger.warn('No RAPIDAPI_KEY set – skipping JSearch');
    return [];
  }

  const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
    params: { query, page, num_pages: 1, date_posted: 'all' },
    headers: {
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': process.env.RAPIDAPI_HOST || 'jsearch.p.rapidapi.com',
    },
    timeout: 15000,
  });

  const raw = response.data?.data || [];
  logger.info(`JSearch returned ${raw.length} results for "${query}"`);
  return raw.slice(0, limit).map(normalizeJob);
}

/** Map raw JSearch fields to our internal schema */
function normalizeJob(j) {
  const salary = buildSalaryString(j);
  return {
    jobId:              j.job_id || `jsearch-${Date.now()}-${Math.random()}`,
    title:              j.job_title || 'Unknown Role',
    company:            j.employer_name || 'Unknown Company',
    location:           [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ') || null,
    salary,
    description:        j.job_description || '',
    requiredExperience: parseExperience(j.job_required_experience?.required_experience_in_months),
    skills:             j.job_required_skills || [],
    jobType:            j.job_employment_type || null,
    workMode:           j.job_is_remote ? 'Remote' : null,
    url:                j.job_apply_link || j.job_google_link || null,
    postedDate:         j.job_posted_at_datetime_utc ? new Date(j.job_posted_at_datetime_utc) : null,
    source:             'jsearch',
    fetchedAt:          new Date(),
  };
}

function parseExperience(months) {
  if (!months) return null;
  return Math.round(months / 12);
}

function buildSalaryString(j) {
  const min = j.job_min_salary;
  const max = j.job_max_salary;
  const period = j.job_salary_period;
  if (!min && !max) return null;
  const fmt = (n) => n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;
  if (min && max) return `${fmt(min)}–${fmt(max)}${period ? `/${period.toLowerCase()}` : ''}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

module.exports = { fetchJobsFromJSearch };
