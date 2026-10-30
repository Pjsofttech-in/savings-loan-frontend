const palettes = [
  { background: "#dbeafe", skin: "#c6865b", hair: "#30221b", shirt: "#2563eb" },
  { background: "#fce7f3", skin: "#e0a476", hair: "#34211d", shirt: "#be185d" },
  { background: "#dcfce7", skin: "#a96c4f", hair: "#201a18", shirt: "#15803d" },
  { background: "#fef3c7", skin: "#edbc91", hair: "#513628", shirt: "#b45309" },
  { background: "#ede9fe", skin: "#8e573f", hair: "#211b1b", shirt: "#6d28d9" },
];

function paletteFor(name) {
  return [...(name || "Member")].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  ) % palettes.length;
}

export default function MemberAvatar({ name, className = "" }) {
  const colors = palettes[paletteFor(name)];
  const longHair = paletteFor(name) % 2 === 0;

  return (
    <svg
      aria-label={`${name || "Member"} profile avatar`}
      className={className}
      role="img"
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="40" cy="40" r="40" fill={colors.background} />
      <path d="M12 80c2-17 12-26 28-26s26 9 28 26" fill={colors.shirt} />
      <path d="M34 48h12v13H34z" fill={colors.skin} />
      {longHair && <path d="M21 39c-2-20 6-30 19-30s22 10 19 30l-3 18H24z" fill={colors.hair} />}
      <ellipse cx="40" cy="35" rx="17" ry="21" fill={colors.skin} />
      {!longHair && <path d="M23 34c0-16 7-24 18-24 10 0 17 7 17 21-5-2-8-7-10-11-5 6-13 9-25 10z" fill={colors.hair} />}
      <circle cx="34" cy="36" r="1.4" fill="#34231f" />
      <circle cx="46" cy="36" r="1.4" fill="#34231f" />
      <path d="M36 44c2 2 6 2 8 0" fill="none" stroke="#8d4f43" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

