import { Route, Routes, useLocation } from "react-router-dom";
import {
  About,
  Contact,
  HomeComponent,
  Services,
  Cafe,
  FloatingCall,
  FooterCarousel,
  Footer,
} from "./components";
import Gallery from "./components/Gallery/Gallery";
import AppBarComponent from "./components/AppBar/AppBarComponent";
import PageHero from "./components/Hero/PageHero";
import { Seo } from "./components/Seo/Seo";
import { Analytics } from "./components/Analytics/Analytics";
import ChatWidget from "./components/ChatWidget/ChatWidget";

// OneKlick live chat (injected by vite.config.ts when this build has a widget
// token — see netlify.toml) replaces Tawk.to. Tawk stays only as the fallback
// for builds without a token, so the site is never left without a chat.
const ONEKLICK_CHAT_ON = Boolean(
  import.meta.env.VITE_ONEKLICK_WIDGET_TOKEN && import.meta.env.VITE_ONEKLICK_WIDGET_SRC
);
import "./styles.css";

/*
 * Routes are eagerly imported (no React.lazy). The route components are tiny
 * (~30 KB total) — the real bundle weight is MUI/React, which is chunked
 * separately in vite.config.ts. Eager imports keep the prerendered HTML and
 * the client render in lock-step: no Suspense fallback can flash in over the
 * fully-rendered prerendered markup.
 */
function AppContent() {
  const location = useLocation();
  const isCafeRoute = location.pathname === "/cafe";
  return (
    <>
      <Seo pathname={location.pathname} />
      <Analytics />
      {!ONEKLICK_CHAT_ON && <ChatWidget />}
      <div className="App">
        <AppBarComponent />
        <PageHero />
        <div className="mainBody">
          <Routes>
            <Route path="/" element={<HomeComponent />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/cafe" element={<Cafe />} />
          </Routes>
        </div>
      </div>
      <FooterCarousel activeTab={isCafeRoute ? "cafe" : "beauty"} />
      <div className="footer">
        <Footer />
      </div>
      <FloatingCall />
    </>
  );
}

export default function App() {
  return <AppContent />;
}
