import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { message } from '@tauri-apps/plugin-dialog';

export interface MovieData {
  id: string;
  title: string;
  type: 'movie' | 'series';
  rating: number;
  watchedDate?: string;
  notes?: string;
  poster?: string;
  year?: number;
  genres?: string[];
  director?: string;
  cast?: string[];
  personalNotes?: string;
  tags?: string[];
  addedDate: string;
}

export interface UserData {
  movies: MovieData[];
  settings: {
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    language: string;
    notifications: boolean;
    autoUpdate: boolean;
  };
  statistics: {
    totalMovies: number;
    totalSeries: number;
    averageRating: number;
    favoriteGenres: string[];
    watchTimeHours: number;
  };
}

export class DataManager {
  private static instance: DataManager;
  private readonly STORAGE_KEY = 'movie_tracker_data';

  private constructor() {}

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  async exportData(): Promise<void> {
    try {
      const userData = await this.getAllData();
      
      const filePath = await save({
        filters: [
          {
            name: 'JSON Files',
            extensions: ['json']
          },
          {
            name: 'CSV Files', 
            extensions: ['csv']
          },
          {
            name: 'All Files',
            extensions: ['*']
          }
        ],
        defaultPath: `movie-tracker-backup-${new Date().toISOString().split('T')[0]}`
      });

      if (!filePath) {
        return; // User cancelled
      }

      if (filePath.endsWith('.csv')) {
        await this.exportToCSV(userData, filePath);
      } else {
        await this.exportToJSON(userData, filePath);
      }

      await message(
        'Data exported successfully!',
        {
          title: 'Export Complete',
          kind: 'info'
        }
      );
    } catch (error) {
      console.error('Export failed:', error);
      await message(
        'Failed to export data. Please try again.',
        {
          title: 'Export Failed',
          kind: 'error'
        }
      );
    }
  }

  async importData(): Promise<void> {
    try {
      const filePath = await open({
        filters: [
          {
            name: 'JSON Files',
            extensions: ['json']
          },
          {
            name: 'CSV Files',
            extensions: ['csv']
          },
          {
            name: 'All Files',
            extensions: ['*']
          }
        ]
      });

      if (!filePath) {
        return; // User cancelled
      }

      let userData: UserData;

      if (filePath.endsWith('.csv')) {
        userData = await this.importFromCSV(filePath);
      } else {
        userData = await this.importFromJSON(filePath);
      }

      // Validate imported data
      if (!this.validateUserData(userData)) {
        throw new Error('Invalid data format');
      }

      // Merge with existing data or replace
      const shouldMerge = await this.askMergeOrReplace();
      
      if (shouldMerge) {
        await this.mergeData(userData);
      } else {
        await this.replaceData(userData);
      }

      await message(
        'Data imported successfully!',
        {
          title: 'Import Complete',
          kind: 'info'
        }
      );
    } catch (error) {
      console.error('Import failed:', error);
      await message(
        'Failed to import data. Please check the file format and try again.',
        {
          title: 'Import Failed',
          kind: 'error'
        }
      );
    }
  }

  private async exportToJSON(userData: UserData, filePath: string): Promise<void> {
    const jsonData = JSON.stringify(userData, null, 2);
    await writeTextFile(filePath, jsonData);
  }

  private async exportToCSV(userData: UserData, filePath: string): Promise<void> {
    const csvHeaders = [
      'ID', 'Title', 'Type', 'Rating', 'Watched Date', 'Notes', 
      'Year', 'Genres', 'Director', 'Cast', 'Tags', 'Added Date'
    ];
    
    const csvRows = userData.movies.map(movie => [
      movie.id,
      `"${movie.title.replace(/"/g, '""')}"`,
      movie.type,
      movie.rating.toString(),
      movie.watchedDate || '',
      `"${(movie.notes || '').replace(/"/g, '""')}"`,
      movie.year?.toString() || '',
      `"${(movie.genres || []).join('; ')}"`,
      `"${(movie.director || '').replace(/"/g, '""')}"`,
      `"${(movie.cast || []).join('; ')}"`,
      `"${(movie.tags || []).join('; ')}"`,
      movie.addedDate
    ]);

    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    await writeTextFile(filePath, csvContent);
  }

  private async importFromJSON(filePath: string): Promise<UserData> {
    const content = await readTextFile(filePath);
    return JSON.parse(content);
  }

  private async importFromCSV(filePath: string): Promise<UserData> {
    const content = await readTextFile(filePath);
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    
    const movies: MovieData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      const values = this.parseCSVLine(lines[i]);
      const movie: MovieData = {
        id: values[0] || `imported-${Date.now()}-${i}`,
        title: values[1]?.replace(/^"|"$/g, '').replace(/""/g, '"') || '',
        type: (values[2] as 'movie' | 'series') || 'movie',
        rating: parseFloat(values[3]) || 0,
        watchedDate: values[4] || undefined,
        notes: values[5]?.replace(/^"|"$/g, '').replace(/""/g, '"') || undefined,
        year: values[6] ? parseInt(values[6]) : undefined,
        genres: values[7] ? values[7].split('; ').filter(g => g.trim()) : [],
        director: values[8]?.replace(/^"|"$/g, '').replace(/""/g, '"') || undefined,
        cast: values[9] ? values[9].split('; ').filter(c => c.trim()) : [],
        tags: values[10] ? values[10].split('; ').filter(t => t.trim()) : [],
        addedDate: values[11] || new Date().toISOString()
      };
      
      movies.push(movie);
    }
    
    return {
      movies,
      settings: this.getDefaultSettings(),
      statistics: this.calculateStatistics(movies)
    };
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  private validateUserData(data: any): data is UserData {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.movies) &&
      typeof data.settings === 'object' &&
      typeof data.statistics === 'object'
    );
  }

  private async askMergeOrReplace(): Promise<boolean> {
    // For now, return true (merge). In a real implementation, 
    // you'd use Tauri's dialog API to ask the user
    return true;
  }

  private async mergeData(newData: UserData): Promise<void> {
    const existingData = await this.getAllData();
    
    // Merge movies, avoiding duplicates
    const existingIds = new Set(existingData.movies.map(m => m.id));
    const newMovies = newData.movies.filter(m => !existingIds.has(m.id));
    
    const mergedData: UserData = {
      movies: [...existingData.movies, ...newMovies],
      settings: { ...existingData.settings, ...newData.settings },
      statistics: this.calculateStatistics([...existingData.movies, ...newMovies])
    };
    
    await this.saveAllData(mergedData);
  }

  private async replaceData(newData: UserData): Promise<void> {
    await this.saveAllData(newData);
  }

  private async getAllData(): Promise<UserData> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return {
          movies: [],
          settings: this.getDefaultSettings(),
          statistics: this.getEmptyStatistics()
        };
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load data:', error);
      return {
        movies: [],
        settings: this.getDefaultSettings(),
        statistics: this.getEmptyStatistics()
      };
    }
  }

  private async saveAllData(data: UserData): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save data:', error);
      throw error;
    }
  }

  private getDefaultSettings() {
    return {
      theme: 'system' as const,
      accentColor: 'blue',
      language: 'en',
      notifications: true,
      autoUpdate: true
    };
  }

  private getEmptyStatistics() {
    return {
      totalMovies: 0,
      totalSeries: 0,
      averageRating: 0,
      favoriteGenres: [],
      watchTimeHours: 0
    };
  }

  private calculateStatistics(movies: MovieData[]) {
    const totalMovies = movies.filter(m => m.type === 'movie').length;
    const totalSeries = movies.filter(m => m.type === 'series').length;
    const averageRating = movies.length > 0 
      ? movies.reduce((sum, m) => sum + m.rating, 0) / movies.length 
      : 0;
    
    const genreCount: { [key: string]: number } = {};
    movies.forEach(movie => {
      movie.genres?.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });
    
    const favoriteGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);

    return {
      totalMovies,
      totalSeries,
      averageRating: Math.round(averageRating * 100) / 100,
      favoriteGenres,
      watchTimeHours: 0 // Would need duration data to calculate
    };
  }
}

export default DataManager;
