import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata = {
  title: "JoyWalk — The Scenic Drift Engine",
  description: "Curated pedestrian routing for mental well-being, shade canopy cover, and acoustic serenity across Delhi NCR.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-[#09110d]">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#09110d] text-[#e8f1ec] antialiased selection:bg-emerald-700 selection:text-white">
        {children}
      </body>
    </html>
  );
}
