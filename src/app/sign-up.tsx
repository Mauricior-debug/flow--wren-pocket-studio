import { Redirect } from 'expo-router';

/** Sign-up stays on the FlowTrack website. Pocket Studio uses CRM login. */
export default function SignUpRedirect() {
  return <Redirect href="/sign-in" />;
}
