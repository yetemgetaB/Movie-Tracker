import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Film, Tv, Star, Clock, Calendar,
  Award, Target, Zap, BarChart3, PieChart as PieChartIcon,
  Activity, Users, Eye
} from 'lucide-react';
import { getCollection, type CollectionItem } from '@/lib/collection';

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('all');
  
  const collection = useMemo(() => getCollection(), []);
  const movies = collection.filter(item => item.type === 'movie');
  const series = collection.filter(item => item.type === 'series');

  // Basic Statistics
  const basicStats = useMemo(() => {
    const totalMovies = movies.length;
    const totalSeries = series.length;
    const totalItems = totalMovies + totalSeries;
    
    const ratedItems = collection.filter(item => item.userRating && item.userRating !== '—');
    const averageRating = ratedItems.length > 0 
      ? ratedItems.reduce((sum, item) => sum + parseFloat(item.userRating || '0'), 0) / ratedItems.length
      : 0;

    const highRatedItems = ratedItems.filter(item => parseFloat(item.userRating || '0') >= 8);
    const recentlyWatched = collection.filter(item => {
      if (!item.watchedAt) return false;
      const watchedDate = new Date(item.watchedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return watchedDate > weekAgo;
    });

    return {
      totalItems,
      totalMovies,
      totalSeries,
      averageRating: averageRating.toFixed(1),
      highRatedItems: highRatedItems.length,
      recentlyWatched: recentlyWatched.length,
      completionRate: totalItems > 0 ? ((ratedItems.length / totalItems) * 100).toFixed(1) : '0'
    };
  }, [collection, movies, series]);

  // Genre Analysis
  const genreData = useMemo(() => {
    const genreMap = new Map<string, number>();
    
    collection.forEach(item => {
      if (item.genre && typeof item.genre === 'string') {
        const genres = item.genre.split(',').map(g => g.trim());
        genres.forEach(genre => {
          genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
        });
      }
    });

    return Array.from(genreMap.entries())
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [collection]);

  // Rating Distribution
  const ratingDistribution = useMemo(() => {
    const distribution = [0, 0, 0, 0, 0]; // 1-2, 3-4, 5-6, 7-8, 9-10
    
    collection.forEach(item => {
      if (item.userRating && item.userRating !== '—') {
        const rating = parseFloat(item.userRating);
        if (rating <= 2) distribution[0]++;
        else if (rating <= 4) distribution[1]++;
        else if (rating <= 6) distribution[2]++;
        else if (rating <= 8) distribution[3]++;
        else distribution[4]++;
      }
    });

    return [
      { range: '1-2', count: distribution[0], color: '#ef4444' },
      { range: '3-4', count: distribution[1], color: '#f97316' },
      { range: '5-6', count: distribution[2], color: '#eab308' },
      { range: '7-8', count: distribution[3], color: '#22c55e' },
      { range: '9-10', count: distribution[4], color: '#10b981' }
    ];
  }, [collection]);

  // Monthly Activity
  const monthlyActivity = useMemo(() => {
    const monthMap = new Map<string, number>();
    
    collection.forEach(item => {
      if (item.watchedAt) {
        const date = new Date(item.watchedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
      }
    });

    return Array.from(monthMap.entries())
      .map(([month, count]) => ({ 
        month: month.slice(5), 
        count,
        fullMonth: month 
      }))
      .sort((a, b) => a.fullMonth.localeCompare(b.fullMonth))
      .slice(-12);
  }, [collection]);

  // Top Rated Items
  const topRatedItems = useMemo(() => {
    return collection
      .filter(item => item.userRating && item.userRating !== '—')
      .sort((a, b) => parseFloat(b.userRating || '0') - parseFloat(a.userRating || '0'))
      .slice(0, 10);
  }, [collection]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="px-6 pt-6 pb-8 space-y-6">
      {/* Header */}
      <div className="fade-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display flex items-center gap-2">
              <BarChart3 className="text-primary" />
              Analytics Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Deep insights into your movie and series watching habits
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/settings')}>
            Back to Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 fade-up" style={{ animationDelay: '0.1s' }}>
        <Card className="glass-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{basicStats.totalItems}</p>
                <p className="text-xs text-muted-foreground">
                  {basicStats.totalMovies} movies, {basicStats.totalSeries} series
                </p>
              </div>
              <Film className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">{basicStats.averageRating}</p>
                <p className="text-xs text-muted-foreground">
                  {basicStats.highRatedItems} items rated 8+
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recently Watched</p>
                <p className="text-2xl font-bold">{basicStats.recentlyWatched}</p>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </div>
              <Clock className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{basicStats.completionRate}%</p>
                <Progress value={parseFloat(basicStats.completionRate)} className="mt-2" />
              </div>
              <Target className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="fade-up" style={{ animationDelay: '0.2s' }}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="genres">Genres</TabsTrigger>
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Content Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Movies', value: basicStats.totalMovies, color: '#0088FE' },
                        { name: 'Series', value: basicStats.totalSeries, color: '#00C49F' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Movies', value: basicStats.totalMovies, color: '#0088FE' },
                        { name: 'Series', value: basicStats.totalSeries, color: '#00C49F' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top Rated Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topRatedItems.slice(0, 5).map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[200px]">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{item.userRating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="genres" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Favorite Genres
              </CardTitle>
              <CardDescription>Your most watched genres</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={genreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="genre" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratings" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Rating Distribution
              </CardTitle>
              <CardDescription>How you rate your content</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Activity
              </CardTitle>
              <CardDescription>Your watching activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
