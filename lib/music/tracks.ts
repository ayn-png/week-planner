export interface FocusTrack {
  id: number;
  title: string;
  mood: string;
  url: string;
}

// Free procedural music from SoundHelix — no API key required, freely accessible
export const FOCUS_TRACKS: FocusTrack[] = [
  { id: 1,  title: 'Deep Focus',       mood: 'Ambient', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2,  title: 'Study Flow',       mood: 'Calm',    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3,  title: 'Morning Clarity',  mood: 'Upbeat',  url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 4,  title: 'Night Session',    mood: 'Chill',   url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 5,  title: 'Concentration',    mood: 'Ambient', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { id: 6,  title: 'Mind Flow',        mood: 'Calm',    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  { id: 7,  title: 'Creative Zone',    mood: 'Upbeat',  url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
  { id: 8,  title: 'Deep Work',        mood: 'Ambient', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { id: 9,  title: 'Flow State',       mood: 'Chill',   url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
  { id: 10, title: 'Peak Focus',       mood: 'Upbeat',  url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
];
