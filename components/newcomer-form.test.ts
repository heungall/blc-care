import { describe, expect, it } from "vitest";
import { newcomerSchema } from "@/components/newcomer-form";

const validForm = {
  name: "샘플새봄",
  phone: "010-0000-0000",
  address: "",
  visit_motivation: "",
  visit_channel: "",
  faith_experience: "",
  after_service_plan: "",
  privacy_agreed: true,
};

describe("newcomer form validation", () => {
  it("accepts required fields with privacy agreement", () => {
    expect(newcomerSchema.safeParse(validForm).success).toBe(true);
  });

  it("rejects submission without privacy agreement", () => {
    expect(newcomerSchema.safeParse({ ...validForm, privacy_agreed: false }).success).toBe(false);
  });

  it("rejects empty name and phone", () => {
    expect(newcomerSchema.safeParse({ ...validForm, name: "", phone: "" }).success).toBe(false);
  });
});
