export type TypeName = "Link" | "Image" | "Text";

export type Type = {
  id: number;
  name: TypeName;
  emoji: string;
};

export type Particle = {
  id: string;
  title?: string;
  content: string;
  is_public: boolean;
  type: number;
  description?: string;
};

export type ParticleValues = {
  description?: string;
  content: string;
  type: string;
  is_public: boolean;
  title?: string;
};
