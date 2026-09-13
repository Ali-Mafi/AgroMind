export function cloudError(error: unknown) {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "";
  if (message.includes("FARM_LIMIT_REACHED"))
    return "Your farm limit has been reached. Your existing farms are safe.";
  if (message.includes("CLOUD_NOT_EMPTY"))
    return "Your cloud already contains farms. The local backup has not been changed.";
  if (message.includes("IMPORT_ALREADY_COMPLETED"))
    return "A different backup was already imported into this account.";
  if (message.includes("INVALID_IMPORT"))
    return "The local backup could not be validated. No data was changed.";
  if (message.includes("FIRST_FARM_REQUIRED"))
    return "Create or import your first farm to continue.";
  if (message.includes("PROFILE_INCOMPLETE"))
    return "Complete your profile to continue.";
  if (message.includes("FARM_ID_CONFLICT"))
    return "This farm ID already exists with different data. Reload before trying again.";
  return "The change could not be saved. Check your connection and try again.";
}
