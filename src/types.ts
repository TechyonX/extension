export type TypeName = "Link" | "Image" | "Text";
export type TypeID = 1 | 2 | 3;

export type Type = {
  id: TypeID;
  name: TypeName;
  emoji: string;
};

export type ParticleValues = {
  description?: string;
  content: string;
  type: string;
  is_public: boolean;
  is_archived: boolean;
  title?: string;
};

export type Particle = Omit<ParticleValues, "type"> & {
  id: string;
  type: TypeID;
  created_at: string;
  updated_at: string;
};
