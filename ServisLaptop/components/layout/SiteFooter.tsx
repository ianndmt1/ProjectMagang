import { DEFAULT_APP_SETTINGS, AppSettings } from "@/lib/settings-config";

function IconLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-grad-footer" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="8" fill="url(#logo-grad-footer)" />
      <path d="M9 10h7a4 4 0 010 8H9V10z" fill="white" />
      <path d="M9 18h8a4 4 0 010 8H9V18z" fill="white" opacity="0.7" />
      <rect x="20" y="12" width="2" height="12" rx="1" fill="white" opacity="0.5" />
      <rect x="24" y="10" width="2" height="16" rx="1" fill="white" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface SiteFooterProps {
  settings?: AppSettings;
}

export default function SiteFooter({ settings }: SiteFooterProps) {
  const store = settings || DEFAULT_APP_SETTINGS;

  return (
    <footer
      className="py-12 px-4 sm:px-6 border-t"
      style={{ background: "#080F1E", borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <IconLogo size={32} />
              <div>
                <div className="font-bold text-sm text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {store.shop_name}
                </div>
                <div className="text-[10px] text-slate-500">Pusat Service Laptop & PC</div>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Service laptop, komputer & sparepart terpercaya, cepat, dan bergaransi.
            </p>
          </div>

          {/* Layanan */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-mono)" }}>
              Layanan
            </h4>
            <ul className="space-y-2.5">
              {["Servis Laptop", "Servis PC", "Katalog Sparepart", "Upgrade RAM/SSD"].map((item) => (
                <li key={item}>
                  <a href="/#layanan" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Link cepat */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-mono)" }}>
              Link Cepat
            </h4>
            <ul className="space-y-2.5">
              <li><a href="/cek-status" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Cek Status Service</a></li>
              <li><a href="/sparepart" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Katalog Sparepart</a></li>
              <li><a href="/#cara-service" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Cara Service</a></li>
              <li><a href="/admin/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Login Admin</a></li>
            </ul>
          </div>

          {/* Kontak singkat */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-mono)" }}>
              Hubungi Kami
            </h4>
            <div className="space-y-2.5">
              <div className="text-xs text-slate-500">{store.shop_address}</div>
              <div className="text-xs text-slate-500">
                {store.operational_hours}
              </div>
              <a
                href={`https://wa.me/${store.shop_whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                style={{ color: "#22C55E" }}
              >
                <IconWhatsApp />
                Chat WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div
          className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <span>© {new Date().getFullYear()} {store.shop_name}. All rights reserved.</span>
          <span className="px-2.5 py-1 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[11px] font-mono">
            Versi Demo — LaptopDoctor.AI
          </span>
        </div>
      </div>
    </footer>
  );
}
