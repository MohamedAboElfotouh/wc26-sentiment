"use client";

import { useState, useEffect } from 'react';

export default function TweetList({ tweets }) {
  const [randomTweets, setRandomTweets] = useState([]);

  useEffect(() => {
    if (tweets && tweets.length > 0) {
      // Shuffle array in-memory and slice the first 5 entries
      const shuffled = [...tweets].sort(() => 0.5 - Math.random());
      setRandomTweets(shuffled.slice(0, 5));
    }
  }, [tweets]);

  if (!tweets || tweets.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center text-gray-500 dark:text-gray-400">
        <p>No tracking entries found for this team yet.</p>
        <p className="text-xs mt-1 text-gray-400">Tweets will appear after the automated ingestion stream finishes.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
        Live Fan Perspectives (Random Sample)
      </h3>

      <div className="flex flex-col gap-3">
        {randomTweets.map((tweet) => {
          const dateObj = new Date(tweet.posted_at);
          const formattedDate = `${dateObj.getDate()} ${dateObj.toLocaleString('en-US', { month: 'short' })} ${dateObj.getHours() % 12 || 12}:${dateObj.getMinutes().toString().padStart(2, '0')} ${dateObj.getHours() >= 12 ? 'PM' : 'AM'}`;

          return (
            <div
              key={tweet.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm transition-all hover:border-gray-300 dark:hover:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                  @{tweet.username}
                </span>
                <span className="text-xs text-gray-400">
                  {formattedDate}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed break-words">
                {tweet.tweet_text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}