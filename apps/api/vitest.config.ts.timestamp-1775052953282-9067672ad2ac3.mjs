// vitest.config.ts
import path from "path";
import { defineConfig } from "file:///E:/CleanConnect/node_modules/.pnpm/vitest@1.6.1_@types+node@20.19.27_@vitest+ui@1.6.1_jsdom@27.4.0_terser@5.44.1/node_modules/vitest/dist/config.js";
var __vite_injected_original_dirname = "E:\\CleanConnect\\apps\\api";
var vitest_config_default = defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "dist/"
      ],
      thresholds: {
        // Global thresholds for all files
        functions: 75,
        branches: 65,
        lines: 75,
        statements: 75,
        // Critical security paths - highest coverage
        "src/middleware/tenant*.ts": {
          functions: 95,
          branches: 90,
          lines: 95,
          statements: 95
        },
        "src/services/token*.ts": {
          functions: 90,
          branches: 85,
          lines: 90,
          statements: 90
        },
        // Business logic - high coverage
        "src/services/**": {
          functions: 80,
          branches: 70,
          lines: 80,
          statements: 80
        },
        // Routes - moderate coverage (integration tested)
        "src/routes/**": {
          functions: 70,
          branches: 60,
          lines: 70,
          statements: 70
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXENsZWFuQ29ubmVjdFxcXFxhcHBzXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcQ2xlYW5Db25uZWN0XFxcXGFwcHNcXFxcYXBpXFxcXHZpdGVzdC5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L0NsZWFuQ29ubmVjdC9hcHBzL2FwaS92aXRlc3QuY29uZmlnLnRzXCI7aW1wb3J0IHBhdGggZnJvbSAncGF0aCdcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZydcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgdGVzdDoge1xyXG4gICAgZW52aXJvbm1lbnQ6ICdub2RlJyxcclxuICAgIGdsb2JhbHM6IHRydWUsXHJcbiAgICBjb3ZlcmFnZToge1xyXG4gICAgICBwcm92aWRlcjogJ3Y4JyxcclxuICAgICAgcmVwb3J0ZXI6IFsndGV4dCcsICdqc29uJywgJ2h0bWwnXSxcclxuICAgICAgZXhjbHVkZTogW1xyXG4gICAgICAgICdub2RlX21vZHVsZXMvJyxcclxuICAgICAgICAnc3JjL3Rlc3QvJyxcclxuICAgICAgICAnKiovKi5kLnRzJyxcclxuICAgICAgICAnKiovKi5jb25maWcuKicsXHJcbiAgICAgICAgJ2Rpc3QvJyxcclxuICAgICAgXSxcclxuICAgICAgdGhyZXNob2xkczoge1xyXG4gICAgICAgIC8vIEdsb2JhbCB0aHJlc2hvbGRzIGZvciBhbGwgZmlsZXNcclxuICAgICAgICBmdW5jdGlvbnM6IDc1LFxyXG4gICAgICAgIGJyYW5jaGVzOiA2NSxcclxuICAgICAgICBsaW5lczogNzUsXHJcbiAgICAgICAgc3RhdGVtZW50czogNzUsXHJcblxyXG4gICAgICAgIC8vIENyaXRpY2FsIHNlY3VyaXR5IHBhdGhzIC0gaGlnaGVzdCBjb3ZlcmFnZVxyXG4gICAgICAgICdzcmMvbWlkZGxld2FyZS90ZW5hbnQqLnRzJzoge1xyXG4gICAgICAgICAgZnVuY3Rpb25zOiA5NSxcclxuICAgICAgICAgIGJyYW5jaGVzOiA5MCxcclxuICAgICAgICAgIGxpbmVzOiA5NSxcclxuICAgICAgICAgIHN0YXRlbWVudHM6IDk1LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJ3NyYy9zZXJ2aWNlcy90b2tlbioudHMnOiB7XHJcbiAgICAgICAgICBmdW5jdGlvbnM6IDkwLFxyXG4gICAgICAgICAgYnJhbmNoZXM6IDg1LFxyXG4gICAgICAgICAgbGluZXM6IDkwLFxyXG4gICAgICAgICAgc3RhdGVtZW50czogOTAsXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8gQnVzaW5lc3MgbG9naWMgLSBoaWdoIGNvdmVyYWdlXHJcbiAgICAgICAgJ3NyYy9zZXJ2aWNlcy8qKic6IHtcclxuICAgICAgICAgIGZ1bmN0aW9uczogODAsXHJcbiAgICAgICAgICBicmFuY2hlczogNzAsXHJcbiAgICAgICAgICBsaW5lczogODAsXHJcbiAgICAgICAgICBzdGF0ZW1lbnRzOiA4MCxcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLyBSb3V0ZXMgLSBtb2RlcmF0ZSBjb3ZlcmFnZSAoaW50ZWdyYXRpb24gdGVzdGVkKVxyXG4gICAgICAgICdzcmMvcm91dGVzLyoqJzoge1xyXG4gICAgICAgICAgZnVuY3Rpb25zOiA3MCxcclxuICAgICAgICAgIGJyYW5jaGVzOiA2MCxcclxuICAgICAgICAgIGxpbmVzOiA3MCxcclxuICAgICAgICAgIHN0YXRlbWVudHM6IDcwLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFzUSxPQUFPLFVBQVU7QUFDdlIsU0FBUyxvQkFBb0I7QUFEN0IsSUFBTSxtQ0FBbUM7QUFHekMsSUFBTyx3QkFBUSxhQUFhO0FBQUEsRUFDMUIsTUFBTTtBQUFBLElBQ0osYUFBYTtBQUFBLElBQ2IsU0FBUztBQUFBLElBQ1QsVUFBVTtBQUFBLE1BQ1IsVUFBVTtBQUFBLE1BQ1YsVUFBVSxDQUFDLFFBQVEsUUFBUSxNQUFNO0FBQUEsTUFDakMsU0FBUztBQUFBLFFBQ1A7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsWUFBWTtBQUFBO0FBQUEsUUFFVixXQUFXO0FBQUEsUUFDWCxVQUFVO0FBQUEsUUFDVixPQUFPO0FBQUEsUUFDUCxZQUFZO0FBQUE7QUFBQSxRQUdaLDZCQUE2QjtBQUFBLFVBQzNCLFdBQVc7QUFBQSxVQUNYLFVBQVU7QUFBQSxVQUNWLE9BQU87QUFBQSxVQUNQLFlBQVk7QUFBQSxRQUNkO0FBQUEsUUFDQSwwQkFBMEI7QUFBQSxVQUN4QixXQUFXO0FBQUEsVUFDWCxVQUFVO0FBQUEsVUFDVixPQUFPO0FBQUEsVUFDUCxZQUFZO0FBQUEsUUFDZDtBQUFBO0FBQUEsUUFHQSxtQkFBbUI7QUFBQSxVQUNqQixXQUFXO0FBQUEsVUFDWCxVQUFVO0FBQUEsVUFDVixPQUFPO0FBQUEsVUFDUCxZQUFZO0FBQUEsUUFDZDtBQUFBO0FBQUEsUUFHQSxpQkFBaUI7QUFBQSxVQUNmLFdBQVc7QUFBQSxVQUNYLFVBQVU7QUFBQSxVQUNWLE9BQU87QUFBQSxVQUNQLFlBQVk7QUFBQSxRQUNkO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
