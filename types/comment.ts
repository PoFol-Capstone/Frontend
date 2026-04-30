export type Comment = {
  id: string;
  postId: string;
  author: {
    id: string;
    name: string;
    profileImageUrl?: string;
  };
  content: string;
  createdAt: string;
  likeCount: number;
  isLiked: boolean;
};