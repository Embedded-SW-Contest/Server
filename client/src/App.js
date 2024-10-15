
// import './App.css';
// import React, {useState, useEffect} from 'react';
// import axios from 'axios';


// function App() {
//   console.log("안녕");
//   const [facilityData, setFacilityData] = useState(null);
//   const Url = '/api/hello';
//   useEffect(() => {
//     console.log("22222");
//       const fetchData = async () => {
//         try {
//           console.log("33333");
//           const rankresponse = await axios.get(Url);
//           console.log(rankresponse);
//           console.log("444");
//           const port = rankresponse.data;
//           console.log(port);
  
//           setFacilityData(port);
  
//         } catch (error) {
//           console.error('Error fetching data:', error);
//         }
//       }
//       fetchData();
      
//   }, []);
//   return (
//       <div>
//           <h2>안녕하세요ddd</h2>
//           <div>{facilityData ? facilityData[0].uni_num : "값이 없는데?..."}</div>
//       </div>
//   );
// }

// export default App;


import { useEffect, useRef, useState } from 'react';

function App () {
  const mapElement = useRef(null);
  const { naver } = window;
  const [coordData, setCoordData] = useState(null); // 차량 좌표 데이터
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]); // 차량 마커 상태

  const sseUrl = '/api/cars'; // SSE 서버 URL

  // SSE로 차량 데이터 받아오기
  useEffect(() => {
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      console.log('New data received from SSE:', event.data);
      const port = JSON.parse(event.data); // 차량 좌표 데이터를 파싱
      setCoordData(port); // 받아온 데이터를 상태로 저장
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close(); // 에러 발생 시 연결 종료
    };

    return () => {
      eventSource.close(); // 컴포넌트 언마운트 시 연결 종료
    };
  }, []);

  useEffect(() => {
    if (!mapElement.current || !naver) return;
  
    // 지도 초기화
    if (!map) {
      const newMap = new naver.maps.Map(mapElement.current, {
        mapDataControl: false,
        logoControl: false,
        center: new naver.maps.LatLng(35.164260, 128.094415), // 기본 위치
        zoom: 20,
        zoomControl: false,
      });
      setMap(newMap);
    }
  
    // coordData가 업데이트될 때마다 마커 갱신
    if (coordData && map) {
      // 기존 마커들 삭제
      markers.forEach(marker => marker.setMap(null));
      
      // 새로운 차량 좌표로 마커 생성
      const newMarkers = coordData.map((car) => {
        const carPosition = new naver.maps.LatLng(car.car_lat, car.car_lon);
  
        // 차량 마커 생성
        const newMarker = new naver.maps.Marker({
          position: carPosition,
          map: map,
          icon: {
            content: `<div style="background-color: blue; border-radius: 50%; width: 30px; height: 30px;"></div>`,
            anchor: new naver.maps.Point(15, 15),
          }
        });
  
        // 차량 반경 30m 원 생성
        new naver.maps.Circle({
          map: map,
          center: carPosition,
          radius: 30,
          strokeColor: '#5347AA',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#CFE7FF',
          fillOpacity: 0,
        });
  
        return newMarker;
      });
  
      setMarkers(newMarkers); // 마커 상태 업데이트
  
      // 지도의 중심을 첫 번째 차량의 좌표로 설정
      if (coordData.length > 0) {
        const firstCarPosition = new naver.maps.LatLng(coordData[0].car_lat, coordData[0].car_lon);
        map.setCenter(firstCarPosition);
      }
    }
  }, [coordData, map]); // coordData와 map이 변경될 때 실행

  return (
    <>
      <div ref={mapElement} style={{ minHeight: '100vh' }} />
    </>
  );
};

export default App;

