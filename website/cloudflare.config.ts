import { defineConfig } from "cf/config";

export default defineConfig({
	accountId: "5a4df2d7368acc9f6ca258922ea134ff",
	worker: {
		name: "editableframes-site",
		compatibilityDate: "2026-07-11",
		assets: {
			htmlHandling: "auto-trailing-slash",
			notFoundHandling: "404-page",
		},
		domains: [
			"editableframes.stitchable.ai",
		],
	},
});
