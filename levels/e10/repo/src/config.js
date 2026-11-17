// Loaded from environment variables in prod, so values can be strings.
module.exports = {
  'new-checkout': { enabled: 'false', rollout: 100 },
  'dark-mode': { enabled: 'true', rollout: 50 },
  'beta-search': { enabled: true, rollout: 0 },
  'everyone': { enabled: true, rollout: 100 },
};
