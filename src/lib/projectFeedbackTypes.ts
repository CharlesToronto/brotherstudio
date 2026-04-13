export type ProjectStatus = "in_review" | "approved";
export type ProjectViewerRole = "team" | "visitor";

export type ProjectFeedbackDrawingPoint = {
  x: number;
  y: number;
};

export type ProjectFeedbackDrawingElement =
  | {
      id: string;
      type: "freehand";
      color: string;
      strokeWidth: number;
      points: ProjectFeedbackDrawingPoint[];
    }
  | {
      id: string;
      type: "line" | "rectangle" | "circle";
      color: string;
      strokeWidth: number;
      start: ProjectFeedbackDrawingPoint;
      end: ProjectFeedbackDrawingPoint;
    };

export type ProjectFeedbackDrawingLayer = {
  projectId: string;
  imageId: string;
  elements: ProjectFeedbackDrawingElement[];
  updatedBy: string | null;
  updatedAt: string | null;
};

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
  status: ProjectStatus;
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
  accessPassword?: string;
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
