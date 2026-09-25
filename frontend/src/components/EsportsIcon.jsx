const iconSources = {
  bgmi: '/icons/bgmi-badge.svg',
  freefire: '/icons/free-fire-badge.svg',
  fifa: '/icons/fifa-badge.svg',
  crosshair: '/icons/crosshair.svg',
  team: '/icons/team.svg',
};

export function EsportsIcon({ name, className, ...props }) {
  return <img src={iconSources[name]} className={className} alt="" aria-hidden="true" {...props} />;
}
