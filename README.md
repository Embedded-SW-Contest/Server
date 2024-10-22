# 안전지킴이 Server & Client
## LG Embedded 자동차 모빌리티 부문

# :oncoming_automobile: Raspberry Pi Touch Display UI

<img src="https://img.shields.io/badge/React-61DAFB?style=flat&logo=React&logoColor=white"/><img src="https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=HTML5&logoColor=white"/><img src="https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=CSS3&logoColor=white"/>
<img src="https://img.shields.io/badge/Javascript-F7DF1E?style=flat&logo=Javascript&logoColor=white"/><img src="https://img.shields.io/badge/Node.js-5FA04E?style=flat&logo=Node.js&logoColor=white"/>



| 라즈베리파이 UI |
|----------|
![라즈베리파이 UI 화면](https://github.com/user-attachments/assets/9aab5145-7740-46f1-b921-6ab637c6b2b3)

## 프로젝트 소개

- 네이버 지도 API를 이용한 지도 뷰를 제공한다.
- REST API를 이용하여 차량의 좌표와 사용자의 좌표를 통해 지도에 마커 형식으로 추가하여 위치를 제공한다.
- 좁은 골목길에서 보행자가 차량을 향해 접근해올 경우 속도와 거리를 통해 안전거리 구하고 이내일 경우 UI에 경고 알림을 제공한다. 

<br>

## 1. URL

- https://uwb-safeguard.shop/

<br>

## 2. 채택한 개발 기술

### React
- 웹 어플리케이션의 UI를 효과적으로 구축하기 위해 사용되었다.
- 변화하는 값에 대한 상태 관리가 가능하고 데이터가 변경되었을 때 효율적으로 렌더링을 수행할 수 있다.

### Naver Map API

- Naver Map API는 한국 지역에 대한 상세하고 정확한 지도 데이터를 제공해, Zoom을 프로젝트에서 원하는 만큼 할 수 있어 채택하였다.
- API를 통해 차량 좌표를 지도의 중심으로 설정하고, 사용자 좌표를 통해 마커 또한 자세한 위치에 띄울 수 있다.
    
### SSE 통신

- 실시간으로 이동하면서 감지해야하기 때문에 실시간 통신이 중요했고, 차량의 GPS를 서버로 쏠 필요없는 단방향 통신만을 요구했기 때문에 클라이언트의 별도 추가요청 없이 서버에서 업데이트를 스트리밍 할 수 있는 SSE 통신을 채택하였다.
- 차량의 좌표와 사용자의 좌표를 실시간으로 제공받는 데 사용된다.

### Node.js

- 고성능의 비동기 애플리케이션 작성 플랫폼으로 REST API를 제공하기 위한 서버로 사용하기 위채 채택되었다.

## 3. 프로젝트 구조

```
├─client
│  └─src
│      └─App.js
│  └─public
│      └─index.html
│      └─beacon.png
│      └─Alert.png
│      └─user.jif
│                      
└─server.js
   
```

## 4. 개발 기간

### 개발 기간

- 전체 개발 기간 : 2024-09-27 ~ 2024-10-22
- UI 구현 : 2024-09-27 ~ 2022-09-30
- 기능 구현 : 2024-10-01 ~ 2024-10-22

<br>

## 5. 기능

### 1. 차량 마커

- 차량의 좌표를 이용하여 지도의 중심을 차량으로 두고 좌표가 바뀔 때마다 지도도 실시간으로 이동한다.
- 보행자를 인식한 경우 사용자의 좌표를 통해서 지도에 사용자 마커를 표시한다.
- 차량을 향해 보행자가 접근하여 위험을 감지할 경우 UI에 경고 알림을 띄운다.

| 경고 알림 UI |
|----------|
|![경고 알림 UI](https://github.com/user-attachments/assets/e2719d34-bef7-4c27-affe-fc592ff2b1f1)|
