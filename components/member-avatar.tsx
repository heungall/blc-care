import { getMemberInitial } from "@/lib/member-display";

export function MemberAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "md" | "lg";
}) {
  const sizeClassName = size === "lg" ? "size-14 text-lg" : "size-12";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 ${sizeClassName}`}
      aria-hidden="true"
    >
      {getMemberInitial(name)}
    </div>
  );
}
