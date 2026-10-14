-- Class-first rework (build plan §3.2): the class system setup, one JSON blob per
-- character (`configuresClass`). Learned pieces and trophies are derived from biome
-- levels and boss clears, so this is the only new state. Null until a class is picked.
ALTER TABLE "characters" ADD COLUMN "class_config" text;
