import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Badge, Card, Skeleton, SkeletonPanel } from "@/components/ui";

describe("Badge", () => {
  it("renders a non-color marker and screen-reader label", () => {
    const markup = renderToStaticMarkup(<Badge tone="success" marker="✓" srLabel="출결 상태">출석</Badge>);

    expect(markup).toContain("✓");
    expect(markup).toContain("출결 상태");
    expect(markup).toContain("출석");
  });
});

describe("Skeleton", () => {
  it("renders a status label while hiding decorative placeholder blocks", () => {
    const markup = renderToStaticMarkup(
      <SkeletonPanel label="목록을 불러오는 중입니다.">
        <Skeleton className="h-4 w-20" />
      </SkeletonPanel>,
    );

    expect(markup).toContain('role="status"');
    expect(markup).toContain("목록을 불러오는 중입니다.");
    expect(markup).toContain('aria-hidden="true"');
  });
});

describe("Card", () => {
  it("applies visual role and density classes", () => {
    const markup = renderToStaticMarkup(<Card variant="sensitive" padding="compact">민감 정보</Card>);

    expect(markup).toContain("bg-slate-50/70");
    expect(markup).toContain("p-4");
    expect(markup).toContain("민감 정보");
  });
});
