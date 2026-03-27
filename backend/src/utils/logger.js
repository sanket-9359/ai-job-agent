const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

const fmt = (level, ...args) => {
  const ts = new Date().toISOString();
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
    `[${ts}] [${level.toUpperCase()}]`, ...args
  );
};

const logger = {
  error: (...a) => currentLevel >= 0 && fmt('error', ...a),
  warn:  (...a) => currentLevel >= 1 && fmt('warn',  ...a),
  info:  (...a) => currentLevel >= 2 && fmt('info',  ...a),
  debug: (...a) => currentLevel >= 3 && fmt('debug', ...a),
};

module.exports = logger;
