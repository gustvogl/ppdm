const paths = {
  folder: "M3 7V5h7l2 2h9v13H3z",
  calendar: "M4 5h16v16H4zM4 10h16M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2",
  chart: "M3 3v18h18M7 17v-5M12 17V7M17 17V3",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z",
  star: "m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z",
  bell: "M5 17h14l-2-3V9a5 5 0 0 0-10 0v5zM10 21h4",
  down: "m6 9 6 6 6-6",
  left: "m15 6-6 6 6 6",
  right: "m9 6 6 6-6 6",
  download: "M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4",
  upload: "M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4",
  play: "m8 4 12 8-12 8z",
  pause: "M7 4h3v16H7zM14 4h3v16h-3z",
  board: "M3 3h5v18H3zM10 3h5v12h-5zM17 3h5v16h-5z",
  user: "M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 22v-4a8 8 0 0 1 16 0v4",
  sun: "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M12 1v2M12 21v2M1 12h2M21 12h2M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2",
  moon: "M21 13a9 9 0 1 1-10-10 8 8 0 0 0 10 10",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  wifi: "M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8 16a6 6 0 0 1 8 0M12 20h.01",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  check: "m5 12 4 4L19 6",
  plus: "M12 5v14M5 12h14",
  logout: "M9 4H4v16h5M14 8l4 4-4 4M8 12h10",
  lock: "M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  clock: "M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  edit: "m16 3 5 5-12 12H4v-5zM13 6l5 5",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  close: "m6 6 12 12M18 6 6 18",
  refresh:
    "M21 4v6h-6M3 20v-6h6M4 9a8 8 0 0 1 13-5l4 6M20 15a8 8 0 0 1-13 5l-4-6",
  leaf: "M4 20 16 8M4 16C3 4 13 3 21 3c0 8-1 18-13 17",
  mail: "M3 5h18v14H3zM3 5l9 7 9-7",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
};
export default function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.grid} />
    </svg>
  );
}
export function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M44 24.5c0-1.4-.1-2.8-.4-4.2H24v8h11.2c-.5 2.6-2 4.8-4.2 6.2v5.2h6.8c4-3.7 6.2-9 6.2-15.2Z"
      />
      <path
        fill="#34A853"
        d="M24 45c5.6 0 10.3-1.9 13.8-5.3L31 34.5c-1.9 1.3-4.3 2-7 2-5.4 0-10-3.7-11.6-8.7H5.3V33C8.8 40.1 16 45 24 45Z"
      />
      <path
        fill="#FBBC05"
        d="M12.4 27.8a12.3 12.3 0 0 1 0-7.6V15H5.3a21 21 0 0 0 0 18Z"
      />
      <path
        fill="#EA4335"
        d="M24 11.5c3 0 5.7 1 7.9 3.1l5.9-5.9A20 20 0 0 0 24 3C16 3 8.8 7.9 5.3 15l7.1 5.2c1.6-5 6.2-8.7 11.6-8.7Z"
      />
    </svg>
  );
}
