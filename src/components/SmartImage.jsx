// A plain <img> that takes the shape responsiveImage() returns:
//
//   <SmartImage {...getResponsive(img, '(min-width: 768px) 33vw, 100vw')} alt=… />
//
// `src`, `srcSet`, `sizes` and the intrinsic `width`/`height` all come from the
// derivatives Strapi actually holds for that media, so every candidate is a real
// static file and the box is reserved before the bytes arrive. A media with only
// one candidate comes back with no `srcSet`/`sizes` at all, so this spreads
// straight through either way.
//
// This used to wrap the <img> in a <picture> with an AVIF <source>. Nothing
// generates AVIF any more — the ladder written by strapi-admin's
// scripts/backfill-image-formats.mjs is webp only, since AVIF's decode cost
// lands in Total Blocking Time on Lighthouse's 4x-throttled mobile run for a
// byte saving that measured ~14% in an audit Lighthouse does not score.
export default function SmartImage({ src, ...rest }) {
  if (!src) return null
  return <img src={src} {...rest} />
}
