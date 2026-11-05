CPA PASS TRACKER 웹앱 배포 파일

구성:
- index.html: 트래커 본체
- manifest.webmanifest: 홈 화면 앱 설정
- sw.js: 오프라인 캐시
- icon.svg: 앱 아이콘

GitHub Pages 배포:
1. GitHub에 로그인하고 새 Public repository를 만듭니다. 예: cpa-pass-tracker
2. 이 ZIP을 풀고 안의 파일 4개(index.html, manifest.webmanifest, sw.js, icon.svg)를 저장소 최상위에 업로드합니다.
3. 저장소 Settings > Pages로 이동합니다.
4. Build and deployment에서 Deploy from a branch를 선택합니다.
5. Branch는 main, 폴더는 /(root)를 선택하고 Save를 누릅니다.
6. 잠시 기다리면 https://계정이름.github.io/cpa-pass-tracker/ 형태의 주소가 생성됩니다.

아이폰 홈 화면 추가:
1. 위 주소를 Safari로 엽니다.
2. 공유 버튼을 누릅니다.
3. 홈 화면에 추가를 선택하고 추가합니다.

주의:
- 실제 배포 주소는 GitHub 계정명과 저장소 이름에 따라 달라집니다.
- 기록은 현재 브라우저의 localStorage에 저장됩니다. 같은 기기라도 브라우저/웹 주소가 달라지면 기존 HTML 파일의 데이터와 자동으로 합쳐지지 않습니다.
- 다른 기기에서 사용하거나 기록을 옮길 때는 트래커의 데이터 백업/가져오기 기능을 이용하세요.
- 이 저장소를 Public으로 만들면 HTML 소스가 공개됩니다. 학습 기록은 브라우저에 남지만, 민감한 정보를 기록하지 않는 것이 좋습니다.
