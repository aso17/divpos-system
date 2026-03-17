// Footer.jsx — tidak ada perubahan, disertakan untuk kelengkapan

import { Zap } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col items-center justify-center gap-0.5 text-xs">
          <div className="flex items-center gap-1.5 text-gray-800 font-semibold">
            <Zap className="w-4 h-4 text-blue-500" />
            <span>DivPOS Technologies</span>
          </div>

          <p className="text-gray-500 text-center">
            &copy; {currentYear} All rights reserved.
            <span className="hidden lg:inline">
              {" "}
              | Sistem Manajemen Bisnis Modern.
            </span>
          </p>

          <p className="text-gray-400">
            Support:{" "}
            <a
              href="mailto:support@divpos.com"
              className="text-blue-600 hover:underline font-medium"
            >
              support@divpos.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
