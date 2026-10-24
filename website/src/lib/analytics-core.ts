/** Website-only measurement contract. Never pass editable content to these helpers. */
export const WEBSITE_EVENTS = new Set([
  '$pageview', '$pageleave', 'site_window_opened', 'site_window_focused',
  'site_window_state_changed', 'site_tab_changed', 'site_view_changed',
  'site_gallery_filter_changed', 'site_gallery_search', 'template_selected',
  'demo_started', 'demo_first_manual_edit', 'demo_history_action', 'demo_failed',
  'cta_clicked', 'pricing_viewed', 'faq_opened', 'installer_download_clicked',
  'installer_lookup_failed', 'playground_download_initiated', 'recipe_import_completed',
  'agent_setup_copied', 'outbound_clicked', 'contact_submit_attempted',
]);
export const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'content_id'] as const;
const SAFE_PROPERTIES = new Set([
  'window_id','from_window_id','action','placement','tab_id','from_tab_id','example_id',
  'category','result_count','query_length_bucket','control_type','edit_receipt','format',
  'kind','agent_id','destination','plan','platform','release_version','error_category',
  'presentation_mode','interaction_origin','is_embedded','ict_stage','selection_source',
  'surface','product','environment','schema_version','release','page_route','is_qa','qa_run',
  'first_source','first_medium','first_campaign','last_source','last_medium','last_campaign',
  ...CAMPAIGN_KEYS,
]);
const SDK_PROPERTIES = new Set([
  'token','distinct_id','$device_id','$session_id','$window_id','$insert_id','$lib','$lib_version',
  '$process_person_profile','$is_identified','$browser','$browser_version','$os','$os_version',
  '$device_type','$screen_height','$screen_width','$viewport_height','$viewport_width',
  '$host','$pathname','$current_url','$referrer','$referring_domain','$time',
]);
export function safeTag(value: unknown): string | undefined {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9._ -]{0,95}$/i.test(value) ? value : undefined;
}
export function routeOf(pathname: string, routes: readonly string[]): string {
  const path = pathname.endsWith('/') ? pathname : pathname + '/';
  return routes.includes(path) ? path : '/other/';
}
export function campaignOf(search: string): Record<string,string> {
  const query = new URLSearchParams(search), result: Record<string,string> = {};
  for (const key of CAMPAIGN_KEYS) { const value = safeTag(query.get(key)); if (value) result[key] = value; }
  return result;
}
export function externalReferrer(referrer: string): string | undefined {
  try { const url = new URL(referrer); if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
    if (url.hostname === 'stitchable.ai' || url.hostname.endsWith('.stitchable.ai')) return;
    return url.origin;
  } catch { return; }
}
export function cleanProperties(input: Record<string,unknown>): Record<string,string|number|boolean> {
  const clean: Record<string,string|number|boolean> = {};
  for (const [key,value] of Object.entries(input)) {
    if (!SAFE_PROPERTIES.has(key)) continue;
    if (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) clean[key] = value;
    else if ((key === 'page_route' || key === 'destination') && typeof value === 'string' && /^\/[a-z0-9/-]*\/$|^\/$/.test(value)) clean[key] = value;
    else if(key==='example_id'&&typeof value==='string'&&/^stitchable\/[a-z0-9-]{1,96}$/.test(value))clean[key]=value;
    else { const tag = safeTag(value); if (tag) clean[key] = tag; }
  }
  return clean;
}
export function cleanPayload<T extends {event:string;properties?:Record<string,unknown>}>(payload:T, origin:string, route:string, referrer?:string):T|null {
  if (!WEBSITE_EVENTS.has(payload.event)) return null;
  const input = payload.properties ?? {}, properties: Record<string,unknown> = cleanProperties(input);
  for (const key of SDK_PROPERTIES) if (input[key] !== undefined) properties[key] = input[key];
  // The SDK must never leak raw URL queries, page titles, autocapture text or edit values.
  properties.$current_url = origin + route; properties.$pathname = route;
  properties.$host = new URL(origin).host;
  properties.$referrer = referrer ?? '$direct';
  properties.$referring_domain = referrer ? new URL(referrer).hostname : '$direct';
  properties.$process_person_profile = false;
  // Drop top-level person updates too: SDK-generated $set_once can contain the raw entry URL.
  const safe:Record<string,unknown>={event:payload.event,properties};
  for(const key of ['timestamp','uuid'])if((payload as Record<string,unknown>)[key]!==undefined)safe[key]=(payload as Record<string,unknown>)[key];
  return safe as T;
}
export function searchBucket(length:number):string { return length === 0 ? 'empty' : length < 10 ? '1-9' : length < 30 ? '10-29' : '30-plus'; }

/** The shared website choice is authoritative across project-specific SDK cookies. */
export function ensureSdkCapture(sdk:{has_opted_out_capturing:()=>boolean;opt_in_capturing:(options:{captureEventName:false})=>void},allowed:boolean):boolean {
  if(!allowed)return false;
  if(sdk.has_opted_out_capturing())sdk.opt_in_capturing({captureEventName:false});
  return true;
}
