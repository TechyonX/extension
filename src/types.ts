export type TypeName = "Link" | "Image" | "Text";
export type TypeID = 1 | 2 | 3;

export type Type = {
  id: TypeID;
  name: TypeName;
  emoji: string;
};

export type Particle = {
  id: string;
  title?: string;
  content: string;
  is_public: boolean;
  is_archived: boolean;
  type: TypeID;
  description?: string;
  created_at: string;
};

export type ParticleValues = {
  description?: string;
  content: string;
  type: string;
  is_public: boolean;
  title?: string;
};
