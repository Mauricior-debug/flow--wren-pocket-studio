# Store preparation

Wren Pocket Studio is prepared for the App Store and Google Play from this repo. Nothing has been uploaded. TestFlight and Play internal testing still need the publisher’s Apple and Google accounts.

## Identity

| | |
| --- | --- |
| App name | Wren Pocket Studio |
| Slug | `wren-pocket-studio` |
| Version | 1.0.0 |
| iOS bundle identifier | `studio.wren.pocket` |
| iOS build number | 1 |
| Android package | `studio.wren.pocket` |
| Android version code | 1 |
| Runtime | Expo SDK 58, `runtimeVersion` `58.0.0` |
| Privacy policy placeholder | `https://wren.studio/privacy` (draft in `PRIVACY.md`) |

## Icons and splash

The official mark is the supplied square artwork. It was re-encoded as a real PNG (the source file was JPEG data) without redrawing the mark.

| Role | Path |
| --- | --- |
| iOS and general icon | `assets/icon.png` |
| Android adaptive icon foreground | `assets/adaptive-icon.png` |
| Adaptive icon background | `#0B121C` |
| Splash image | `assets/splash-icon.png` |
| Splash background | `#0B121C` |

The in-app header uses the same icon. The astronaut, onboarding illustration, hero, and project thumbnails are crops of the approved screen designs in `assets/images/`.

## Production build

`eas.json` profile `production`:

- iOS: `distribution: store` (App Store)
- Android: `distribution: store` and `buildType: app-bundle` (AAB for Play)

Command, after Apple and Google credentials exist on this Expo account:

```bash
npx eas-cli build --platform all --profile production
```

What that command expects next:

1. An Expo account that can see this project.
2. Apple credentials (App Store Connect API key or an Apple Distribution certificate and provisioning profile) for `studio.wren.pocket`.
3. A Google Play service account or a local upload keystore for `studio.wren.pocket`.
4. The privacy policy hosted at the URL above, or an updated URL in `app.json` `extra.privacyPolicyUrl`.

The preview update channel is separate and still used by Expo Go. Store packaging does not remove `wren-preview.json`.

## Permissions declared

Only what the app uses:

- Camera — profile photo and project references
- Photo library — profile photo and project references
- Microphone — voice notes while describing a project

Not declared: location, tracking, push notifications. Background audio recording and playback are turned off in the audio config plugin.

## Screenshots

Approved screen designs, cropped to the phone UI and fitted to the 6.7-inch slot (1290×2796), are in `store-screens/iphone-6.7/`. They are design references, not captured from a device, and they include no reviews or download counts.
