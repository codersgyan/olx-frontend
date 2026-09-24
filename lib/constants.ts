export const COMPANY_NAME = "Coder's Shop";
export const COMPANY_TAGLINE = "Buy, sell, and discover amazing deals near you";

export const APP_ROUTES = {
  HOME: "/",
  BROWSE: "/browse",
  LISTING: (id: string) => `/listing/${id}`,
  POST_AD: "/post-ad",
  MY_ADS: "/my-ads",
  FAVORITES: "/favorites",
  MESSAGES: "/messages",
  SEARCH: "/search",
  AUTH: {
    SIGN_IN: "/auth/signin",
    SIGN_UP: "/auth/signup",
  },
  HELP: "/help",
  CONTACT: "/contact",
  TERMS: "/terms",
  PRIVACY: "/privacy",
  SAFETY: "/safety",
} as const;

export const NAV_LINKS = {
  BROWSE: { title: "Browse", url: APP_ROUTES.BROWSE },
  POST_AD: { title: "Sell", url: APP_ROUTES.POST_AD },
  MY_ADS: { title: "My Ads", url: APP_ROUTES.MY_ADS },
  FAVORITES: { title: "Favorites", url: APP_ROUTES.FAVORITES },
  MESSAGES: { title: "Messages", url: APP_ROUTES.MESSAGES },
  HELP: { title: "Help", url: APP_ROUTES.HELP },
  CONTACT: { title: "Contact Us", url: APP_ROUTES.CONTACT },
  TERMS: { title: "Terms of Service", url: APP_ROUTES.TERMS },
  PRIVACY: { title: "Privacy Policy", url: APP_ROUTES.PRIVACY },
  SAFETY: { title: "Safety Tips", url: APP_ROUTES.SAFETY },
} as const;

export const AUTH_LINKS = {
  LOGIN: { title: "Login", url: APP_ROUTES.AUTH.SIGN_IN },
  SIGNUP: { title: "Sign up", url: APP_ROUTES.AUTH.SIGN_UP },
} as const;
