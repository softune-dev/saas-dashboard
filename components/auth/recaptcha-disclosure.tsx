/** Required by Google's reCAPTCHA terms whenever the floating badge is
 * hidden (see globals.css's .grecaptcha-badge rule) — this text replaces
 * it. Render next to any submit button that calls getRecaptchaToken()
 * (lib/recaptcha.ts): the main sign-in screen, the theme editor's "sign in
 * to publish" modal, and the account switcher's "Add account" modal. */
export function RecaptchaDisclosure() {
  return (
    <p className="text-center text-[11px] leading-relaxed text-muted-soft">
      This site is protected by reCAPTCHA and the Google{" "}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-muted"
      >
        Privacy Policy
      </a>{" "}
      and{" "}
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-muted"
      >
        Terms of Service
      </a>{" "}
      apply.
    </p>
  );
}
