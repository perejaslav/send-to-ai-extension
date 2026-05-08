import test from "node:test";
import assert from "node:assert/strict";

import {
  ALL_PROFILES_ID,
  BUILT_IN_PROFILE_IDS,
  getProfileTitle,
  isCommandVisibleForProfiles,
  isProfileFilterActive,
  normalizeActiveProfileIds,
  normalizeCommandProfileIds
} from "../profiles.js";

test("normalizeActiveProfileIds falls back to all profiles", () => {
  assert.deepEqual(normalizeActiveProfileIds(null), [ALL_PROFILES_ID]);
  assert.deepEqual(normalizeActiveProfileIds([]), [ALL_PROFILES_ID]);
  assert.deepEqual(normalizeActiveProfileIds(["missing"]), [ALL_PROFILES_ID]);
});

test("normalizeActiveProfileIds keeps allowed unique profile ids", () => {
  assert.deepEqual(normalizeActiveProfileIds(["marketing", "missing", "marketing", "research"]), ["marketing", "research"]);
  assert.deepEqual(normalizeActiveProfileIds([ALL_PROFILES_ID, "marketing"]), [ALL_PROFILES_ID, "marketing"]);
});

test("normalizeCommandProfileIds keeps only built-in command profile ids", () => {
  assert.deepEqual(normalizeCommandProfileIds(null), []);
  assert.deepEqual(normalizeCommandProfileIds(["marketing", "missing", "marketing", "youtube"]), ["marketing", "youtube"]);
  assert.ok(BUILT_IN_PROFILE_IDS.includes("hermes"));
});

test("isProfileFilterActive detects all profile mode", () => {
  assert.equal(isProfileFilterActive([ALL_PROFILES_ID]), false);
  assert.equal(isProfileFilterActive(["marketing"]), true);
  assert.equal(isProfileFilterActive([]), false);
});

test("isCommandVisibleForProfiles keeps unprofiled commands visible", () => {
  assert.equal(isCommandVisibleForProfiles({ profileIds: [] }, ["marketing"]), true);
  assert.equal(isCommandVisibleForProfiles({ profileIds: ["marketing"] }, [ALL_PROFILES_ID]), true);
  assert.equal(isCommandVisibleForProfiles({ profileIds: ["marketing"] }, ["marketing"]), true);
  assert.equal(isCommandVisibleForProfiles({ profileIds: ["marketing"] }, ["research"]), false);
});

test("getProfileTitle returns friendly titles", () => {
  assert.equal(getProfileTitle(ALL_PROFILES_ID), "Все профили");
  assert.equal(getProfileTitle("marketing"), "Маркетинг");
  assert.equal(getProfileTitle("unknown"), "unknown");
});
