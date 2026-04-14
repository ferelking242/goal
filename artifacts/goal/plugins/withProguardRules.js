const { withDangerousMod } = require("@expo/config-plugins");
const { promises: fs } = require("fs");
const path = require("path");

const EXPO_RULES = `
# Keep expo-modules-core internal classes
-keep class expo.modules.kotlin.** { *; }
-keep class expo.modules.filesystem.** { *; }

# Suppress warnings for missing expo internal classes (version mismatch with R8)
-dontwarn expo.modules.kotlin.**
-dontwarn expo.modules.filesystem.**
-dontwarn expo.modules.kotlin.runtime.Runtime
-dontwarn expo.modules.kotlin.services.FilePermissionService
-dontwarn expo.modules.kotlin.services.FilePermissionService$Permission

# Allow R8 to continue compiling when classes referenced by libraries are missing
-ignorewarnings
`;

const MARKER = "# expo-proguard-rules-v2";

const withProguardRules = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const proguardFile = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "proguard-rules.pro"
      );

      let existing = "";
      try {
        existing = await fs.readFile(proguardFile, "utf8");
      } catch (e) {
        // file doesn't exist yet
      }

      if (!existing.includes(MARKER)) {
        await fs.writeFile(proguardFile, existing + "\n" + MARKER + EXPO_RULES);
      }

      return config;
    },
  ]);
};

module.exports = withProguardRules;
