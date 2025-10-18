import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
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
import { useArticles } from './hooks/useArticles';
import { useAppInitializer } from './hooks/useAppInitializer';
import ArticleCardSkeleton from './components/ArticleCardSkeleton';

// Lazy load the ArticleModal component for code splitting
const ArticleModal = lazy(() => import('./components/ArticleModal'));


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
        articles,
        user,
        isNewEditionAvailable,
        updateArticle,
        activeTopic,
        setActiveTopic,
        hydrationError,
    } = useAppStore();

    const queryClient = useQueryClient();

    // Custom Hooks for logic
    const { toggleLanguage } = useAppInitializer();
    useAuth();
    const { isLoading, isError, error, isFetchingNextPage, fetchNextPage, hasNextPage, refresh } = useArticles();

    // Local UI State
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [alertInfo, setAlertInfo] = useState<{ title: string; body: string } | null>(null);
    
    const uiText = useMemo(() => UI_TEXT[language], [language]);
    
    // Error message for initial page load failures (e.g., first headline fetch)
    const pageErrorMessage = useMemo(() => {
        if (storeErrorMessage) {
            return { title: uiText.config_error_title, body: storeErrorMessage };
        }
        if (isError) {
            return getFriendlyErrorMessage(error, uiText);
        }
        return null;
    }, [storeErrorMessage, isError, error, uiText]);

    // Error message for hydration failures (e.g., fetching article details after headlines are shown)
    const hydrationAlertMessage = useMemo(() => {
        if (hydrationError) {
            return getFriendlyErrorMessage({ message: hydrationError }, uiText);
        }
        return null;
    }, [hydrationError, uiText]);

    // Effect to show the alert modal for hydration errors
    useEffect(() => {
        if (hydrationAlertMessage) {
            setAlertInfo({ title: hydrationAlertMessage.title, body: hydrationAlertMessage.body });
        }
    }, [hydrationAlertMessage]);


    // Handle deep linking to articles via URL hash
    useEffect(() => {
      const loadArticleFromHash = async () => {
        const hash = window.location.hash;
        if (hash.startsWith('#/article/')) {
          const articleId = hash.replace('#/article/', '');
          if (articleId) {
            // Check if article is already in state
            const existingArticle = useAppStore.getState().articles.find(a => a.id === articleId);
            if (existingArticle) {
              setSelectedArticle(existingArticle);
            } else {
              // If not, fetch it from Firestore
              const articleFromDb = await firestoreService.getArticleById(articleId);
              if (articleFromDb) {
                updateArticle(articleFromDb); // Add to store
                setSelectedArticle(articleFromDb);
              } else {
                 console.warn(`Article with ID ${articleId} not found.`);
                 // Optionally, show an alert to the user
              }
            }
          }
        }
      };
      loadArticleFromHash();

      // Listen for hash changes to close modal if user navigates back
      const handleHashChange = () => {
          if (!window.location.hash.startsWith('#/article/')) {
              setSelectedArticle(null);
          }
      };
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);

    }, [updateArticle]);


    const handleSelectArticle = (article: Article | null) => {
      if (article) {
        window.location.hash = `#/article/${article.id}`;
      } else {
        // Clear hash if modal is closed manually
        if (window.location.hash) {
          window.history.pushState("", document.title, window.location.pathname + window.location.search);
        }
      }
      setSelectedArticle(article);
    };


    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.title = uiText.title;
        setSearchQuery('');
        handleSelectArticle(null);
    }, [language, uiText]);
    
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

        if (pageErrorMessage && articles.length === 0) {
           const isQuotaError = pageErrorMessage?.body.includes("quota") || pageErrorMessage?.body.includes("حصتك");
           return (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ErrorIcon className="w-20 h-20 text-red-400" />
                <h2 className="mt-6 text-3xl font-bold text-stone-800">{pageErrorMessage?.title}</h2>
                <p className="mt-2 max-w-lg text-lg text-stone-600">{pageErrorMessage?.body}</p>
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
          <div className="container mx-auto p-4 lg:p-6">
              <TopicFilter 
                  language={language}
                  activeTopic={activeTopic}
                  onSelect={handleTopicSelect}
              />
              {filteredArticles.length === 0 && !isLoading ? (
                   <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                       <h3 className="text-2xl text-stone-500">{language === 'ar' ? 'لم يتم العثور على مقالات' : 'No Articles Found'}</h3>
                       <p className="mt-2 text-stone-400">{language === 'ar' ? 'حاول تحديد فئة مختلفة.' : 'Try selecting a different topic.'}</p>
                   </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map((item, index) => {
                      const isFeatured = index === 0 && activeTopic === 'all' && searchQuery === '';
                      return (
                         <div
                            key={item.id}
                            className={isFeatured ? 'md:col-span-2 lg:col-span-2' : ''}
                         >
                            <ArticleCard 
                                article={item}
                                onReadMore={handleSelectArticle}
                                categoryText={CATEGORY_MAP[language][item.category] || item.category}
                                uiText={uiText}
                                isFeatured={isFeatured}
                            />
                         </div>
                      );
                  })}
                </div>
              )}

              <div className="flex justify-center my-8">
                  {hasNextPage && !isLoading && (
                    <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="px-6 py-3 bg-stone-800 text-white font-bold rounded-lg hover:bg-stone-900 disabled:bg-stone-400 disabled:cursor-wait transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        {isFetchingNextPage ? uiText.loading_more : uiText.load_more_articles}
                    </button>
                  )}
              </div>

              {!hasNextPage && articles.length > 0 && (
                <div className="text-center my-10 p-6 bg-stone-200/70 rounded-lg max-w-4xl mx-auto">
                    <h3 className="text-2xl font-bold text-stone-800">{uiText.end_of_feed_title}</h3>
                    <p className="mt-2 text-stone-600">{uiText.end_of_feed_body}</p>
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
                onRefresh={refresh}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                user={user}
                onLogin={handleLogin}
                onLogout={authService.logout}
                uiText={uiText}
            />
            
            <main>
                {renderContent()}
            </main>

            <Suspense fallback={<ModalLoadingFallback />}>
                <ArticleModal 
                    article={selectedArticle} 
                    onClose={() => handleSelectArticle(null)} 
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
        </div>
    );
};

export default App;