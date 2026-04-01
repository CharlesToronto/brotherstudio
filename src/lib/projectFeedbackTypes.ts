export type ProjectStatus = "in_review" | "approved";
export type ProjectViewerRole = "team" | "visitor";

export type ProjectFeedbackComment = {
  id: string;
  projectId: string;
  imageId: string;
  x: number;
  y: number;
  color: string;
  author: string;
  content: string;
  createdAt: string;
};

export type ProjectFeedbackTeamMessage = {
  id: string;
  projectId: string;
  imageId: string;
  author: string;
  content: string;
  createdAt: string;
  replyToMessageId: string | null;
  replyToAuthor: string | null;
  replyToContent: string | null;
};

export type ProjectFeedbackImage = {
  id: string;
  projectId: string;
  url: string;
  version: number;
  createdAt: string;
  comments: ProjectFeedbackComment[];
};

export type ProjectVersionGroup = {
  version: number;
  images: ProjectFeedbackImage[];
};

export type ProjectFeedbackProject = {
  id: string;
  name: string;
  status: ProjectStatus;
  createdAt: string;
  latestVersion: number;
  imageCount: number;
  commentCount: number;
  viewerCount: number;
  versions: ProjectVersionGroup[];
};

export type ProjectSummary = {
  id: string;
  name: string;
  status: ProjectStatus;
  createdAt: string;
  latestVersion: number;
  imageCount: number;
  commentCount: number;
  viewerCount: number;
  coverImageUrl: string | null;
  accessPassword?: string;
};
