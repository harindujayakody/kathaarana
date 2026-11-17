// Extra option of this site's image service (src/utils/image-service.mjs).
declare namespace Astro {
  interface CustomImageProps {
    /** Put the site logo in the corner of the generated picture (book covers and pictures). */
    watermark?: boolean;
  }
}
