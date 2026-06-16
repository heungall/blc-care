import { Badge } from "@/components/ui";
import { getAttendanceStatusLabel, getAttendanceStatusMarker, getAttendanceStatusTone } from "@/lib/attendance";
import type { AttendanceStatus } from "@/lib/types";

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <Badge tone={getAttendanceStatusTone(status)} marker={getAttendanceStatusMarker(status)} srLabel="출결 상태">
      {getAttendanceStatusLabel(status)}
    </Badge>
  );
}
