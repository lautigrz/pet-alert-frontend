export interface UserReviewAuthor {
  id: string;
  username: string;
  name: string | null;
  lastname: string | null;
  photoUrl: string | null;
}

export interface UserReview {
  id: number;
  rating: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  reviewer: UserReviewAuthor;
}

export interface GivenUserReview {
  id: number;
  rating: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  reviewed: UserReviewAuthor;
}

export interface PaginatedUserReviews {
  items: UserReview[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedGivenUserReviews {
  items: GivenUserReview[];
  page: number;
  pageSize: number;
  total: number;
}

export interface MyUserReviews {
  received: PaginatedUserReviews;
  given: PaginatedGivenUserReviews;
}

export interface UserRatingSummary {
  average: number;
  count: number;
}

export interface CreateUserReviewCommand {
  reviewedUserId: string;
  rating: number;
  description?: string;
}