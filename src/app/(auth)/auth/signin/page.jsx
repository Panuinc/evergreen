"use client";

import Loading from "@/components/ui/Loading";
import { useSignIn } from "@/hooks/shared/useSignin";
import SignInPasswordForm from "@/components/auth/SignInPasswordForm";
import SignInPinForm from "@/components/auth/SignInPinForm";

export default function SignInPage() {
  const {
    user,
    loading,
    mode,
    lastEmail,
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    handleSignIn,
    pin,
    setPin,
    pinLoading,
    pinError,
    handlePinVerify,
    switchToPin,
    switchToPassword,
  } = useSignIn();

  if (loading || user) {
    return <Loading />;
  }

  if (mode === "pin") {
    return (
      <SignInPinForm
        lastEmail={lastEmail}
        pin={pin}
        onPinChange={setPin}
        onPinVerify={handlePinVerify}
        pinLoading={pinLoading}
        pinError={pinError}
        onSwitchToPassword={switchToPassword}
      />
    );
  }

  return (
    <SignInPasswordForm
      email={email}
      onEmailChange={setEmail}
      password={password}
      onPasswordChange={setPassword}
      isLoading={isLoading}
      onSignIn={handleSignIn}
      lastEmail={lastEmail}
      onSwitchToPin={switchToPin}
    />
  );
}
