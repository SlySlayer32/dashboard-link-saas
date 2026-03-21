// vitest.config.ts
import react from "file:///E:/CleanConnect/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@25.0.3_terser@5.44.1_/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { defineConfig } from "file:///E:/CleanConnect/node_modules/.pnpm/vitest@1.6.1_@types+node@25.0.3_@vitest+ui@1.6.1_jsdom@23.2.0_terser@5.44.1/node_modules/vitest/dist/config.js";
var __vite_injected_original_dirname = "E:\\CleanConnect\\apps\\admin";
var vitest_config_default = defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
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
        // Global thresholds
        functions: 70,
        branches: 60,
        lines: 70,
        statements: 70,
        // Auth and security - critical
        "src/store/auth.ts": {
          functions: 90,
          branches: 85,
          lines: 90,
          statements: 90
        },
        // Custom hooks - high coverage
        "src/hooks/**": {
          functions: 80,
          branches: 70,
          lines: 80,
          statements: 80
        },
        // UI components - moderate (visual testing)
        "src/components/**": {
          functions: 65,
          branches: 55,
          lines: 65,
          statements: 65
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXENsZWFuQ29ubmVjdFxcXFxhcHBzXFxcXGFkbWluXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxDbGVhbkNvbm5lY3RcXFxcYXBwc1xcXFxhZG1pblxcXFx2aXRlc3QuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9DbGVhbkNvbm5lY3QvYXBwcy9hZG1pbi92aXRlc3QuY29uZmlnLnRzXCI7aW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXHJcbiAgdGVzdDoge1xyXG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXHJcbiAgICBzZXR1cEZpbGVzOiBbJy4vc3JjL3Rlc3Qvc2V0dXAudHMnXSxcclxuICAgIGdsb2JhbHM6IHRydWUsXHJcbiAgICBjb3ZlcmFnZToge1xyXG4gICAgICBwcm92aWRlcjogJ3Y4JyxcclxuICAgICAgcmVwb3J0ZXI6IFsndGV4dCcsICdqc29uJywgJ2h0bWwnXSxcclxuICAgICAgZXhjbHVkZTogW1xyXG4gICAgICAgICdub2RlX21vZHVsZXMvJyxcclxuICAgICAgICAnc3JjL3Rlc3QvJyxcclxuICAgICAgICAnKiovKi5kLnRzJyxcclxuICAgICAgICAnKiovKi5jb25maWcuKicsXHJcbiAgICAgICAgJ2Rpc3QvJyxcclxuICAgICAgXSxcclxuICAgICAgdGhyZXNob2xkczoge1xyXG4gICAgICAgIC8vIEdsb2JhbCB0aHJlc2hvbGRzXHJcbiAgICAgICAgZnVuY3Rpb25zOiA3MCxcclxuICAgICAgICBicmFuY2hlczogNjAsXHJcbiAgICAgICAgbGluZXM6IDcwLFxyXG4gICAgICAgIHN0YXRlbWVudHM6IDcwLFxyXG5cclxuICAgICAgICAvLyBBdXRoIGFuZCBzZWN1cml0eSAtIGNyaXRpY2FsXHJcbiAgICAgICAgJ3NyYy9zdG9yZS9hdXRoLnRzJzoge1xyXG4gICAgICAgICAgZnVuY3Rpb25zOiA5MCxcclxuICAgICAgICAgIGJyYW5jaGVzOiA4NSxcclxuICAgICAgICAgIGxpbmVzOiA5MCxcclxuICAgICAgICAgIHN0YXRlbWVudHM6IDkwLFxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vIEN1c3RvbSBob29rcyAtIGhpZ2ggY292ZXJhZ2VcclxuICAgICAgICAnc3JjL2hvb2tzLyoqJzoge1xyXG4gICAgICAgICAgZnVuY3Rpb25zOiA4MCxcclxuICAgICAgICAgIGJyYW5jaGVzOiA3MCxcclxuICAgICAgICAgIGxpbmVzOiA4MCxcclxuICAgICAgICAgIHN0YXRlbWVudHM6IDgwLFxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vIFVJIGNvbXBvbmVudHMgLSBtb2RlcmF0ZSAodmlzdWFsIHRlc3RpbmcpXHJcbiAgICAgICAgJ3NyYy9jb21wb25lbnRzLyoqJzoge1xyXG4gICAgICAgICAgZnVuY3Rpb25zOiA2NSxcclxuICAgICAgICAgIGJyYW5jaGVzOiA1NSxcclxuICAgICAgICAgIGxpbmVzOiA2NSxcclxuICAgICAgICAgIHN0YXRlbWVudHM6IDY1LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE0USxPQUFPLFdBQVc7QUFDOVIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsb0JBQW9CO0FBRjdCLElBQU0sbUNBQW1DO0FBSXpDLElBQU8sd0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixNQUFNO0FBQUEsSUFDSixhQUFhO0FBQUEsSUFDYixZQUFZLENBQUMscUJBQXFCO0FBQUEsSUFDbEMsU0FBUztBQUFBLElBQ1QsVUFBVTtBQUFBLE1BQ1IsVUFBVTtBQUFBLE1BQ1YsVUFBVSxDQUFDLFFBQVEsUUFBUSxNQUFNO0FBQUEsTUFDakMsU0FBUztBQUFBLFFBQ1A7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsWUFBWTtBQUFBO0FBQUEsUUFFVixXQUFXO0FBQUEsUUFDWCxVQUFVO0FBQUEsUUFDVixPQUFPO0FBQUEsUUFDUCxZQUFZO0FBQUE7QUFBQSxRQUdaLHFCQUFxQjtBQUFBLFVBQ25CLFdBQVc7QUFBQSxVQUNYLFVBQVU7QUFBQSxVQUNWLE9BQU87QUFBQSxVQUNQLFlBQVk7QUFBQSxRQUNkO0FBQUE7QUFBQSxRQUdBLGdCQUFnQjtBQUFBLFVBQ2QsV0FBVztBQUFBLFVBQ1gsVUFBVTtBQUFBLFVBQ1YsT0FBTztBQUFBLFVBQ1AsWUFBWTtBQUFBLFFBQ2Q7QUFBQTtBQUFBLFFBR0EscUJBQXFCO0FBQUEsVUFDbkIsV0FBVztBQUFBLFVBQ1gsVUFBVTtBQUFBLFVBQ1YsT0FBTztBQUFBLFVBQ1AsWUFBWTtBQUFBLFFBQ2Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
