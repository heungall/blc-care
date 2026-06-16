import { Badge } from "@/components/ui";
import { getAttendanceStatusLabel, getAttendanceStatusTone } from "@/lib/attendance";
import type { AttendanceStatus } from "@/lib/types";

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return <Badge tone={getAttendanceStatusTone(status)}>{getAttendanceStatusLabel(status)}</Badge>;
}
