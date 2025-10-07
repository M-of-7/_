import React, { useState } from 'react';
import type { Article } from '../types';
import TwitterIcon from './icons/TwitterIcon';
import FacebookIcon from './icons/FacebookIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import WhatsappIcon from './icons/WhatsappIcon';
import TelegramIcon from './icons/TelegramIcon';
import SuhufIcon from './icons/SuhufIcon';
import { UI_TEXT } from '../constants';


interface ShareButtonsProps {
  article: Article;
  uiText: typeof UI_TEXT['en'];
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ article, uiText }) => {
  const [copied, setCopied] = useState(false);
  // In a web context, we can often use the current window's URL.
  const pageUrl = window.location.href; 
  const shareText = `${article.headline} - ${uiText.title || 'suhf'}`;
  const shareMessage = `${shareText}\n\n${pageUrl}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pageUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const socialLinks = [
    {
      name: uiText.share_suhuf || 'suhf',
      Icon: SuhufIcon,
      href: `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareMessage)}`,
    },
    {
      name: 'Twitter',
      Icon: TwitterIcon,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Facebook',
      Icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
    },
    {
      name: 'WhatsApp',
      Icon: WhatsappIcon,
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`,
    },
    {
      name: 'Telegram',
      Icon: TelegramIcon,
      href: `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`,
    },
  ];

  return (
    <div className="mt-8 pt-4 border-t border-stone-300">
      <p className="text-lg font-bold text-stone-800 mb-2">{uiText.share_article}</p>
      <div className="flex items-center flex-wrap gap-4">
        {socialLinks.map(({ name, Icon, href }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={name}
            className="text-stone-600 hover:text-stone-900 transition-colors"
          >
            <Icon className="w-6 h-6" color="currentColor" />
            <span className="sr-only">Share on {name}</span>
          </a>
        ))}
        <button
          onClick={copyToClipboard}
          title={copied ? uiText.copy_link_success : "Copy link"}
          className="text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ClipboardIcon className="w-6 h-6" color="currentColor" />
           <span className="sr-only">Copy link</span>
        </button>
        {copied && <span className="text-sm text-green-600">{uiText.copy_link_success}</span>}
      </div>
    </div>
  );
};

export default ShareButtons;