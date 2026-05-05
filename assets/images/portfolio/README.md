# Portfolio image organization

Use this folder for images that appear in portfolio cards and project detail pages.

## Folder structure

```text
assets/images/portfolio/3d-modelling/
assets/images/portfolio/3d-printing/
assets/images/portfolio/photography/
assets/images/portfolio/small-scale-building/
```

## Suggested file naming

Use lowercase names, hyphens, and a predictable order:

```text
project-name-01-main.jpg
project-name-02-detail.jpg
project-name-03-process.jpg
project-name-04-result.jpg
```

Examples:

```text
chair-prototype-01-main.jpg
chair-prototype-02-detail.jpg
chair-prototype-03-process.jpg
chair-prototype-04-result.jpg
```

## How to connect images to the portfolio

After adding images, update `js/portfolio-data.js`:

```js
{
  category: '3d-printing',
  title: 'Chair prototype',
  description: 'Short description of the project.',
  detailUrl: 'portfolio/projects/chair-prototype.html',
  images: [
    {
      src: 'assets/images/portfolio/3d-printing/chair-prototype-01-main.jpg',
      alt: 'Main view of the chair prototype'
    },
    {
      src: 'assets/images/portfolio/3d-printing/chair-prototype-02-detail.jpg',
      alt: 'Detail of the printed chair prototype'
    },
    {
      src: 'assets/images/portfolio/3d-printing/chair-prototype-03-process.jpg',
      alt: 'Printing process for the chair prototype'
    }
  ],
  tags: ['Printare 3D', 'Prototype', 'PETG']
}
```

## Notes

- Use `.jpg` for photos.
- Use `.png` only when transparency or crisp graphics are needed.
- Keep image file sizes reasonable for web loading.
- Always write useful `alt` text for accessibility.
