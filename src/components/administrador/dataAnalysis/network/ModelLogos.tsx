
import React from 'react';

interface ModelLogoProps {
  size?: number;
  className?: string;
}

export const OpenAILogo: React.FC<ModelLogoProps> = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.078 6.078 0 0 0 6.518 2.9 5.991 5.991 0 0 0 4.233 1.803c2.016 0 3.817-.84 5.095-2.196a5.985 5.985 0 0 0 3.995-2.9 6.046 6.046 0 0 0-.745-7.094Z"
      fill="#74aa9c"
    />
    <path
      d="M9.018 16.986a2.26 2.26 0 0 1-1.107-.295 2.296 2.296 0 0 1-.795-.808 2.29 2.29 0 0 1-.295-1.107V9.224a2.29 2.29 0 0 1 .295-1.107 2.296 2.296 0 0 1 .795-.808 2.26 2.26 0 0 1 1.107-.295h5.964a2.26 2.26 0 0 1 1.107.295 2.296 2.296 0 0 1 .795.808 2.29 2.29 0 0 1 .295 1.107v5.552a2.29 2.29 0 0 1-.295 1.107 2.296 2.296 0 0 1-.795.808 2.26 2.26 0 0 1-1.107.295H9.018Z"
      fill="#fff"
    />
  </svg>
);

export const AnthropicLogo: React.FC<ModelLogoProps> = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect width="24" height="24" rx="4" fill="#d97706" />
    <path
      d="M8.5 6.5h2.2l4.8 11h-2.2L12.5 15h-4.8l-.8 2.5H4.7l4.8-11Zm.8 6.5h3.4l-1.7-4.2L9.3 13Z"
      fill="#fff"
    />
  </svg>
);

export const GeminiLogo: React.FC<ModelLogoProps> = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285f4" />
        <stop offset="25%" stopColor="#34a853" />
        <stop offset="50%" stopColor="#fbbc05" />
        <stop offset="75%" stopColor="#ea4335" />
        <stop offset="100%" stopColor="#4285f4" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#gemini-gradient)" />
    <path
      d="M12 4.5c-1.2 0-2.3.3-3.2.9L12 8.7l3.2-3.3c-.9-.6-2-.9-3.2-.9Zm-6 6c0-1.2.3-2.3.9-3.2L10.2 12l-3.3 3.2c-.6-.9-.9-2-.9-3.2Zm6 9c1.2 0 2.3-.3 3.2-.9L12 15.3l-3.2 3.3c.9.6 2 .9 3.2.9Zm6-6c0 1.2-.3 2.3-.9 3.2L13.8 12l3.3-3.2c.6.9.9 2 .9 3.2Z"
      fill="#fff"
    />
  </svg>
);

export const MistralLogo: React.FC<ModelLogoProps> = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect width="24" height="24" rx="4" fill="#7c3aed" />
    <path
      d="M6 7v10h2V9.5l2.5 2.5L13 9.5V17h2V7h-2l-2.5 2.5L8 7H6Zm8 0v10h2V7h-2Z"
      fill="#fff"
    />
  </svg>
);

export const getModelLogo = (model: string) => {
  switch (model) {
    case 'GPT-4o':
      return OpenAILogo;
    case 'Claude-3 Opus':
      return AnthropicLogo;
    case 'Gemini Pro':
      return GeminiLogo;
    case 'Mistral Large':
      return MistralLogo;
    default:
      return OpenAILogo;
  }
};
