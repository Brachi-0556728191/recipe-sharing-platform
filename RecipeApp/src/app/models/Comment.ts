export interface Comment {
  id: number;
  user_id: number;
  recipe_id: number;
  content: string;
  created_at: string;
  author: string;
  author_first_letter: string;
  is_owner: boolean;
}

export interface NewComment {
  recipe_id: number;
  content: string;
}

