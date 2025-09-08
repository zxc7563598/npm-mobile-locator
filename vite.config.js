import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    base: './',
    root: path.resolve(__dirname, 'src'),  // 指定根目录
    build: {
        outDir: path.resolve(__dirname, 'dist')
    }
});