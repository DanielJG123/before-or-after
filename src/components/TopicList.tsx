import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, MapPin, Tag, Play } from 'lucide-react';
import { apiClient, TopicSummary } from '@/api';
import { CreateTopicModal } from './CreateTopicModal';

interface TopicListProps {
  onPlayTopic: (topicId: string) => void;
}

export const TopicList: React.FC<TopicListProps> = ({ onPlayTopic }) => {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.listTopics();
      setTopics(response.topics);
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicCreated = (topicId: string) => {
    loadTopics(); // Refresh list
    onPlayTopic(topicId); // Immediately play the new topic
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Topics</h2>
        <CreateTopicModal onTopicCreated={handleTopicCreated} />
      </div>

      {topics.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <h3 className="text-lg font-semibold mb-2">No topics yet</h3>
            <p className="text-muted-foreground mb-4">Create your first topic to get started</p>
            <CreateTopicModal onTopicCreated={handleTopicCreated} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <Card key={topic.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="line-clamp-2">{topic.period.label}</span>
                  <Button
                    size="sm"
                    onClick={() => onPlayTopic(topic.id)}
                    className="ml-2 shrink-0"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{topic.period.start_year}–{topic.period.end_year}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{topic.location}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {topic.theme && (
                      <Badge variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {topic.theme}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {topic.eventCount} events
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};