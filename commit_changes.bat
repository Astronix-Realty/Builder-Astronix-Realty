cd "d:\Astronix Realty\New\builder-astronix-realty"

git add -A

git commit -m "feat: UI/UX improvements, null-safety fixes, Cloudinary cleanup & builder wizard enhancements

- Add null-guards for .split() in media-uploads.tsx, unit-flow-form.tsx, seed/page.tsx
- Add slug collision retry loop (E11000) in POST /api/properties
- Fix orphaned projects when township.projectCount decreases
- Add Cloudinary delete on media removal (VideoUpload, MasterPlanMapUpload, AboutImageUpload)
- Fix Replace Image - now correctly deletes old Cloudinary file before new upload
- Add otherChargesName field in Other Doc Charges section
- Replace Interior Gallery URL inputs with GalleryUpload file picker
- Replace Core Visual Assets (Hero, 2D, 3D, Virtual Tour) URL inputs with upload components
- Standardize all upload boxes to consistent h-[200px] card design
- Remove BannerUpload URL fallback input for cleaner UI"
