export type AxisKey = 'boldness' | 'acidity' | 'richness' | 'experimental' | 'spiciness' | 'sweetness' | 'umami';
export type RankingVisibility = 'public' | 'partial' | 'private';

export interface Question {
  id: number;
  axis: AxisKey;
  text: string;
}

export interface Character {
  id: string | number;
  boldness: number;
  acidity: number;
  richness: number;
  experimental: number;
  spiciness: number;
  sweetness: number;
  umami: number;
  name_ko: string;
  tagline_ko: string;
}

export interface UserProfile {
  id?: number;
  name: string;
  email: string;
  photo: string;
  nickname?: string;
  bio?: string;
  profileImage?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'private';
  defaultRankingVisibility?: RankingVisibility;
  rankingVisibilityLimit?: number;
}

export interface Cluster {
  cluster_id: string;
  cluster_medoid_value: string;
  cluster_name: string;
  cluster_tagline: string;
}

export interface QuizResult {
  email: string;
  profile: Record<AxisKey, number>;
  cluster: Cluster;
  timestamp: string;
}

export type Satisfaction = 'liked' | 'normal' | 'disliked';

export interface Review {
  id: string;
  email: string;
  establishmentName: string;
  shopName?: string;
  shopNameEn?: string;
  shopNameKo?: string;
  shopNameJp?: string;
  foodKind?: string;
  category: string;
  shopId?: number | string;
  images: string[];
  visitDate: string;
  companions: string[];
  satisfaction: Satisfaction;
  text: string;
  keywords: string[];
  rank?: number;
  landName?: string;
  visitCount?: number;
  shopImage?: string;
  timestamp: string;
  lat?: number | string;
  lon?: number | string;
  rankingVisibility?: RankingVisibility;
  isLiked?: boolean;
  likeCount?: number;
  commentCount?: number;
  previewComments?: Comment[];
  user?: UserProfile;
}

export interface Comment {
  id: number;
  review_id: number;
  user_id: number;
  text: string;
  created_at: string;
  nickname: string;
  photo: string;
  profileImage?: string;
}

export interface RankingItem {
  establishmentName: string;
  rank: number;
}

export interface CategoryRanking {
  category: string;
  rankings: RankingItem[];
}

export interface Shop {
  id: string | number;
  shopRef: string;
  shopName: string;
  shopNameEn?: string;
  shopNameKo?: string;
  shopNameJp?: string;
  detailEn?: string;
  detailKo?: string;
  detailJp?: string;
  foodKind: string;
  categoryEnum?: string;
  landName: string;
  landEnum?: string;
  priceRange?: string;
  lat: number | string;
  lon: number | string;
}

