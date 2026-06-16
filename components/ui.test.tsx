import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui";

describe("Badge", () => {
  it("renders a non-color marker and screen-reader label", () => {
    const markup = renderToStaticMarkup(<Badge tone="success" marker="✓" srLabel="출결 상태">출석</Badge>);

    expect(markup).toContain("✓");
    expect(markup).toContain("출결 상태");
    expect(markup).toContain("출석");
  });
});
