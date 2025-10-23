import React, { useState, useMemo, useEffect, lazy, Suspense, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Header from './components/Header';
import ArticleCard from './components/ArticleCard';
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

const ArticleModal = lazy(() => import('./components/ArticleModal'));
const MessagingPanel = lazy(() => import('./components/MessagingPanel'));
const DiagnosticsPanel = lazy(() => import('./components/DiagnosticsPanel'));

const ModalLoadingFallback: React.FC = () => (
  <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black bg-opacity-60" aria-label="Loading...">
    <SpinnerIcon className="w-16 h-16 text-white" />
  </div>
);

const App: React.FC = () => {
    useEffect(() => {
        useAppStore.getState().hydrateFromLocalStorage();
    }, []);

    const {
        language,
        user,
        isNewEditionAvailable,
        updateArticle,
        activeTopic,
        setActiveTopic,
    } = useAppStore();

    const queryClient = useQueryClient();
    const { toggleLanguage } = useAppInitializer();
    useAuth();
    const { articles, isLoading, isError, error, refreshNews, isLiveMode } = useLiveNews();

    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showMessaging, setShowMessaging] = useState(false);
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    
    const uiText = useMemo(() => UI_TEXT[language], [language]);

    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.title = uiText.title;
        setSearchQuery('');
        setSelectedArticle(null);
    }, [language, uiText]);

    const handleTopicSelect = (topicKey: string) => {
        if (activeTopic === topicKey) return;
        setActiveTopic(topicKey);
        queryClient.invalidateQueries({ queryKey: ['live-news'] });
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
        firestoreService.addCommentToArticle(articleId, newComment);
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
      }
    };

    const renderContent = () => {
        if (isLoading && articles.length === 0) {
            return (
                <div className="container mx-auto p-4 lg:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        <div className="md:col-span-2 xl:col-span-2"><ArticleCardSkeleton isFeatured={true} /></div>
                        <ArticleCardSkeleton />
                        <ArticleCardSkeleton />
                        <ArticleCardSkeleton />
                        <ArticleCardSkeleton />
                    </div>
                </div>
            );
        }

        if (isError && articles.length === 0) {
           return (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ErrorIcon className="w-20 h-20 text-red-400" />
                <h2 className="mt-6 text-3xl font-bold text-stone-800">{uiText.error_title}</h2>
                <p className="mt-2 max-w-lg text-lg text-stone-600">
                  {error instanceof Error ? error.message : uiText.error_subtitle}
                </p>
                <button
                    onClick={() => refreshNews()}
                    className="mt-6 px-6 py-2 bg-stone-800 text-white font-bold rounded-lg hover:bg-black transition-colors"
                >
                    {uiText.try_again}
                </button>
              </div>
           );
        }
        
        return (
          <div className="container mx-auto p-4 lg:p-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <TopicFilter
                    language={language}
                    activeTopic={activeTopic}
                    onSelect={handleTopicSelect}
                />
                {isLiveMode && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="flex items-center gap-2 text-sm bg-green-100 text-green-800 font-bold px-3 py-1.5 rounded-full border border-green-200">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                      </span>
                      {language === 'ar' ? 'بث مباشر' : 'Live'}
                    </div>
                    <button
                      onClick={() => refreshNews()}
                      className="px-4 py-1.5 bg-white border border-stone-300 text-stone-700 rounded-full transition-all duration-200 text-sm font-bold shadow-sm hover:shadow-md hover:bg-stone-50 transform hover:-translate-y-px"
                      title={language === 'ar' ? 'تحديث الأخبار' : 'Refresh News'}
                    >
                      🔄
                    </button>
                  </div>
                )}
              </div>
              {filteredArticles.length === 0 && !isLoading ? (
                   <div className="col-span-full flex flex-col items-center justify-center py-32 text-center animate-fade-in">
                       <div className="bg-white p-10 rounded-2xl shadow-xl border border-stone-200">
                         <h3 className="text-3xl font-bold text-stone-700 font-header-en">{language === 'ar' ? 'لا توجد مقالات' : 'No Articles Found'}</h3>
                         <p className="mt-3 text-stone-500 text-lg">{language === 'ar' ? 'جرّب تحديث الفئة أو تحقق لاحقًا.' : 'Try refreshing the topic or check back later.'}</p>
                       </div>
                   </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                  {filteredArticles.map((item, index) => {
                      const isFeatured = index === 0 && activeTopic === 'all' && searchQuery === '';
                      return (
                         <div
                            key={item.id}
                            className={isFeatured ? 'md:col-span-2 xl:col-span-2' : ''}
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
          </div>
        );
    };
  
    return (
        <div className={`min-h-screen ${language === 'ar' ? 'font-serif-ar' : 'font-serif-en'}`}>
            <Header
                title={uiText.title}
                subtitle={uiText.subtitle}
                language={language}
                toggleLanguage={toggleLanguage}
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
                {selectedArticle && <ArticleModal 
                    article={selectedArticle} 
                    onClose={() => setSelectedArticle(null)} 
                    language={language}
                    isLoggedIn={!!user}
                    onAddComment={handleAddComment}
                />}
                {showMessaging && <MessagingPanel onClose={() => setShowMessaging(false)} />}
                {showDiagnostics && <DiagnosticsPanel onClose={() => setShowDiagnostics(false)} />}
            </Suspense>
        </div>
    );
};

export default App;