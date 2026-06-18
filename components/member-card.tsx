import Link from "next/link";
import { MemberAvatar } from "@/components/member-avatar";
import { MemberStatusBadge } from "@/components/status-badge";
import { Badge, Card } from "@/components/ui";
import type { MemberView } from "@/lib/types";

export function MemberCard({ member }: { member: MemberView }) {
  return (
    <Link href={`/members/${member.member_id}`} className="focus-ring block rounded-2xl">
      <Card variant="list" padding="compact" className="h-full transition hover:border-blue-300 hover:shadow-md">
        <div className="flex items-start gap-4">
          <MemberAvatar name={member.display_name} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold">{member.display_name}</h2>
              <MemberStatusBadge status={member.status} />
            </div>
            <p className="mt-2 text-sm text-slate-500">{member.current_cell_name ?? "미지정 셀"} · 마지막 출석 {member.last_attendance_date ?? "기록 없음"}</p>
            {member.unresolved_note_count > 0 && <div className="mt-3"><Badge tone="warning">미해결 메모 {member.unresolved_note_count}건</Badge></div>}
          </div>
        </div>
      </Card>
    </Link>
  );
}
