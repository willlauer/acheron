import "./globals.css";

export const metadata = {
  title: "Acheron",
  description: "A personal website and technical blog",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}