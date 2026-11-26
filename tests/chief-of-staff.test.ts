import test from "node:test";
import assert from "node:assert/strict";
import { CHIEF_OF_STAFF_SYSTEM_PROMPT, chiefOfStaffPromptIsApprovalGated } from "../src/chiefOfStaff.ts";

test("Chief of Staff prompt preserves explicit approval boundaries", () => {
  assert.equal(chiefOfStaffPromptIsApprovalGated(), true);
  assert.match(CHIEF_OF_STAFF_SYSTEM_PROMPT, /Independent Verifier/);
  assert.match(CHIEF_OF_STAFF_SYSTEM_PROMPT, /Community Blackboard/);
  assert.match(CHIEF_OF_STAFF_SYSTEM_PROMPT, /must obtain explicit user approval/);
});
