
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


function App() {
  const mapElement = useRef(null);
  const { naver } = window;
  const [position, setPosition] = useState(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [circle, setCircle] = useState(null); 
  const [objectMarkers, setObjectMarkers] = useState([]); // 물체의 마커 상태 추가

  const dummyCoordinates = [
    { latitude: 35.164260, longitude: 128.094415 },

    { latitude: 35.164083, longitude: 128.095193 },
  ];

  useEffect(() => {
    if (!mapElement.current || !naver) return;

    const handleSuccess = (pos) => {
      const { latitude, longitude } = pos.coords;
      const location = new naver.maps.LatLng(latitude, longitude);

      if (!map) {
        const mapOptions = {
          mapDataControl: false,
          logoControl: false,
          center: location,
          zoom: 20,
          zoomControl: false,
        };
        const newMap = new naver.maps.Map(mapElement.current, mapOptions);
        setMap(newMap);

        // 마커 추가 및 상태 저장
        const newMarker = new naver.maps.Marker({
          position: location,
          map: newMap,
        });
        setMarker(newMarker);

        // 반경 30m의 원 추가 및 상태로 저장
        const newCircle = new naver.maps.Circle({
          map: newMap,
          center: location,
          radius: 30,
          strokeColor: '#5347AA',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#CFE7FF',
          fillOpacity: 0.5,
        });
        setCircle(newCircle); // 원 상태 저장

        setPosition(location);

        const newObjectMarkers = dummyCoordinates.map((coord) => {
          return new naver.maps.Marker({
            position: new naver.maps.LatLng(coord.latitude, coord.longitude),
            map: newMap,
            icon: {
              content: `<img src="/beacon.png" alt="beacon" style="width: 50px; height: 50px;">`, 
              size: new naver.maps.Size(50, 50), // 이미지 크기
              origin: new naver.maps.Point(0, 0),
              anchor: new naver.maps.Point(25, 25), // 마커 중심점을 이미지 가운데로 설정
            }
          });
        });
        setObjectMarkers(newObjectMarkers); // 물체 마커 배열 상태 저장
      } else {
        // 지도 중심과 마커, 원의 위치만 갱신
        map.setCenter(location);
        if (marker) {
          marker.setPosition(location); // 마커 위치 갱신
        }
        if (circle) {
          circle.setCenter(location); // 원 위치 갱신
        }
        setPosition(location);
      }
    };

    const handleError = (error) => {
      console.error("Error fetching location: ", error);
    };

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      });

      // 컴포넌트 언마운트 시 watchPosition 해제
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, [naver, map, marker, circle]);

  return (
    <>
      <div ref={mapElement} style={{ minHeight: '100vh' }} />
    </>
  );
};

export default App;

