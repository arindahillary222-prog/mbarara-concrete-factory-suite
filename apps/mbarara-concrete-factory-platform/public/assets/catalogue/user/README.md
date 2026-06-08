# Catalogue Photo Upload Checklist

Place real, owned, licensed, or permission-cleared product photos in this folder using the exact filenames below.

The live website currently includes generated product-only PNG catalogue images for every product so the public catalogue never appears empty. When the exact owned WhatsApp/product photos are available as real files on the laptop, replace the generated category image paths in `src/modules/PublicWebsiteModule.tsx` with the relevant files from this folder.

Do not use another company website screenshot as a product photo. The iConic/Indiamart web-result screenshot supplied in chat is treated as a market reference only and is not used in the public catalogue.

People imagery rule: keep the public website focused on product-only and factory-only imagery. If a person must appear, use only the Founder/Managing Director portrait or approved local company team/customer photos. Do not add unrelated foreign stock portraits to the website or catalogue.

## Required Hero Image

- `public/assets/images/mbarara-factory-yard.png`  
  Front-page factory yard / factory face image.

## Product Photo Slots

These slots are mapped in `src/modules/PublicWebsiteModule.tsx`.

| Product on website | Exact supplied title | Required filename |
| --- | --- | --- |
| 60 mm pavers | Cassablanca Smart Paver (260x110x60mm) - Light Grey (29M2) SKU116 | `cassablanca-smart-paver-light-grey-sku116.jpg` |
| ready-mix concrete | Ready-Mixed Concrete and Concrete Mixer Truck | `ready-mix-concrete-mixer-truck.jpg` |
| 4-inch hollow blocks | Hollow Concrete Blocks 4 Inches (10x20x40cm / 100x200x400mm) | `hollow-concrete-blocks-4-inch-stack.jpg` |
| culverts | Concrete Culvert | `concrete-culvert.jpg` |
| double-T pavers | Double T Smart Paver (220x120x60mm) - Coral Red (31 Pcs/M2) SKU139 | `double-t-smart-paver-coral-red-sku139.jpg` |
| 4-inch hollow blocks | Hollow Concrete Blocks 4 Inches (10cm / 100mm) - Single Block View | `hollow-concrete-blocks-4-inch-single.jpg` |
| drainage channels | Precast Concrete Drainage Channels - Slot Drainage | `precast-concrete-drainage-channels-slot-drainage.jpg` |
| double-T pavers | Double T Smart Paver (220x120x60mm) - Light Grey (31 Pcs/M2) SKU117 | `double-t-smart-paver-light-grey-sku117.jpg` |
| grass/permeable pavers | Grass Block Pavers (400x200x60mm) - Light Grey (13 Pcs/M2) SKU062 | `grass-block-pavers-light-grey-sku062.jpg` |

If a file is missing, the website automatically shows the generated fallback catalogue visual for that same product slot.
