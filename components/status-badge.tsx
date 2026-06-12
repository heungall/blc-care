import { Badge } from "@/components/ui";
import type {
  AbsenceAlertStatus,
  MemberStatus,
  NewcomerStatus,
  ReportStatus,
} from "@/lib/types";

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const config = {
    active: ["활동", "success"],
    dormant: ["휴면", "warning"],
    left: ["출석 중단", "danger"],
    archived: ["보관", "neutral"],
  } as const;
  const [label, tone] = config[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const config = {
    draft: ["작성 중", "warning"],
    submitted: ["제출 완료", "success"],
    locked: ["잠김", "neutral"],
  } as const;
  const [label, tone] = config[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function NewcomerStatusBadge({ status }: { status: NewcomerStatus }) {
  const config = {
    new: ["신규", "primary"],
    contacted: ["연락 완료", "warning"],
    converted: ["성도 전환 완료", "success"],
    archived: ["보관", "neutral"],
  } as const;
  const [label, tone] = config[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function AbsenceStatusBadge({ status }: { status: AbsenceAlertStatus }) {
  const config = {
    open: ["미확인", "warning"],
    checked: ["확인 완료", "primary"],
    resolved: ["해결 완료", "success"],
  } as const;
  const [label, tone] = config[status];
  return <Badge tone={tone}>{label}</Badge>;
}
