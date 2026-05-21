export interface Author {
  uuid: string;
  name: string;
}

export interface Comment {
  uuid: string;
  content: string;
  author: Author;
  deleted: boolean;
  likeCount: number;
  replies: Comment[];
  createdAt: string;
}
