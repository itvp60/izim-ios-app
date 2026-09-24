/**
 * Поднимает минимальную версию iOS до 15.1 — и приложению, и всем
 * зависимостям.
 *
 * С 28.04.2026 App Store принимает только сборки из Xcode 26+, а он не
 * собирает цели ниже iOS 15: «deployment target 13.4 … supported range is
 * 15.0 to 27.0». Expo SDK 51 по умолчанию ставит 13.4, а многие библиотеки
 * объявляют свой минимум в podspec, поэтому одной настройки приложения мало —
 * нужен хук post_install, который перепишет цель у каждого pod.
 *
 * Устройства не теряем: все iPhone, умеющие записывать NFC-метки (с iPhone 7),
 * обновляются минимум до iOS 15.
 *
 * Папка ios/ генерируется `expo prebuild` и в git не хранится, поэтому правка
 * живёт здесь, а не в Podfile.
 */
const { withDangerousMod, withPodfileProperties, withXcodeProject } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const TARGET = '15.1';
const MARKER = '# izim: min iOS for Xcode 26+';

function withPodsTarget(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let src = fs.readFileSync(podfile, 'utf8');
      if (!src.includes(MARKER)) {
        const anchor = 'post_install do |installer|\n';
        if (!src.includes(anchor)) throw new Error('withIosDeploymentTarget: post_install не найден в Podfile');
        src = src.replace(
          anchor,
          `${anchor}    ${MARKER}\n` +
            `    installer.pods_project.targets.each do |t|\n` +
            `      t.build_configurations.each do |c|\n` +
            `        c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${TARGET}'\n` +
            `      end\n` +
            `    end\n`
        );
        fs.writeFileSync(podfile, src);
      }
      return cfg;
    },
  ]);
}

function withAppTarget(config) {
  return withXcodeProject(config, (cfg) => {
    const configs = cfg.modResults.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configs)) {
      const settings = configs[key].buildSettings;
      if (settings && settings.IPHONEOS_DEPLOYMENT_TARGET) {
        settings.IPHONEOS_DEPLOYMENT_TARGET = TARGET;
      }
    }
    return cfg;
  });
}

module.exports = function withIosDeploymentTarget(config) {
  config = withAppTarget(config);
  config = withPodfileProperties(config, (cfg) => {
    cfg.modResults['ios.deploymentTarget'] = TARGET;
    return cfg;
  });
  return withPodsTarget(config);
};
