// 파트 자동 연결 — 정은만 수정 (flow/)
// src/parts/<폴더>/manifest.js 와 index.jsx 가 있으면 자동으로 흐름에 들어갑니다.
// 게임 파트를 늘릴 때: parts/game-5/ 폴더를 만들고 manifest.js + index.jsx 만 넣으면 끝.
const manifests = import.meta.glob('../parts/*/manifest.js', { eager: true });
const components = import.meta.glob('../parts/*/index.jsx', { eager: true });

export const parts = Object.entries(manifests).map(([path, mod]) => {
  const folder = path.split('/')[2];
  return {
    folder,
    ...mod.default,
    Component: components[`../parts/${folder}/index.jsx`]?.default,
  };
});

export const byKind = (kind) => parts.filter((p) => p.kind === kind).sort((a, b) => a.order - b.order);
export const findPart = (folder) => parts.find((p) => p.folder === folder);
