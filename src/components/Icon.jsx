const paths = {
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
