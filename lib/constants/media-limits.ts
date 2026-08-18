/**
 * Cloudinary's own account-wide image ceilings — must match
 * app/media.py's IMAGE_MAX_BYTES / IMAGE_MAX_MEGAPIXELS exactly.
 * IMAGE_MAX_MB is shown upfront in every image picker so a merchant knows
 * the limit before hitting it. The megapixel cap is still enforced by the
 * backend (see app/api/media.py) — it's just not surfaced in this hint
 * text, since "megapixels" isn't a number merchants think in day to day;
 * the error message still explains it in plain terms if someone hits it.
 */
export const IMAGE_MAX_MB = 10;
export const IMAGE_MAX_MEGAPIXELS = 25;

export const IMAGE_LIMITS_HINT = `JPEG, PNG, WebP, or AVIF · up to ${IMAGE_MAX_MB}MB`;
