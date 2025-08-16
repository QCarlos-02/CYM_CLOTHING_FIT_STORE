// src/components/Footer.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaWhatsapp, FaFacebook, FaTiktok, FaInstagram } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

export default function Footer() {
  const [showAdmin, setShowAdmin] = useState(false);

  // --- long-press & multi-tap (móvil) ---
  const pressTimer = useRef(null);
  const tapCount = useRef(0);
  const tapResetTimer = useRef(null);
  const autoHideTimer = useRef(null);

  const revealAdmin = () => {
    setShowAdmin(true);
    clearTimeout(autoHideTimer.current);
    autoHideTimer.current = setTimeout(() => setShowAdmin(false), 10000); // 10s
  };

  const onDoubleClick = () => revealAdmin(); // desktop

  const onTouchStart = () => {
    // long-press 800ms
    pressTimer.current = setTimeout(revealAdmin, 800);
  };
  const onTouchEnd = () => {
    clearTimeout(pressTimer.current);
  };

  const onTap = () => {
    // fallback: 5 toques en < 2s
    tapCount.current += 1;
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      clearTimeout(tapResetTimer.current);
      revealAdmin();
      return;
    }
    clearTimeout(tapResetTimer.current);
    tapResetTimer.current = setTimeout(() => (tapCount.current = 0), 2000);
  };

  useEffect(() => {
    return () => {
      clearTimeout(pressTimer.current);
      clearTimeout(tapResetTimer.current);
      clearTimeout(autoHideTimer.current);
    };
  }, []);

  return (
    <footer className="footer">
      <div className="footer-inner container">
        {/* Texto principal */}
        <div
          className="footer-copy"
          onDoubleClick={onDoubleClick}   // desktop
          onTouchStart={onTouchStart}    // móvil (long-press)
          onTouchEnd={onTouchEnd}
          onClick={onTap}                // móvil (multi-tap)
          aria-label="© C&M CLOTHING FIT — doble clic / mantener presionado para admin"
          style={{ cursor: "default" }}
        >
          <span className="footer-title">
            © {new Date().getFullYear()} C&M CLOTHING FIT
          </span>
          <span className="footer-dev">Desarrollado por Carlos Quintero</span>

          {showAdmin && (
            <Link to="/admin/login" className="btn ghost admin-hidden-btn">
              Admin
            </Link>
          )}
        </div>

        {/* Redes */}
        <nav className="footer-socials" aria-label="Redes sociales">
          <a
            className="ico ico-wa"
            href="https://wa.me/573045378344"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            title="WhatsApp"
          >
            <FaWhatsapp />
          </a>

          <a
            className="ico ico-fb"
            href="https://www.facebook.com/share/1FeTaQUYdP/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            title="Facebook"
          >
            <FaFacebook />
          </a>

          <a
            className="ico ico-mail"
            href="mailto:Clothingfitstore@gmail.com"
            aria-label="Correo electrónico"
            title="Correo"
          >
            <MdEmail />
          </a>

          <a
            className="ico ico-tt"
            href="https://www.tiktok.com/@clothing_fitstore?_t=ZS-8ytqIdhVFUm&_r=1"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            title="TikTok"
          >
            <FaTiktok />
          </a>

          <a
            className="ico ico-ig"
            href="https://www.instagram.com/clothing_fitstore?igsh=MXBwb3V6NHdhdjU2cg=="
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            title="Instagram"
          >
            <FaInstagram />
          </a>
        </nav>
      </div>
    </footer>
  );
}
