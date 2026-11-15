export const images = {
  icon: require('../../assets/icon.png'),
  astronaut: require('../../assets/images/astronaut.png'),
  hero: require('../../assets/images/hero-build.png'),
  onboarding: require('../../assets/images/onboarding-idea.png'),
  avatarAlex: require('../../assets/images/avatar-alex.png'),
  google: require('../../assets/images/google-g.png'),
  thumbs: {
    ridge: require('../../assets/images/thumb-ridge.png'),
    teamflow: require('../../assets/images/thumb-teamflow.png'),
    wellness: require('../../assets/images/thumb-wellness.png'),
  },
} as const;

export type ThumbKey = keyof typeof images.thumbs;
