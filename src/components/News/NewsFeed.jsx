import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './News.css';

export default function NewsFeed() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'technology', 'environment', 'health', 'sports', 'business'];

  useEffect(() => {
    loadArticles();
  }, [selectedCategory]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('news_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="news-feed">
      <div className="news-header">
        <h1>Latest News</h1>
        <p>Stay updated with the latest stories</p>
      </div>

      <div className="category-filter">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading articles...</div>
      ) : (
        <div className="articles-grid">
          {articles.map((article) => (
            <article key={article.id} className="article-card">
              <div className="article-image">
                <img src={article.image_url} alt={article.title} />
                <span className="article-category">{article.category}</span>
              </div>
              <div className="article-content">
                <h2>{article.title}</h2>
                <p>{article.content}</p>
                <div className="article-footer">
                  <span className="article-date">{formatDate(article.created_at)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
