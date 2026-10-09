export interface EventItem {
  id: string;
  title: string;
  type: "upcoming" | "past";
  date: string;
  formattedDate?: string;
  subtitle?: string;
  year?: string;
  venue: string;
  city: string;
  coverImg: string;
  linkUrl?: string;
  description?: string;
  isStarred?: boolean;
}

export interface SetItem {
  id: string;
  title: string;
  category: string;
  url: string;
  coverImg: string;
  isPrincipal?: boolean;
  order?: number;
}

export interface VideoItem {
  id: string;
  title: string;
  subtitle: string;
  src: string;
  duration?: string;
  poster: string;
  order?: number;
  isPrincipal?: boolean;
}

export interface CarouselSlide {
  src: string;
  title: string;
  location: string;
  date: string;
  description: string;
  order?: number;
}

export interface SponsorItem {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  category?: string;
  order?: number;
}
