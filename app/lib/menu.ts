export type DietaryStatus = "vegan" | "vegetarian" | "nonVegetarian" | "unconfirmed" | "notApplicable";

export type MenuCategory = {
  slug: string;
  number: string;
  title: string;
  note: string;
  description: string;
  orderRank: number;
};

export type MenuItem = {
  id: string;
  category: string;
  name: string;
  description: string;
  subheading?: string;
  pricePence: number | null;
  priceLabel?: string;
  hidePrice: boolean;
  isAlcoholic: boolean;
  dietaryStatus: DietaryStatus;
  dietaryReviewStatus: "confirmed" | "needs-review";
  dietary: string[];
  allergens: string[];
  spice: "Gentle" | "Warm" | "Medium" | "Hot" | "Aromatic" | "None";
  available: boolean;
  onlineOrdering: boolean;
  featured: boolean;
  displayOrder: number;
};

type ItemOptions = {
  vegetarian?: boolean;
  vegan?: boolean;
  alcoholic?: boolean;
  dietaryStatus?: DietaryStatus;
  subheading?: string;
  orderable?: boolean;
  description?: string;
  featured?: boolean;
};

type MenuDefinition = {
  slug: string;
  title: string;
  note: string;
  description: string;
  items: Array<readonly [name: string, pricePence: number | null, options?: ItemOptions]>;
};

const item = (name: string, pricePence: number, options: ItemOptions = {}) => [name, pricePence, options] as const;
const vegetarian = (name: string, pricePence: number, options: ItemOptions = {}) => item(name, pricePence, {...options, vegetarian: true});
const alcohol = (name: string, options: ItemOptions = {}) => [name, null, {...options, alcoholic: true, orderable: false}] as const;

const definitions: MenuDefinition[] = [
  {
    slug: "starters", title: "Starters", note: "To begin", description: "Pakora, chaat and small plates.",
    items: [
      vegetarian("Vegetable Pakora", 495), vegetarian("Gobi Pakora", 495), vegetarian("Mushroom Pakora", 495),
      item("Chicken Pakora", 695), item("Fish Pakora", 750), item("Chicken 65", 695), item("Chicken Chaat", 650),
      vegetarian("Potato Skins", 450), item("Mixed Pakora", 795, {dietaryStatus: "unconfirmed"}),
    ],
  },
  {
    slug: "clay-oven", title: "Clay Oven", note: "From the tandoor", description: "Charred in the clay oven.",
    items: [
      item("Tandoori Chicken", 1295), item("Chicken Tikka", 1295), item("Lamb Tikka", 1495), item("Tandoori Mixed Grill", 1795),
      vegetarian("Paneer Tikka", 1095), item("Chicken Shashlik", 1295), item("Tandoori Jinga", 1495), item("Masala Chicken Tikka", 1395), item("Masala Lamb", 1495),
    ],
  },
  {
    slug: "chicken", title: "Chicken", note: "Chicken curries", description: "Classic and contemporary chicken dishes.",
    items: [
      item("Traditional Chicken Curry", 1295), item("Chicken Tikka Masala", 1295), item("Butter Chicken", 1295), item("Chicken Chasni", 1295),
      item("Mughlai Korma", 1295), item("Chicken Bhuna", 1395), item("Chicken Jalfrezi", 1350), item("Chicken Dopiaza", 1350),
      item("Chicken Kadai", 1495), item("Indian Garlic Chilli Chicken", 1350), item("Dragon Chicken", 1395), item("Malaidar Chicken", 1295),
    ],
  },
  {
    slug: "beef", title: "Beef", note: "Beef curries", description: "Slow-cooked beef dishes.",
    items: [
      item("Traditional Beef Curry", 1395), item("Beef Chasni", 1395), item("Beef Bhuna", 1495), item("Beef Jalfrezi", 1495),
      item("Beef Kadai", 1495), item("Indian Garlic Chilli Beef", 1395), item("Malaidar Beef", 1395),
    ],
  },
  {
    slug: "lamb", title: "Lamb", note: "Lamb curries", description: "Rich lamb dishes with Malabar spice.",
    items: [
      item("Traditional Lamb Curry", 1395), item("Lamb Chasni", 1395), item("Lamb Bhuna", 1495), item("Lamb Jalfrezi", 1495),
      item("Indian Garlic Chilli Lamb", 1495), item("Malaidar Lamb", 1495),
    ],
  },
  {
    slug: "vegetarian", title: "Vegetarian", note: "Garden & grove", description: "Vegetarian curries and paneer dishes.",
    items: [
      vegetarian("Dal Tadka", 895), vegetarian("Vegetable Mughlai Korma", 995), vegetarian("Paneer Butter Masala", 1050),
      vegetarian("Vegetable Chasni", 995), vegetarian("Aloo Gobi", 895), vegetarian("Cherupayar Curry", 995),
      vegetarian("Kadai Paneer", 1095), vegetarian("Indian Garlic Chilli Vegetables", 1095),
    ],
  },
  {
    slug: "malabar-coast-signature", title: "Malabar Coast Signature", note: "House signatures", description: "Coastal Kerala favourites and Malabar Coast specialities.",
    items: [
      item("Chicken Pollichathu", 1295), item("Kozhi Varutharacha", 1295), item("Aattirachi Kurumulak", 1495, {featured: true}),
      item("Beef Roast", 1395), item("Beef Thenga Kothu", 1395), item("Kizhi Porotta", 1495), item("Masala Grilled Fish", 1495, {featured: true}),
      item("Meen Manga Curry", 1495), item("Meen Moilee", 1495, {featured: true}), item("Konju Coconut Fry", 1495, {featured: true}),
      item("Prawn Moilee", 1595, {featured: true}), item("Fish Pollichathu", 1595),
    ],
  },
  {
    slug: "biriyani", title: "Biriyani", note: "The dum pot", description: "Fragrant rice dishes.",
    items: [item("Chicken", 1295), item("Beef", 1395), item("Lamb", 1495), item("Fish", 1495)],
  },
  {
    slug: "dosa", title: "Dosa", note: "From the griddle", description: "Crisp South Indian dosas.",
    items: [vegetarian("Thattu Dosa", 695), vegetarian("Ghee Roast", 795), vegetarian("Masala Dosa", 895), item("Chicken Tikka Dosa", 995)],
  },
  {
    slug: "breads", title: "Breads", note: "Alongside", description: "Naan, roti and Kerala breads.",
    items: [
      vegetarian("Plain Naan", 350), vegetarian("Butter Naan", 375), vegetarian("Garlic Naan", 425), vegetarian("Chilli Naan", 450),
      vegetarian("Cheese Naan", 495), vegetarian("Peshwari Naan", 495), item("Keema Naan", 550), vegetarian("Tandoori Roti", 295),
      vegetarian("Kerala Porotta (2)", 350), vegetarian("Appam (3)", 495), vegetarian("Idiyappam (3)", 495), vegetarian("Chapathi (2)", 325), vegetarian("Chips", 225),
    ],
  },
  {
    slug: "rice", title: "Rice", note: "Rice", description: "Steamed and seasoned rice.",
    items: [vegetarian("Plain Rice", 350), vegetarian("Pilau Rice", 425), vegetarian("Coconut Rice", 425), vegetarian("Ghee Rice", 425), vegetarian("Mushroom Pilau", 450)],
  },
  {
    slug: "sundries", title: "Sundries", note: "On the side", description: "Chutneys, pickles and sauces.",
    items: [vegetarian("Poppadom", 95), vegetarian("Mixed Pickle", 95), vegetarian("Mango Chutney", 95), vegetarian("Spiced Onion", 95), vegetarian("Raita", 175), vegetarian("Pakora Sauce", 50), vegetarian("Pickle Tray", 249)],
  },
  {
    slug: "kids-menu", title: "Kids Menu", note: "Little diners", description: "Child-sized favourites.",
    items: [item("Chicken Chasni", 795), item("Chicken Korma", 795), item("Chicken Nuggets & Chips", 795), item("Fish Fingers & Chips", 795), item("Fish & Chips", 795)],
  },
  {
    slug: "desserts", title: "Desserts", note: "Something sweet", description: "Traditional sweets and ice cream.",
    items: [vegetarian("Gulab Jamun", 495), vegetarian("Palada Payasam", 495), vegetarian("Malabar Coast Special Dessert", 595, {featured: true}), vegetarian("Ice Cream", 350)],
  },
  {
    slug: "soft-drinks", title: "Soft Drinks", note: "Cold drinks", description: "Soft drinks, soda and juice.",
    items: [
      item("Cola", 250, {dietaryStatus: "notApplicable"}), item("Cola Zero", 250, {dietaryStatus: "notApplicable"}), item("Diet Cola", 250, {dietaryStatus: "notApplicable"}),
      item("Pepsi Max", 250, {dietaryStatus: "notApplicable"}), item("Irn-Bru", 250, {dietaryStatus: "notApplicable"}), item("Diet Irn-Bru", 250, {dietaryStatus: "notApplicable"}),
      item("Tango", 250, {dietaryStatus: "notApplicable"}), item("Lemonade", 250, {dietaryStatus: "notApplicable"}), item("Mango Soda", 350, {dietaryStatus: "notApplicable"}),
      item("Lime Soda", 350, {dietaryStatus: "notApplicable"}), item("Mango Juice", 395, {dietaryStatus: "notApplicable"}),
      item("Tender Coconut Water", 395, {dietaryStatus: "notApplicable"}), item("Fruit Shoot", 150, {dietaryStatus: "notApplicable"}),
    ],
  },
  {
    slug: "tea-coffee", title: "Tea & Coffee", note: "Hot drinks", description: "Tea, coffee and warming favourites.",
    items: [
      item("Tea", 250, {dietaryStatus: "notApplicable"}), item("Black Tea", 225, {dietaryStatus: "notApplicable"}), item("Coffee", 295, {dietaryStatus: "notApplicable"}),
      item("Masala Chai", 295, {dietaryStatus: "notApplicable"}), item("Boost", 325, {dietaryStatus: "notApplicable"}), item("Horlicks", 325, {dietaryStatus: "notApplicable"}),
    ],
  },
  {
    slug: "draught-beer", title: "Draught Beer", note: "From the tap", description: "Draught beer. Prices are intentionally not published online.",
    items: [
      alcohol("Cobra Half"), alcohol("Cobra Pint"), alcohol("Kingfisher Half"), alcohol("Kingfisher Pint"), alcohol("Madri Half"), alcohol("Madri Pint"),
      alcohol("Aspall Half"), alcohol("Aspall Pint"), alcohol("Bombay Bicycle IPA Half"), alcohol("Bombay Bicycle IPA Pint"),
      alcohol("Tennent's Half"), alcohol("Tennent's Pint"), alcohol("Toddy"),
    ],
  },
  {
    slug: "bottled-beer-cider", title: "Bottled Beer & Cider", note: "Bottles", description: "Beer and cider. Alcoholic-item prices are intentionally not published online.",
    items: [
      alcohol("Kingfisher"), alcohol("Cobra"), alcohol("Corona"), alcohol("Budweiser"), alcohol("Peroni"),
      item("Peroni Zero", 400, {dietaryStatus: "notApplicable", orderable: false}), item("Madri Zero", 400, {dietaryStatus: "notApplicable", orderable: false}),
      alcohol("Strongbow"), alcohol("Magners"),
    ],
  },
  {
    slug: "spirits", title: "Spirits", note: "From the bar", description: "Spirits. Prices are intentionally not published online.",
    items: [
      alcohol("Famous Grouse", {subheading: "Whisky"}), alcohol("Jack Daniel's", {subheading: "Whisky"}), alcohol("Jameson", {subheading: "Whisky"}),
      alcohol("Johnnie Walker Black Label", {subheading: "Whisky"}), alcohol("Glenfiddich 12 Year Old", {subheading: "Whisky"}),
      alcohol("Three Barrels", {subheading: "Cognac"}), alcohol("Courvoisier VS", {subheading: "Cognac"}),
      alcohol("Captain Morgan", {subheading: "Rum"}), alcohol("Bacardi Carta Blanca", {subheading: "Rum"}), alcohol("Malibu", {subheading: "Rum"}),
      alcohol("Smirnoff", {subheading: "Vodka"}), alcohol("Absolut", {subheading: "Vodka"}), alcohol("AU Blue Raspberry", {subheading: "Vodka"}),
      alcohol("Gordon's", {subheading: "Gin"}), alcohol("Bombay Sapphire", {subheading: "Gin"}), alcohol("Whitley Neill Rhubarb & Ginger", {subheading: "Gin"}),
      alcohol("Jose Cuervo Silver", {subheading: "Tequila"}), alcohol("Jose Cuervo Gold", {subheading: "Tequila"}),
      alcohol("Mansion House", {subheading: "Indian Spirits"}), alcohol("Old Monk", {subheading: "Indian Spirits"}), alcohol("Mandakini", {subheading: "Indian Spirits"}),
    ],
  },
  {
    slug: "wine", title: "Wine", note: "Wine & prosecco", description: "Wine. Prices are intentionally not published online.",
    items: [
      alcohol("175ml", {subheading: "House Wines"}), alcohol("250ml", {subheading: "House Wines"}), alcohol("Bottle", {subheading: "House Wines"}),
      alcohol("Bottle", {subheading: "Prosecco"}),
    ],
  },
  {
    slug: "mixers", title: "Mixers", note: "With your drink", description: "Mixers and soft-drink additions.",
    items: [
      item("Mixer with Spirit", 100, {dietaryStatus: "notApplicable", orderable: false}),
      item("Premium Tonic / Bottled Mixer", 150, {dietaryStatus: "notApplicable", orderable: false}),
      item("Soft Drink Mixer", 175, {dietaryStatus: "notApplicable", orderable: false}),
    ],
  },
];

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

export const menuCategories: MenuCategory[] = definitions.map((category, index) => ({
  slug: category.slug,
  number: romanNumerals[index],
  title: category.title,
  note: category.note,
  description: category.description,
  orderRank: index,
}));

export const categoryDetails = Object.fromEntries(menuCategories.map((category) => [category.slug, category])) as Record<string, MenuCategory>;

export const menuItems: MenuItem[] = definitions.flatMap((category) =>
  category.items.map(([name, pricePence, options = {}], displayOrder) => {
    const dietaryStatus: DietaryStatus = options.dietaryStatus ?? (options.vegan ? "vegan" : options.vegetarian ? "vegetarian" : "nonVegetarian");
    const idSuffix = slugify(`${options.subheading ? `${options.subheading}-` : ""}${name}`);
    const isAlcoholic = options.alcoholic ?? false;
    return {
      id: `${category.slug}-${idSuffix}`,
      category: category.slug,
      name,
      description: options.description ?? "",
      subheading: options.subheading,
      pricePence,
      priceLabel: isAlcoholic ? "Ask our team" : undefined,
      hidePrice: isAlcoholic,
      isAlcoholic,
      dietaryStatus: isAlcoholic ? "notApplicable" : dietaryStatus,
      dietaryReviewStatus: "needs-review",
      dietary: dietaryStatus === "vegan" ? ["VG"] : dietaryStatus === "vegetarian" ? ["V"] : [],
      allergens: [],
      spice: "None",
      available: true,
      onlineOrdering: options.orderable ?? (!isAlcoholic && pricePence !== null),
      featured: options.featured ?? false,
      displayOrder,
    };
  }),
);

export function getMenuItem(id: string) {
  return menuItems.find((menuItem) => menuItem.id === id);
}

export function formatPrice(pence: number | null, fallback = "Ask our team") {
  if (pence === null) return fallback;
  return new Intl.NumberFormat("en-GB", {style: "currency", currency: "GBP"}).format(pence / 100);
}
