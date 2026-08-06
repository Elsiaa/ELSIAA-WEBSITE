import { FullStory, isInitialized } from "@fullstory/browser";

export function grantFullStoryConsent(): void {
  if (!isInitialized()) return;
  FullStory("setIdentity", { consent: true });
}
