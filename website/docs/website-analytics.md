# Website analytics and ICT measurement

The production website sends explicit events to [PostHog project 684594](https://us.posthog.com/project/684594/web). Surface: `editableframes_site`. The public write-only SDK configuration is in `src/lib/analytics-config.ts`; it cannot read reports or stored data. No personal API key is bundled. Localhost capture stays disabled unless `PUBLIC_POSTHOG_DEV_KEY` is explicitly supplied.

Website styles and layout are retained. The footer links to `/privacy/`, where visitors can change the shared browser preference. Collection starts on by default, honors Global Privacy Control and Do Not Track, and preserves explicit Off choices. Account billing preferences are separate.

## Event contract

- `$pageview`: initial top-level visit or real route navigation. Window focus and close-to-Home fallback do not create visits. Actual reloads may create another pageview. Embedded pages send interactions, not a second top-level acquisition.
- Window open, focus, minimize/restore/close and presentation changes are diagnostic events. Real internal tab changes include their stable prior and next IDs. Illustrative tabs and mock operations do not emit success.
- `template_selected`, gallery categories and settled search: stable catalog IDs, result counts and query-length buckets; no search strings.
- `demo_started`: explicit playback or labeled guided walkthrough. `demo_first_manual_edit` requires an applied user change. Autoplay and walkthrough-generated changes do not qualify. No edit values or prompt contents are exported.
- `cta_clicked`, pricing/FAQ and outbound events: bounded destination categories, placement and plan intent. A CTA is not a purchase, meeting, installation or delivered contact message.
- Installer clicks and lookup failures are separate. EditableFrames frame/recipe download initiation, validated recipe imports and successful setup/prompt copying have dedicated events. Browser download initiation cannot prove a successful disk save.

The SDK provides browser/session identity. A strict `before_send` boundary removes unapproved properties, raw URLs/queries/fragments, titles, person updates and form/edit contents. Browser delivery uses the documented PostHog capture API with a maximum of 64 active jobs and three attempts per event. Every retry rechecks the shared preference revision, so Off and later regrant cannot resurrect earlier queued work. Already-started network requests cannot be recalled. No offline persistent event buffer, autocapture, replay, surveys or feature-flag requests are enabled.

## Test and inspect

1. Open a fresh browser tab with `?utm_source=blog&utm_medium=referral&utm_campaign=website-qa&qa_run=webqa-YYYYMMDD-run1` appended to a relevant public route.
2. Open another window or scene, make a real edit, use a working tab and click a relevant CTA. In PostHog, open **Activity**, select **Events**, and filter `qa_run` to the same run ID. Inspect `$insert_id`, `page_route`, `surface`, `is_embedded`, original source, and event-specific IDs.
3. Use **Web analytics** for incoming visitors, pageviews, sources and landing pages. Use **Product analytics** for the explicit window, example, edit and CTA events. Exclude `is_qa=true` from business reports; include it only for verification.
4. Open `/privacy/`, choose Off, then visit a new tagged route. There should be no new optional capture. The preference applies to both owned website hosts. Restore the desired setting afterward.
5. For an iframe test, open the main website's EditableFrames window. The parent owns its pageview; embedded interactions have `is_embedded=true`. Direct EditableFrames visits have `is_embedded=false`.

QA runs have bounded, in-memory Performance marks named `stitchable-analytics-captured` and `stitchable-analytics-delivery`. These expose only sanitized metadata and event IDs, never credentials or editable contents. A delivery response is transport evidence; confirm the matching ID in PostHog to prove receipt. The QA browser label expires after 30 minutes. Close the QA tabs afterward so tests do not become business traffic.

## Scope and limits

The two websites use separate production projects by owner choice. Their native dashboards do not form a single person-level cross-project funnel. Original source attribution is preserved across internal movement, and links into the platform carry only bounded campaign tags and selected-plan intent. No visitor identity or authorization token is added to links.

Production platform signup, payment, desktop export, retention, spend and contribution metrics require their own release and identity linkage. These website events do not claim those outcomes. The existing Contact form remains a local demonstration and records an attempt only.

## Validation

`npm run test:analytics`, `npm run check`, and the site's build/SEO checks are required. The main site additionally validates its existing motion model and native-gallery provenance. Deployment and hosted verification evidence belongs in the release record; local passes alone do not establish received events.

## Production release — 2026-10-24

Website worker version: `40bc54fc-54eb-493f-af28-b5e134f62a60`. Project: **684594**. [Website ICT dashboard](https://us.posthog.com/project/684594/dashboard/2254403) · [Incoming traffic](https://us.posthog.com/project/684594/web) · [Stored events](https://us.posthog.com/project/684594/activity/events).

The owner authorized production website deployment and selected separate existing projects. No production platform, billing, desktop, framework or CLI release is part of this change. No private PostHog read key was created.

Live browser verification used `qa_run=webqa-20261024-ict-a`. Both projects displayed stored events whose `$insert_id` matched the actual browser edit; this establishes receipt beyond an ingestion HTTP response. Successful-copy tests excluded the test brief, and search tests exported a length bucket rather than the test string.

| Check | Result |
| --- | --- |
| Tagged visit, real navigation and pricing/scene selection | Received in the intended project; bounded original source retained |
| Manual edits | Real renderer acknowledgement on the main site; validated local command on EditableFrames; no autoplay edits counted |
| Window minimize/restore/close/focus | Separate diagnostics; focus and close fallback did not add pageviews |
| Publishing workflow and agent tabs | Only real state changes; repeating the same selection did not emit a second change |
| EditableFrames downloads/import | Actual recipe and PNG files downloaded, recipe reimported; download events still describe initiation |
| Installer CTA | Recorded macOS and release v0.4.1; no installation claimed |
| Shared Off and regrant | Off on the main site blocked all PostHog requests on the other host. A discovered project-cookie regrant defect was fixed in both SDK integrations and regression-tested |
| Mobile hydration | Corrected initial fallback labeling; final mobile page had no overflow or false desktop opening |
| Embedded site | Parent emitted one acquisition pageview; stored child scene-change receipt had `is_embedded=true` and `tab_id=device`; direct visits remain separate |

Saved business charts exclude `is_qa=true`; the explicitly named QA verification chart includes this test run. Business charts may correctly be empty immediately after deployment. Built-in Web analytics can include QA unless the same event-property filter is applied. These are anonymous browser counts, not authenticated accounts or unique humans.

Final checks: **17 analytics tests per website**, type/diagnostic checks, static builds and SEO checks passed. The main site also passed three existing motion-model tests and native-gallery provenance checks. Browser tests found and corrected cross-project regrant and hydration labeling; the API/transport tests cover bounded retries, withdrawal/regrant fencing and payload filtering.

### Exact owner verification steps

1. Open the **Website ICT dashboard** link above. Select the named **QA verification** chart to see test actions. The other charts intentionally exclude QA.
2. To inspect one action, open **Stored events**, click **Reload**, then expand a row with **Show more**. Find `qa_run=webqa-20261024-ict-a`, `surface`, `page_route`, `example_id` or `window_id`, and `$insert_id`.
3. To test your own traffic, open a fresh tab with `?utm_source=blog&utm_medium=referral&utm_campaign=my-test&qa_run=webqa-my-test` on a relevant page. Make an edit or change a working tab. In **Stored events**, add the event-property filter `qa_run = webqa-my-test` and reload. Use a new label per test.
4. For real traffic reports, open **Incoming traffic**, click **Filters** above the headline numbers and add the event property `is_qa = false`. Scroll to **Sources by**, open its dropdown and select **UTM source** (or UTM campaign). The adjacent **Pages by** dropdown supports landing pages and paths. A first or last campaign field is available for custom breakdowns; visits without a tag/referrer remain unknown/direct.
5. To turn website collection off, use the footer **Privacy & analytics** link and select **Turn analytics off**. Account product analytics settings are independent.

## Review corrections — 2026-10-25

Creative attribution now accompanies subsequent page/action events as `first_content`, `last_content`, `first_content_id`, `last_content_id`, `first_term`, and `last_term`. These are bounded tags from the saved first/latest touch; raw `utm_*` fields still describe the current tagged URL. Use `last_content` or `last_content_id` to compare downstream actions by campaign creative.

Tabs opened while analytics is Off can resume after the shared choice is enabled: focus, visibility, the first click, and explicit actions recheck initialization. Off, DNT and GPC still block collection. Regrant never replays old actions.

PNG download events keep the scene identity captured at export start. Changing scenes during preparation cancels the stale export; changing scenes after blob creation starts cannot relabel the saved image.

### Verified production correction release

Worker version: `7de86812-003b-47c4-b3c7-6bb8bc36c208`. Release label: `web-ict-20261025.1`. 23 analytics tests, Astro diagnostics, build/SEO and deployment dry run passed. Exact public analytics/interaction bundle SHA-256 values matched the checked local build.

A deliberately delayed Castle PNG completed after switching to Grain. Both the downloaded filename and event retained Castle; a real 665,348-byte PNG was saved. Creative tags survived full-page reloads. Tabs opened while Off made zero ingestion requests, then resumed without reload after enabling the shared choice.

QA labels: `webqa-20261025-review-fix-b` and `webqa-20261025-review-cold`. The ingestion endpoint accepted the tested events. A fresh stored-event lookup in PostHog was not repeated because the preview was signed out; ingestion acceptance alone is not a stored-receipt claim.
