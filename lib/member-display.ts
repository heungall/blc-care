export function getMemberInitial(name: string) {
  return Array.from(name.trim())[0] ?? "?";
}
