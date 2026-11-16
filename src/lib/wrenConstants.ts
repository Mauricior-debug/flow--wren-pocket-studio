export const WREN_ROLE_ID = 'website_architect';

export const WREN_RUN_TASKS = [
  { id: 'architect_internet_scout', label: 'Internet scout' },
  { id: 'architect_ingest_buddy', label: 'Buddy ingest' },
  { id: 'architect_analyze', label: 'Analyse sites' },
  { id: 'architect_build', label: 'Build one-pagers' },
  { id: 'architect_outreach', label: 'Draft outreach' },
  { id: 'architect_demo_video', label: 'Pitch demo video' },
] as const;

export const WREN_FUNNEL = [
  { id: 'scout', label: 'Scout', filter: 'assigned' },
  { id: 'analyse', label: 'Analyse', filter: 'analyzed' },
  { id: 'build', label: 'Build', filter: 'queued_build' },
  { id: 'outreach', label: 'Outreach', filter: 'outreach_drafted' },
  { id: 'sent', label: 'Sent', filter: 'built' },
  { id: 'client', label: 'Client', filter: 'converted' },
] as const;

export const STATUS_FILTERS = [
  { id: 'work', label: 'On desk' },
  { id: 'all', label: 'All' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'researching', label: 'Researching' },
  { id: 'analyzed', label: 'Analysed' },
  { id: 'queued_build', label: 'Queued' },
  { id: 'built', label: 'Built' },
  { id: 'outreach_drafted', label: 'Outreach' },
  { id: 'converted', label: 'Client' },
  { id: 'skipped', label: 'Skipped' },
] as const;

export const WREN_STACKS = [
  { id: 'auto', label: 'Auto' },
  { id: 'html', label: 'HTML and CSS' },
  { id: 'react', label: 'React' },
  { id: 'next', label: 'Next.js' },
  { id: 'react-native', label: 'React Native' },
] as const;

export const JOB_FILE_ROLES = [
  { id: 'logo', label: 'Logo' },
  { id: 'app_icon', label: 'App icon' },
  { id: 'photo', label: 'Photo' },
  { id: 'brand_guidelines', label: 'Brand guidelines' },
  { id: 'screenshot', label: 'Screenshot' },
  { id: 'wireframe', label: 'Wireframe' },
  { id: 'screen_design', label: 'Screen design' },
  { id: 'source_code', label: 'Source code' },
  { id: 'pdf_brief', label: 'PDF brief' },
  { id: 'word_brief', label: 'Word brief' },
  { id: 'copy_deck', label: 'Copy deck' },
  { id: 'reference', label: 'Reference' },
  { id: 'other', label: 'Other' },
] as const;

export type WrenStack = (typeof WREN_STACKS)[number]['id'];
export type JobFileRole = (typeof JOB_FILE_ROLES)[number]['id'];

export function storeReadyPrompt({ appName = '', hasIcon = false }: { appName?: string; hasIcon?: boolean } = {}) {
  const name = String(appName || 'this app').slice(0, 80);
  const iconLine = hasIcon
    ? `- The attached or wren-source app_icon is the official mark. Wire that exact square image as icon, android.adaptiveIcon.foregroundImage, and the splash source. Do not invent a different logo.`
    : `- If wren-source has a logo or app_icon, derive a clear square store icon and splash from it and commit them under assets/. Never leave the default Expo icon.`;

  return `STORE READY — one job. Prepare ${name} so it can ship to both the Apple App Store and Google Play. Do not start a new app. Keep the screens, data, navigation, and Expo Go preview that already work.

Do all of this in one pass:

1. Brand and icons
${iconLine}
- Set app.json / app.config: name, slug, version, icon, splash, ios.bundleIdentifier, android.package, ios.buildNumber, android.versionCode, userInterfaceStyle, and privacy / permission strings the app actually uses.
- Adaptive icon: solid brand background + the foreground mark, no text that becomes unreadable when masked.

2. EAS Build for both stores (managed Expo, SDK 58)
- Add or update eas.json with a production profile that builds both platforms: iOS (App Store) and Android (Play Store / AAB).
- Keep the existing Expo Go / preview update channel working. Store packaging is additive — do not remove wren-preview.json or break the desk QR.
- Use the managed workflow. Prefer config plugins over bare eject. Only add a native module when the product already needs it and Expo Go cannot run it; if you must, document that Expo Go will not open that build and still leave a preview path when possible.
- Write short STORE.md at the repo root: bundle id / package name, version, icon paths, what \`eas build --platform all --profile production\` expects next (credentials), and that TestFlight / Play internal testing still need the person's Apple and Google accounts.

3. Store listing pack (in the repo, not submitted for them)
- STORE_LISTING.md with: App Store name (≤30), subtitle (≤30), promotional text, full description, keywords idea list, short Play Store description (≤80), full Play description, category suggestion, and content-rating notes from what the app does.
- Prefer real screenshots from the built screens when possible; otherwise export the approved screen designs into a store-screens/ folder and label phone sizes. Do not invent fake reviews or download counts.

4. Compliance before finish
- Privacy Policy URL placeholder in app config if the app collects any account, contact, or analytics data — put a PRIVACY.md draft in the repo.
- Declare camera, photos, location, tracking, and notifications only when the code uses them; remove unused permission strings.
- Confirm the production Android build targets an AAB and iOS targets App Store distribution.

5. Finish
- Commit the config, assets, STORE.md, and STORE_LISTING.md.
- Push the branch. Do not merge unless this repo is on a flow--* auto-merge path.
- In the pull request, list: icon path, bundle id, package name, eas production profile, and that both stores are prepared from one prompt.

This is store preparation only. Do not purchase accounts, upload to App Store Connect, or upload to Google Play Console unless those credentials are already in the environment and the person explicitly asked to submit.`;
}

export function appendStoreReady(text: string, { enabled = false, appName = '', hasIcon = false }: { enabled?: boolean; appName?: string; hasIcon?: boolean } = {}) {
  if (!enabled) return String(text || '');
  const body = String(text || '').trim();
  const ready = storeReadyPrompt({ appName, hasIcon });
  return body ? `${body}\n\n${ready}` : ready;
}

export function planText(plan: any, { web = false } = {}) {
  if (!plan?.screens?.length) return '';
  const unit = web ? 'PAGE' : 'SCREEN';
  const lines = [`${unit} PLAN (Wren planned every ${unit.toLowerCase()} and the flow. Build all of them, wire every action, and handle every state listed):`];
  if (plan.product) lines.push(plan.product);
  plan.screens.forEach((screen: any, index: number) => {
    lines.push(`\n${index + 1}. ${screen.name}${screen.purpose ? `: ${screen.purpose}` : ''}`);
    if (screen.contents?.length) lines.push(`   Shows: ${screen.contents.join('; ')}`);
    if (screen.actions?.length) lines.push(`   Actions: ${screen.actions.join('; ')}`);
    if (screen.states?.length) lines.push(`   States: ${screen.states.join('; ')}`);
    if (screen.data?.length) lines.push(`   Data: ${screen.data.join('; ')}`);
  });
  if (plan.flow?.length) lines.push(`\nFlows:\n${plan.flow.map((row: string) => `- ${row}`).join('\n')}`);
  if (plan.data?.length) lines.push(`\nData to store:\n${plan.data.map((row: string) => `- ${row}`).join('\n')}`);
  if (plan.integrations?.length) lines.push(`\nIntegrations:\n${plan.integrations.map((row: string) => `- ${row}`).join('\n')}`);
  if (plan.assumptions?.length) lines.push(`\nAssumptions Wren made:\n${plan.assumptions.map((row: string) => `- ${row}`).join('\n')}`);
  if (!web) {
    lines.push(
      `\nAPP ICON (required):\n- This native app must ship with its own square app icon and splash — never the default Expo icon.\n- When an app_icon file is attached to the job, that exact artwork is the home-screen, App Store, and Google Play icon.\n- Wire icon + adaptiveIcon + splash in app.json / app.config before you finish, and list the paths in the pull request.`,
    );
  }
  return lines.join('\n');
}

export function acceptSuggestion(plan: any, name: string) {
  const pick = plan?.suggested?.find((row: any) => row.name === name);
  if (!pick) return plan;
  return {
    ...plan,
    screens: [...(plan.screens || []), { name: pick.name, purpose: pick.why, contents: [], actions: [], states: [], data: [] }].slice(0, 16),
    suggested: (plan.suggested || []).filter((row: any) => row.name !== name),
  };
}
