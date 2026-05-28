export const BANNER_EFFECT    = 'summoner-howl-banner';
export const WEB_EFFECT       = 'summoner-web';
export const CORROSION_EFFECT = 'summoner-corrosion';
export const WET_EFFECT       = 'summoner-wet';

export const TRAMPLE_BOON_EFFECT   = 'summoner-trample-boon';
export const DEBUFF_IMMUNE_EFFECT  = 'summoner-debuff-immune';
export const SENTINEL_EFFECT       = 'summoner-sentinel-aegis';

export const GRAZING_COOLDOWN_KEY    = 'grazing-heal';
export const VITAL_BURST_COUNTER_KEY = 'vital-burst-used';

/** Banner / trample boon are re-projected every tick; short TTL avoids flicker. */
export const BANNER_REFRESH_MS  = 1500;
export const TRAMPLE_REFRESH_MS = 1500;
export const SENTINEL_REFRESH_MS = 1500;
