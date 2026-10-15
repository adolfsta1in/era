/** Теги кэша. После изменения данных в админке вызывается updateTag(tag). */
export const TAGS = {
  settings: "settings",
  services: "services",
  doctors: "doctors",
  content: "content", // отзывы, FAQ, «до и после»
  schedule: "schedule",
} as const;
