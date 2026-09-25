/**
 * Length guidance for SEO descriptions (posts and categories).
 *
 * `RECOMMENDED` is advice, not a rule: roughly where Google's desktop snippet
 * is cut off with "…". Google has no character limit — it truncates by pixel
 * width and often writes its own snippet — so the editor WARNS past it and
 * still saves.
 *
 * `MAX` is the backend's hard cap (eb-auth `SEO_DESCRIPTION_MAX`, a
 * `VarChar(500)` column). The fields stop input there, so an author can never
 * type something the save would refuse. Keep in step with eb-auth.
 */
export const SEO_DESCRIPTION_RECOMMENDED = 160;
export const SEO_DESCRIPTION_MAX = 500;
