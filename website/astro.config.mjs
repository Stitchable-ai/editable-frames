import {defineConfig} from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
export default defineConfig({site:'https://editableframes.stitchable.ai',trailingSlash:'always',integrations:[react(),sitemap({filter:page=>!page.endsWith('/404/')})],server:{host:'127.0.0.1',port:8794}});
