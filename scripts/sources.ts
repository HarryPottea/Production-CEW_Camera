export interface SourceConfig {
  brand: string;
  type: "rss" | "json";
  url: string;
  category: string;
  keywords: string[];
}

export const sourceConfigs: SourceConfig[] = [
  {
    brand: "Nikon",
    type: "rss",
    url: "https://www.nikon.com/company/rss/news.xml",
    category: "Camera",
    keywords: ["camera", "lens", "z mount", "nikkor", "cinema", "video"],
  },
  {
    brand: "Blackmagic",
    type: "rss",
    url: "https://www.blackmagicdesign.com/rss",
    category: "Cinema Camera",
    keywords: ["camera", "cinema", "ursa", "pyxis", "pocket cinema", "broadcast"],
  },
  {
    brand: "Canon",
    type: "json",
    url: "https://global.canon/en/news/json/news.json",
    category: "Camera",
    keywords: ["camera", "lens", "cinema eos", "eos", "rf", "video"],
  },
  {
    brand: "Sony",
    type: "json",
    url: "https://sony.mediaroom.com/json?o=20",
    category: "Camera",
    keywords: ["camera", "cinema", "alpha", "burano", "venice", "lens"],
  },
];
