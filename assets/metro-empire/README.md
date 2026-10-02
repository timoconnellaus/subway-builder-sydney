# Metro Empire art assets

37 sprites across four PNG sheets, generated using the built-in image generation tool. The main sheets have RGBA transparency; initial magenta sheets are retained in `originals/`.

| Sheet | Dimensions | Sprites | Layout |
| --- | --- | --- | --- |
| logos.png | 1774 × 887 | 2 | Full logo above, icon below |
| badges.png | 1254 × 1254 | 4 | Red / blue above; green / gold below |
| trains.png | 1536 × 1024 | 15 | Rows: neutral, red, blue, green, gold. Columns: four-car suburban, three-car metro, two-car tram |
| icons.png | 1254 × 1254 | 16 | Four rows, listed below |

Icon rows, left to right:
1. City, Parramatta, airport, Macquarie Park
2. Liverpool, station, interchange station, harbour crossing
3. Stadium event, money, strike, track works
4. Capture timer, toll, pause, play/resume

`atlas.json` supplies named pixel rectangles for all sprites. Rectangles include transparent padding and use a top-left origin. Icons have 313–314 px cells; badges have 627 px cells. Trains face right in a top-down roof view.

These are generated raster illustrations, rather than editable vector masters. Some subtle colour variation remains, so the images are not guaranteed to match the requested hex palette exactly. Very faint low-alpha edge pixels may occur outside the silhouettes. Use alpha-aware rendering; RGB data under transparent pixels is not a background. The optional mood image is not included.

`generation-prompts.json` records the prompts and generation method. No application code is included.
