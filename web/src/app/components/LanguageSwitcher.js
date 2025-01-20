'use client';

import React from "react";
import { LanguageIcon } from "@heroicons/react/24/outline";

const LanguageSwitcher = () => {
  const getCurrentLanguage = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const match = path.match(/^\/([a-z]{2})(\/|$)/);
      return match ? match[1] : 'zh';
    }
    return 'zh';
  };

  const [isOpen, setIsOpen] = React.useState(false);

  const options = [
    { code: "zh" },
    { code: "en" },
    { code: "jp" },
  ];

  const setOption = (code) => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const restPath = currentPath.replace(/^\/[a-z]{2}/, '') || '/';
      const newPath = `/${code}${restPath === '/' ? '' : restPath}`;
      window.location.href = newPath;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md hover:bg-accent/50 transition-colors"
      >
        <LanguageIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-24 rounded-md shadow-lg bg-background border border-border">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.code}
                className="block w-full px-4 py-2 text-sm text-left hover:bg-accent/50"
                onClick={() => {
                  setOption(option.code);
                  setIsOpen(false);
                }}
              >
                {option.code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
