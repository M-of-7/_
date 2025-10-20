import React, { useState, useMemo, useEffect, lazy, Suspense, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Header from './components/Header';
import ArticleCard from './components/ArticleCard';
import LoadingOverlay from './components/LoadingOverlay';
import TopicFilter from './components/TopicFilter';
import SpinnerIcon from './components/icons/SpinnerIcon';
import ErrorIcon from './components/icons/ErrorIcon';
import type { Article, Language } from './types';
import { UI_TEXT, CATEGORY_MAP } from './constants';
import { authService } from './services/authService';
import { firestoreService } from './services/firestoreService';
import { useAppStore } from './store/store';
import { useAuth } from './hooks/useAuth';
import { useLiveNews } from './hooks/useLiveNews';
import { useAppInitializer } from './hooks/useAppInitializer';
import ArticleCardSkeleton from './components/ArticleCardSkeleton';

// Lazy load the ArticleModal component for code splitting
const ArticleModal = lazy(() => import('./components/ArticleModal'));
const MessagingPanel = lazy(() => import('./components/MessagingPanel'));
const DiagnosticsPanel = lazy(() => import('./components/DiagnosticsPanel'));


// A new, custom modal component to provide user alerts in a way that is consistent with the app's UI/UX.
interface AlertModalProps {
  title: string;
  body: string;
  onClose: () => void;
  confirmText?: string;
  language: Language;
}

const AlertModal: React.FC<AlertModalProps> = ({ title, body, onClose, confirmText = "OK", language }) => {
  const isRTL = language === 'ar';

  return (
    <div 
      className="fixed inset-0 z-[101] flex items-center justify-center bg-black bg-opacity-60" 
      onClick={onClose}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-title"
      aria-describedby="alert-body"
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-sm w-11/12 p-6 text-center"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="alert-title" className={`text-2xl font-bold text-stone-900 mb-4 ${isRTL ? 'font-serif-ar' : 'font-header-en'}`}>
          {title}
        </h2>
        <p id="alert-body" className="text-stone-700 mb-6">
          {body}
        </p>
        <button 
          onClick={onClose}
          className="bg-stone-800 text-white px-6 py-2 rounded-md font-bold hover:bg-stone-900 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-400"
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
};

// A fallback component to display while the ArticleModal's code is loading.
const ModalLoadingFallback: React.FC = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-label="Loading article...">
    <SpinnerIcon className="w-16 h-16 text-white" />
  </div>
);


const getFriendlyErrorMessage = (error: any, uiText: typeof UI_TEXT['en']): { title: string, body: string } => {
    const technicalMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Content Generation Error:", error);

    // Specific check for server-side API key configuration error
    if (technicalMessage.includes("API_KEY environment variable not set")) {
        return { title: uiText.config_error_title, body: uiText.config_error_gemini };
    }
    // Check if API server is not running
    if (technicalMessage.includes("Server error: Not Found") || technicalMessage.includes("Failed to fetch")) {
        return {
            title: uiText.error_title,
            body: 'Development server not running. Please start the API server with: npm run dev:server'
        };
    }
    // Specific check for cache issue where old code fetches a route that returns HTML.
    if (technicalMessage.includes("is not valid JSON") && technicalMessage.includes("<!DOCTYPE")) {
        return { title: uiText.error_cache_title, body: uiText.error_cache_body };
    }
    if (technicalMessage.includes("Invalid JSON response")) {
        return { title: uiText.error_title, body: uiText.error_gemini_json };
    }
    if (technicalMessage.includes("quota")) {
        return { title: uiText.error_title, body: uiText.error_gemini_quota };
    }
    if (technicalMessage.includes('API key not valid')) {
        return { title: uiText.config_error_title, body: uiText.error_gemini_invalid_key };
    }

    return { title: uiText.error_title, body: uiText.error_subtitle };
};

const App: React.FC = () => {
    // Hydrate from local storage on initial app load
    useEffect(() => {
        useAppStore.getState().hydrateFromLocalStorage();
    }, []);

    // State from Zustand store
    const {
        language,
        appStatus,
        errorMessage: storeErrorMessage,
        user,
        isNewEditionAvailable,
        updateArticle,
        activeTopic,
        setActiveTopic,
    } = useAppStore();

    const queryClient = useQueryClient();

    // Custom Hooks for logic
    const { toggleLanguage } = useAppInitializer();
    useAuth();
    const { articles, isLoading, isError, refreshNews, isLiveMode } = useLiveNews();

    // Local UI State
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [alertInfo, setAlertInfo] = useState<{ title: string; body: string } | null>(null);
    const [showMessaging, setShowMessaging] = useState(false);
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    
    const uiText = useMemo(() => UI_TEXT[language], [language]);
    
    const errorMessage = useMemo(() => {
        if (storeErrorMessage) {
            return { title: uiText.config_error_title, body: storeErrorMessage };
        }
        if (isError) {
            return { title: uiText.error_title, body: uiText.error_subtitle };
        }
        return null;
    }, [storeErrorMessage, isError, uiText]);


    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.title = uiText.title;
        setSearchQuery('');
        setSelectedArticle(null);
    }, [language, uiText]);

    // No infinite scroll needed for fast mode
    const lastArticleElementRef = useCallback((node: HTMLDivElement) => {
        // Placeholder for future expansion
    }, []);
    
    const handleTopicSelect = (topicKey: string) => {
        if (activeTopic === topicKey) return; // Prevent re-fetching for the same topic
        
        // Setting the topic in the store now also clears the articles, triggering the loading state
        setActiveTopic(topicKey);
        
        // Invalidate all article queries to force a complete refetch for the new topic
        queryClient.invalidateQueries({ queryKey: ['articles'] });
    };

    const filteredArticles = useMemo(() => {
        if (searchQuery) {
            return articles.filter(article => 
                article.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (article.body && article.body.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
        return articles;
    }, [articles, searchQuery]);

    const handleAddComment = (articleId: string, commentText: string) => {
        if (!user) return;
        const newComment = { author: user.displayName || user.email || 'Anonymous', text: commentText };
        
        // Persist the comment to the backend
        firestoreService.addCommentToArticle(articleId, newComment);
        
        // Optimistically update the local state
        const articleToUpdate = articles.find(a => a.id === articleId);
        if (articleToUpdate) {
            const updated = { ...articleToUpdate, comments: [...articleToUpdate.comments, newComment] };
            updateArticle(updated);

            if (selectedArticle?.id === articleId) {
                setSelectedArticle(updated);
            }
        }
    };
    
    const handleLogin = async () => {
      try {
        await authService.login();
      } catch (err) {
        console.error("Login process failed:", err);
        setAlertInfo({
            title: uiText.login_failed_title,
            body: uiText.login_failed_body
        });
      }
    };

    const renderContent = () => {
        if (isLoading && articles.length === 0) {
            return (
                <div className="container mx-auto p-4 lg:p-6">
                    <TopicFilter 
                        language={language}
                        activeTopic={activeTopic}
                        onSelect={() => {}} 
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="md:col-span-2 lg:col-span-2"><ArticleCardSkeleton isFeatured={true} /></div>
                        <ArticleCardSkeleton />
                        <ArticleCardSkeleton />
                        <ArticleCardSkeleton />
                        <ArticleCardSkeleton />
                    </div>
                </div>
            );
        }

        if (appStatus === 'error' || (isError && articles.length === 0)) {
           const isQuotaError = errorMessage?.body.includes("quota") || errorMessage?.body.includes("حصتك");
           return (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ErrorIcon className="w-20 h-20 text-red-400" />
                <h2 className="mt-6 text-3xl font-bold text-stone-800">{errorMessage?.title}</h2>
                <p className="mt-2 max-w-lg text-lg text-stone-600">{errorMessage?.body}</p>
                {isQuotaError && (
                    <a 
                        href="https://console.cloud.google.com/billing" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="mt-6 px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {uiText.manage_billing_link}
                    </a>
                )}
              </div>
           );
        }
        
        return (
          <div className="container mx-auto p-4 lg:p-8 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <TopicFilter
                    language={language}
                    activeTopic={activeTopic}
                    onSelect={handleTopicSelect}
                />
                {isLiveMode && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-green-50 to-green-100 text-green-700 font-bold px-4 py-2 rounded-full border-2 border-green-500 shadow-md">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      {language === 'ar' ? 'أخبار حية' : 'Live News'}
                    </div>
                    <button
                      onClick={refreshNews}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 text-sm font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      title={language === 'ar' ? 'تحديث الأخبار' : 'Refresh News'}
                    >
                      {language === 'ar' ? '🔄 تحديث' : '🔄 Refresh'}
                    </button>
                  </div>
                )}
              </div>
              {filteredArticles.length === 0 && !isLoading ? (
                   <div className="col-span-full flex flex-col items-center justify-center py-32 text-center animate-fade-in">
                       <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-stone-200">
                         <h3 className="text-3xl font-bold text-stone-700">{language === 'ar' ? 'لم يتم العثور على مقالات' : 'No Articles Found'}</h3>
                         <p className="mt-3 text-stone-500 text-lg">{language === 'ar' ? 'حاول تحديد فئة مختلفة.' : 'Try selecting a different topic.'}</p>
                       </div>
                   </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map((item, index) => {
                      const isFeatured = index === 0 && activeTopic === 'all' && searchQuery === '';
                      
                      if (filteredArticles.length === index + 1) {
                        return (
                           <div
                              key={item.id}
                              ref={lastArticleElementRef}
                              className={isFeatured ? 'md:col-span-2 lg:col-span-2' : ''}
                           >
                              <ArticleCard 
                                  article={item}
                                  onReadMore={setSelectedArticle}
                                  categoryText={CATEGORY_MAP[language][item.category] || item.category}
                                  uiText={uiText}
                                  isFeatured={isFeatured}
                              />
                           </div>
                        );
                      }
                      
                      return (
                         <div
                            key={item.id}
                            className={isFeatured ? 'md:col-span-2 lg:col-span-2' : ''}
                         >
                            <ArticleCard 
                                article={item}
                                onReadMore={setSelectedArticle}
                                categoryText={CATEGORY_MAP[language][item.category] || item.category}
                                uiText={uiText}
                                isFeatured={isFeatured}
                            />
                         </div>
                      );
                  })}
                </div>
              )}

              {/* No infinite scroll in fast mode */}

              {articles.length > 0 && (
                <div className="text-center my-12 p-8 bg-gradient-to-r from-stone-100 via-stone-50 to-stone-100 rounded-2xl max-w-4xl mx-auto shadow-lg border-2 border-stone-200 animate-fade-in">
                    <h3 className="text-3xl font-bold text-stone-900">{uiText.end_of_feed_title}</h3>
                    <p className="mt-3 text-stone-700 text-lg">{uiText.end_of_feed_body}</p>
                </div>
              )}
          </div>
        );
    };
  
    return (
        <div className={`min-h-screen ${language === 'ar' ? 'font-serif-ar' : 'font-serif-en'}`}>
            {appStatus === 'initializing' && <LoadingOverlay title={uiText.generating_title} subtitle={uiText.generating_subtitle} />}
            {isNewEditionAvailable && (
                <div className="sticky top-0 z-[60] bg-red-700 text-white p-2 text-center flex items-center justify-center gap-4 shadow-lg font-bold text-sm">
                    <span>{uiText.new_edition_available}</span>
                    <button
                        onClick={refresh}
                        className="bg-white text-red-700 font-semibold px-3 py-1 rounded-md hover:bg-red-100 transition-colors"
                    >
                        {uiText.click_to_refresh}
                    </button>
                </div>
            )}

            <Header
                title={uiText.title}
                subtitle={uiText.subtitle}
                language={language}
                toggleLanguage={toggleLanguage}
                languageToggleText={uiText.language_toggle}
                onRefresh={() => window.location.reload()}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                user={user}
                onLogin={handleLogin}
                onLogout={authService.logout}
                onMessagingClick={() => setShowMessaging(true)}
                onDiagnosticsClick={() => setShowDiagnostics(true)}
                uiText={uiText}
            />
            
            <main>
                {renderContent()}
            </main>

            <Suspense fallback={<ModalLoadingFallback />}>
                <ArticleModal 
                    article={selectedArticle} 
                    onClose={() => setSelectedArticle(null)} 
                    language={language}
                    isLoggedIn={!!user}
                    onAddComment={handleAddComment}
                />
            </Suspense>

            {alertInfo && (
                <AlertModal
                    title={alertInfo.title}
                    body={alertInfo.body}
                    onClose={() => setAlertInfo(null)}
                    confirmText={uiText.ok_button}
                    language={language}
                />
            )}

            {showMessaging && (
                <Suspense fallback={<ModalLoadingFallback />}>
                    <MessagingPanel
                        onClose={() => setShowMessaging(false)}
                    />
                </Suspense>
            )}

            {showDiagnostics && (
                <Suspense fallback={<ModalLoadingFallback />}>
                    <DiagnosticsPanel
                        onClose={() => setShowDiagnostics(false)}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default App;