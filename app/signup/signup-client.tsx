"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, ApiClientError, getApiBaseUrl } from "../lib/api-client";

type RegistrationState = "checking" | "open" | "closed" | "disabled" | "unavailable";
type AuthSession = { user: { id: string; email: string; role: string }; csrfToken: string; expiresAt: string };

function ShieldIcon() {
  return (
    <svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z" />
      <path d="m8.5 12 2.2 2.2 4.8-4.8" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" focusable="false" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [registrationState, setRegistrationState] = useState<RegistrationState>("checking");
  const [statusError, setStatusError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [setupCodeRequired, setSetupCodeRequired] = useState(false);
  const [setupCode, setSetupCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    apiRequest<{ registrationOpen: boolean; setupCodeRequired?: boolean; setupDisabled?: boolean }>("/auth/registration-status", { signal: controller.signal })
      .then((result) => {
        if (!active) return;
        setSetupCodeRequired(Boolean(result.setupCodeRequired));
        setRegistrationState(result.setupDisabled ? "disabled" : result.registrationOpen ? "open" : "closed");
      })
      .catch((cause: unknown) => {
        if (!active || (cause instanceof Error && cause.name === "AbortError")) return;
        setRegistrationState("unavailable");
        setStatusError(cause instanceof Error ? cause.message : "Registration availability could not be checked.");
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [retryCount]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    if (password.length < 14 || password.length > 128) {
      setError("Use a password between 14 and 128 characters.");
      return;
    }

    setPending(true);
    try {
      await apiRequest<AuthSession>("/auth/register", {
        method: "POST",
        body: { email: email.trim(), password, ...(setupCodeRequired ? { setupToken: setupCode.trim() } : {}) }
      });
      setSuccess("Administrator account created. Opening your secure workspace…");
      setPassword("");
      setConfirmPassword("");
      setSetupCode("");
      router.replace("/");
      router.refresh();
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.status === 409) {
        setRegistrationState("closed");
        setError("Initial setup has already been completed. Sign in with your existing administrator account.");
      } else if (cause instanceof ApiClientError && cause.status === 403) {
        setError("The one-time setup code is invalid. Check it with the system operator and try again.");
      } else if (cause instanceof ApiClientError && cause.status === 503) {
        setStatusError("The system operator has not enabled secure initial setup. Ask them to configure the one-time setup code on the API.");
        setRegistrationState("disabled");
      } else if (cause instanceof ApiClientError && cause.status === 429) {
        setError("Too many setup attempts. Wait for the limit to reset before trying again.");
      } else if (cause instanceof ApiClientError && cause.status === 400) {
        setError(cause.message);
      } else {
        setError(cause instanceof Error ? cause.message : "The account could not be created. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  const isUnavailable = registrationState === "unavailable" || !getApiBaseUrl();

  return (
    <main className="auth-page">
      <a className="skip-link" href={registrationState === "open" ? "#signup-form" : "#signup-heading"}>Skip to sign-up form</a>
      <div className="auth-backdrop auth-backdrop--one" aria-hidden="true" />
      <div className="auth-backdrop auth-backdrop--two" aria-hidden="true" />
      <section className="auth-shell signup-shell" aria-labelledby="signup-heading">
        <Link className="auth-brand" href="/">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span className="brand-copy"><strong>doctor<span>tracker</span></strong><small>CARE OPERATIONS</small></span>
        </Link>

        {registrationState === "checking" ? (
          <div className="auth-status-card" role="status">
            <span className="auth-symbol"><ShieldIcon /></span>
            <p className="section-kicker">SECURE INITIAL SETUP</p>
            <h1 id="signup-heading">Checking registration.</h1>
            <p>Verifying that the first administrator account can still be created.</p>
          </div>
        ) : registrationState === "closed" ? (
          <div className="auth-status-card" aria-labelledby="signup-heading">
            <span className="auth-symbol"><ShieldIcon /></span>
            <p className="section-kicker">SETUP COMPLETE</p>
            <h1 id="signup-heading">Your workspace is already configured.</h1>
            <p>Public sign-up is only available for the first administrator. Sign in with the administrator account that was created during setup.</p>
            <Link className="auth-submit auth-submit-link" href="/">Return to sign in <ArrowIcon /></Link>
            <p className="auth-status-foot">If you are locked out, contact the system operator to recover access securely.</p>
          </div>
        ) : registrationState === "disabled" ? (
          <div className="auth-status-card" aria-labelledby="signup-heading">
            <span className="auth-symbol"><ShieldIcon /></span>
            <p className="section-kicker">SECURE SETUP REQUIRED</p>
            <h1 id="signup-heading">Initial setup is not enabled.</h1>
            <p>The system operator must enable first-administrator setup with a one-time secret configured on the API. No account can be claimed until that secure setup is enabled.</p>
            <button type="button" className="auth-submit" onClick={() => { setStatusError(""); setRegistrationState("checking"); setRetryCount((count) => count + 1); }}>Check again <ArrowIcon /></button>
            <p className="auth-status-foot"><Link href="/">Return to sign in</Link></p>
          </div>
        ) : isUnavailable ? (
          <div className="auth-status-card" aria-labelledby="signup-heading">
            <span className="auth-symbol"><ShieldIcon /></span>
            <p className="section-kicker">CONNECTION CHECK</p>
            <h1 id="signup-heading">Setup is temporarily unavailable.</h1>
            <p>{statusError || "Configure the API URL and restart the frontend before creating the first administrator."}</p>
            {!getApiBaseUrl() && <pre className="env-snippet">NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1</pre>}
            <button type="button" className="auth-submit" onClick={() => { setStatusError(""); setRegistrationState("checking"); setRetryCount((count) => count + 1); }}>Try again <ArrowIcon /></button>
            <p className="auth-status-foot"><Link href="/">Return to sign in</Link></p>
          </div>
        ) : (
          <div className="auth-panel">
            <span className="auth-symbol"><ShieldIcon /></span>
            <p className="section-kicker">FIRST-TIME WORKSPACE SETUP</p>
            <h1 id="signup-heading">Create your account.</h1>
            <p className="auth-subtitle">Set up the first administrator for your Doctor Tracker workspace.</p>

            {error && <p className="auth-error" role="alert">{error}</p>}
            {success && <p className="auth-notice" role="status">{success}</p>}

            <form id="signup-form" className="auth-form signup-form" onSubmit={handleSubmit}>
              {setupCodeRequired && (
                <>
                  <label htmlFor="signup-setup-code">One-time setup code</label>
                  <input
                    id="signup-setup-code"
                    name="setupCode"
                    type="password"
                    autoComplete="off"
                    maxLength={512}
                    required
                    value={setupCode}
                    onChange={(event) => setSetupCode(event.target.value)}
                    placeholder="Enter the code from your system operator"
                    disabled={pending}
                  />
                  <p className="signup-password-note">This code is provided out of band by the system operator. It is sent only to the API and is never saved in browser storage.</p>
                </>
              )}

              <label htmlFor="signup-email">Administrator email</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                maxLength={254}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@clinic.com"
                disabled={pending}
              />

              <div className="password-label-row">
                <label htmlFor="signup-password">Create password</label>
                <span>14–128 characters</span>
              </div>
              <div className="password-field">
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={14}
                  maxLength={128}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a strong password"
                  disabled={pending}
                />
                <button type="button" className="password-toggle" aria-pressed={showPassword} onClick={() => setShowPassword((shown) => !shown)} disabled={pending}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <label htmlFor="signup-confirm-password" className="signup-confirm-label">Confirm password</label>
              <input
                id="signup-confirm-password"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={14}
                maxLength={128}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter the same password again"
                disabled={pending}
              />

              <p className="signup-password-note">Use a unique passphrase of at least 14 characters. The API stores a salted password hash, never your plain-text password.</p>

              <button type="submit" className="auth-submit" disabled={pending || !email.trim() || password.length < 14 || !confirmPassword || password !== confirmPassword || (setupCodeRequired && !setupCode.trim())}>
                {pending ? <><span className="button-spinner" aria-hidden="true" /> Creating account…</> : <>Create administrator <ArrowIcon /></>}
              </button>
            </form>

            <div className="auth-security-note">
              <ShieldIcon />
              <p><strong>One-time secure setup</strong><span>This page creates only the first administrator. Registration automatically closes after that account exists; users cannot choose or elevate their own role.</span></p>
            </div>
          </div>
        )}
        <p className="auth-footer">Already have an account? <Link className="auth-inline-link" href="/">Sign in</Link>.</p>
      </section>
    </main>
  );
}
