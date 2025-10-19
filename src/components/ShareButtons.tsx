import React, { useState, lazy, Suspense } from 'react';
import type { Article } from '../types';
import XIcon from './icons/XIcon';
import FacebookIcon from './icons/FacebookIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import WhatsappIcon from './icons/WhatsappIcon';
import TelegramIcon from './icons/TelegramIcon';
import SuhufIcon from './icons/SuhufIcon';
import UserIcon from './icons/UserIcon';
import { UI_TEXT } from '../constants';

const MessagingPanel = lazy(() => import('./MessagingPanel'));

interface ShareButtonsProps {
  article: Article;
  uiText: typeof UI_TEXT['en'];
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ article, uiText }) => {
  const [copied, setCopied] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const baseUrl = window.location.origin;
  const articleUrl = `${baseUrl}?article=${article.id}`;
  const shareText = `${article.headline} - ${uiText.title || 'suhf'}`;
  const shareMessage = `${shareText}\n\n${articleUrl}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(articleUrl).then(() => {
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
      name: 'X',
      Icon: XIcon,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Facebook',
      Icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
    },
    {
      name: 'WhatsApp',
      Icon: WhatsappIcon,
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`,
    },
    {
      name: 'Telegram',
      Icon: TelegramIcon,
      href: `https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareText)}`,
    },
  ];

  return (
    <>
      <div className="mt-8 pt-4 border-t border-slate-300">
        <p className="text-lg font-bold text-slate-800 mb-2">{uiText.share_article}</p>
        <div className="flex items-center flex-wrap gap-4">
          <button
            onClick={() => setShowMessaging(true)}
            title="شارك مع الأصدقاء / Share with Friends"
            className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
          >
            <UserIcon className="w-6 h-6" />
            <span className="sr-only">Share with friends</span>
          </button>

          {socialLinks.map(({ name, Icon, href }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={name}
              className="text-slate-600 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-lg"
            >
              <Icon className="w-6 h-6" />
              <span className="sr-only">Share on {name}</span>
            </a>
          ))}
          <button
            onClick={copyToClipboard}
            title={copied ? uiText.copy_link_success : "Copy link"}
            className="text-slate-600 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-lg"
          >
            <ClipboardIcon className="w-6 h-6" color="currentColor" />
             <span className="sr-only">Copy link</span>
          </button>
          {copied && <span className="text-sm text-green-600">{uiText.copy_link_success}</span>}
        </div>
      </div>

      {showMessaging && (
        <Suspense fallback={<div>Loading...</div>}>
          <MessagingPanel article={article} onClose={() => setShowMessaging(false)} />
        </Suspense>
      )}
    </>
  );
};

export default ShareButtons;