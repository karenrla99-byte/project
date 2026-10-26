# canedo-osung (CANE DO 협업판)

10월 15일 흰지팡이의 날, 초등학생이 시각장애 이해와 배려 방법을 게임으로 배우는 웹앱.
React + Vite, Vercel 배포. 파트별 폴더로 나눠 여럿이 함께 만듭니다.

## 시작하기
```bash
npm install
npm run dev            # 전체 흐름 실행
npm run part -- game-1 # 내 파트만 단독 실행 (다른 파트가 없어도 됨)
npm run build          # 배포용 빌드 확인
```

## 폴더
| 폴더 | 누구 | 내용 |
|---|---|---|
| `src/shared/` | 정은 | 공통 에셋·컴포넌트·설정·점자표 |
| `src/flow/` | 정은 | 화면 순서 연결 |
| `src/parts/opening` `stage-loading` `bridge` `ending` `ranking` | 정은 | 각 화면 |
| `src/parts/game-1` ~ `game-4` | 각 담당 팀원 | 게임 (이 폴더 안에서만 수정) |
| `docs/` | 정은 | 전체 지침, 파트별 지침, 일정 |

## 꼭 읽기
1. `docs/00_전체_지침.md`
2. 내 파트 지침 `docs/parts/`
