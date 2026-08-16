import {getMenuContent} from "@/sanity/lib/menu";
import {MenuExperience} from "./menu-experience";

export const revalidate = 60;

export default async function MenuPage() {
  const {categories, items, page} = await getMenuContent();
  return <MenuExperience categories={categories} items={items} page={page} />;
}
