export interface SourceConfig {
  brand: string;
  type: "rss" | "html";
  url: string;
  category: string;
  keywords: string[];
}

export const sourceConfigs: SourceConfig[] = [
  {
    brand: "Nikon",
    type: "rss",
    url: "https://www.nikon.com/company/rss/feeds/imaging.rss",
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
    type: "html",
    url: "https://global.canon/en/news/",
    category: "Camera",
    keywords: ["camera", "lens", "cinema eos", "eos", "rf", "video", "sensor"],
  },
  {
    brand: "Sony",
    type: "html",
    url: "https://sony.mediaroom.com/",
    category: "Camera",
    keywords: ["camera", "cinema", "alpha", "burano", "venice", "lens", "sensor"],
  },
];
