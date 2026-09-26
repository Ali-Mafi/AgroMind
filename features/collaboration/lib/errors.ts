export function teamError(error: unknown) {
  const message =
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof error.message === "string"
      ? error.message
      : String(error ?? "");

  if (message.includes("TEAM_MEMBER_LIMIT_REACHED"))
    return "Your team member limit has been reached.";
  if (message.includes("CANNOT_INVITE_OWNER"))
    return "You already own this farm and cannot invite yourself.";
  if (message.includes("MEMBER_ALREADY_ADDED"))
    return "This person already has access to the selected farm.";
  if (message.includes("INVALID_EMAIL"))
    return "Enter a valid email address.";
  if (message.includes("INVALID_TEAM_ROLE"))
    return "Choose a valid team role.";
  if (message.includes("FARM_NOT_FOUND"))
    return "The selected farm is no longer available.";
  if (message.includes("INVITATION_EMAIL_MISMATCH"))
    return "Sign in with the email address that received this invitation.";
  if (message.includes("INVITATION_EXPIRED"))
    return "This invitation has expired. Ask the farm owner for a new invite.";
  if (
    message.includes("INVITATION_INVALID") ||
    message.includes("INVITATION_NOT_FOUND")
  )
    return "This invitation is invalid or no longer available.";
  if (message.includes("OWNER_REQUIRED"))
    return "Only the farm owner can manage team access.";
  if (message.includes("MFA_REQUIRED"))
    return "Complete two-step verification before managing team access.";
  if (message.includes("EMAIL_UNAVAILABLE"))
    return "The invitation email could not be sent. Please try again.";

  return "Team access could not be updated. Please try again.";
}
