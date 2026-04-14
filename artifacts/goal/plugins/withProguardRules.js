const { withDangerousMod } = require("@expo/config-plugins");
const { promises: fs } = require("fs");
const path = require("path");

const withProguardRules = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const proguardFile = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "proguard-rules.pro"
      );

      const extraRules = "\n# Keep expo-modules-core internal classes\n-keep class expo.modules.kotlin.** { *; }\n-keep class expo.modules.filesystem.** { *; }\n-dontwarn expo.modules.kotlin.**\n-dontwarn expo.modules.filesystem.**\n";

      try {
        const existing = await fs.readFile(proguardFile, "utf8");
        if (!existing.includes("expo.modules.kotlin")) {
          await fs.writeFile(proguardFile, existing + extraRules);
        }
      } catch (e) {
        await fs.writeFile(proguardFile, extraRules);
      }

      return config;
    },
  ]);
};

module.exports = withProguardRules;
