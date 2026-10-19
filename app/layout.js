import "./globals.css";

export const metadata = {
  title: "Auth System",
  description: "Chat app with friends, groups and premium",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}