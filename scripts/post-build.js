import fs from 'fs';
import path from 'path';

const distDir = path.resolve(process.cwd(), 'dist');

if (fs.existsSync(distDir)) {
  const indexHtml = path.join(distDir, 'index.html');
  const fallbackHtml = path.join(distDir, '404.html');
  const noJekyll = path.join(distDir, '.nojekyll');

  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, fallbackHtml);
    console.log('Successfully created dist/404.html for GitHub Pages SPA routing');
  }

  fs.writeFileSync(noJekyll, '');
  console.log('Successfully created dist/.nojekyll for GitHub Pages asset serving');
}
