import { GameInterface } from '@/components/GameInterface';
import { TopicList } from '@/components/TopicList';
import { useState } from 'react';

const Index = () => {
  const [currentView, setCurrentView] = useState<'topics' | 'game'>('topics');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const handlePlayTopic = (topicId: string) => {
    setSelectedTopicId(topicId);
    setCurrentView('game');
  };

  const handleBackToTopics = () => {
    setCurrentView('topics');
    setSelectedTopicId(null);
  };

  if (currentView === 'game') {
    return <GameInterface topicId={selectedTopicId} onBack={handleBackToTopics} />;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Before or After?</h1>
          <p className="text-muted-foreground">Create custom historical topics and test your knowledge</p>
        </div>
        <TopicList onPlayTopic={handlePlayTopic} />
      </div>
    </div>
  );
};

export default Index;
