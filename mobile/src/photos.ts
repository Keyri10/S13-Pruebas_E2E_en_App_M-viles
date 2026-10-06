import type { ImageSourcePropType } from "react-native";

export const photos = {
  manicure: require("../assets/photos/manicure.png") as ImageSourcePropType,
  gel: require("../assets/photos/gel.png") as ImageSourcePropType,
  art: require("../assets/photos/nail-art.jpg") as ImageSourcePropType,
  retiro: require("../assets/photos/retiro.jpg") as ImageSourcePropType,
  estudio: require("../assets/photos/estudio.png") as ImageSourcePropType,
};

export const servicePhoto: Record<string, ImageSourcePropType> = {
  "svc-manicure": photos.manicure,
  "svc-gel": photos.gel,
  "svc-art": photos.art,
  "svc-retiro": photos.retiro,
};
