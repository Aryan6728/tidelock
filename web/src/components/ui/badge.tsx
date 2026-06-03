type Tone = "active" | "revoked" | "expired";

const tones: Record<Tone, string> = {
  active: "bg-[oklch(0.62_0.16_155_/_0.12)] text-[oklch(0.45_0.16_155)]",
  revoked: "bg-[oklch(0.58_0.20_22_/_0.12)] text-[oklch(0.5_0.2_22)]",
  expired: "bg-[oklch(0.70_0.15_70_/_0.15)] text-[oklch(0.5_0.13_70)]",
};

export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}