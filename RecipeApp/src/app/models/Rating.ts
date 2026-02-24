export interface RatingRequest {
  score: number;
}

export interface RatingResponse {
  message: string;
  new_average: number;
}