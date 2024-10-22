import { useEffect, useRef, useState } from 'react';

function App() {
  const mapElement = useRef(null);
  const { naver } = window;
  const [coordData, setCoordData] = useState(null); // 차량 좌표 데이터
  const [userData, setUserData] = useState(null); // 사용자 좌표 데이터
  const [map, setMap] = useState(null);
  const [Carmarkers, setCarMarkers] = useState([]); // 차량 마커 상태
  const [userMarkers, setUserMarkers] = useState([]); // 사용자 마커 상태
  const [circles, setCircles] = useState([]); // 원 상태 관리
  const [showModal, setShowModal] = useState(false); // 모달 표시 상태
  const [shownCarIds, setShownCarIds] = useState(new Set()); // 모달이 표시된 차량 ID
  const [prevCoordData, setPrevCoordData] = useState(null);  // 이전 차량 좌표를 저장할 상태


  const sseCarUrl = '/api/cars'; // SSE 서버 차량 좌표 URL
  const sseUserUrl = '/api/users'; // SSE 서버 사용자 좌표 URL

  // 위도, 경도 변환 함수 (상대 좌표를 기준으로 변환)
  const convertToLatLon = (carLat, carLon, userX, userY) => {
    const R = 6378137; // 지구 반지름 (미터)
    const dLat = userY / R; // 위도 차이 (라디안)
    const dLon = userX / (R * Math.cos(Math.PI * carLat / 180)); // 경도 차이 (라디안)

    // 위도, 경도 변환 (라디안 -> 도)
    const newLat = carLat + (dLat * 180) / Math.PI;
    const newLon = carLon + (dLon * 180) / Math.PI;

    return { newLat, newLon };
  };

    // 두 좌표 사이의 방위각을 계산하는 함수
  const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const toRadians = (deg) => deg * (Math.PI / 180);
    const toDegrees = (rad) => rad * (180 / Math.PI);

    const dLon = toRadians(lon2 - lon1);
    const lat1Rad = toRadians(lat1);
    const lat2Rad = toRadians(lat2);

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    const bearing = toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360; // 0-360 사이의 값으로 변환
  };

  // SSE로 차량 데이터 받아오기
  useEffect(() => {
    const eventSource = new EventSource(sseCarUrl);

    eventSource.onmessage = (event) => {
      console.log('New data received from SSE:', event.data);
      const port = JSON.parse(event.data); // 차량 좌표 데이터를 파싱
      setCoordData(port); // 받아온 데이터를 상태로 저장

      // 데이터 업데이트 시 shownCarIds 관리
      const newShownCarIds = new Set(shownCarIds);
      port.forEach(car => {
        if (car.car_flag === 1) {
          if (!newShownCarIds.has(car.car_id)) {
            setShowModal(true);
            newShownCarIds.add(car.car_id); // 모달이 표시된 차량 ID 추가

            // 3초 후 모달 자동 닫기
            setTimeout(() => {
              setShowModal(false);
            }, 3000);
          }
        } else {
          newShownCarIds.delete(car.car_id); // car_flag가 0이면 삭제
        }
      });
      setShownCarIds(newShownCarIds);
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close(); // 에러 발생 시 연결 종료
    };

    return () => {
      eventSource.close(); // 컴포넌트 언마운트 시 연결 종료
    };
  }, [shownCarIds]);

  // SSE로 사용자 데이터 받아오기
  useEffect(() => {
    const eventSource = new EventSource(sseUserUrl);

    eventSource.onmessage = (event) => {
      console.log('New user data received from SSE:', event.data);
      const userData = JSON.parse(event.data); // 사용자 좌표 데이터를 파싱

      if (coordData && coordData.length > 0) {
        // 차량의 첫 번째 좌표를 기준으로 변환
        const carLat = coordData[0].car_lat;
        const carLon = coordData[0].car_lon;

        // 상대 좌표 -> 위도, 경도 변환
        const convertedUserData = userData.map((user) => {
          const { newLat, newLon } = convertToLatLon(carLat, carLon, user.user_x, user.user_y);
          return { ...user, user_lat: newLat, user_lon: newLon };
        });

      setUserData(convertedUserData); // 받아온 데이터를 상태로 저장4
      }
    };

    eventSource.onerror = (error) => {
      console.error('User SSE Error:', error);
      eventSource.close(); // 에러 발생 시 연결 종료
    };

    return () => {
      eventSource.close(); // 컴포넌트 언마운트 시 연결 종료
    };
  }, [coordData]);

  useEffect(() => {
    if (!mapElement.current || !naver || !coordData) return;

    // 지도 초기화
    if (!map && coordData.length > 0) {
      const firstCarPosition = new naver.maps.LatLng(coordData[0].car_lat, coordData[0].car_lon);
      const newMap = new naver.maps.Map(mapElement.current, {
        mapDataControl: false,
        logoControl: false,
        center: firstCarPosition, // 기본 위치
        zoom: 20,
        zoomControl: false,
      });
      setMap(newMap);
    }

    if (coordData && map) {
      // 기존 차량 마커 및 원 삭제
      Carmarkers.forEach(({ CarMarker }) => {
        if (CarMarker && CarMarker.setMap) CarMarker.setMap(null);
      });
      circles.forEach(circle => {
        if (circle && circle.setMap) circle.setMap(null);
      });

      // 새로운 차량 좌표로 마커 생성 및 원 그리기
      const newCarMarkers = coordData.map((car, index) => {
        const carPosition = new naver.maps.LatLng(car.car_lat, car.car_lon);

          let rotation = 0;
        if (prevCoordData && prevCoordData[index]) {
          // 이전 차량 좌표와 현재 좌표로 방위각 계산
          rotation = calculateBearing(
            prevCoordData[index].car_lat,
            prevCoordData[index].car_lon,
            car.car_lat,
            car.car_lon
          );
        }

        const CarMarker = new naver.maps.Marker({
          position: carPosition,
          map: map,
          icon: {
              content: `<img src="/beacon.png" alt="beacon" style="width: 50px; height: 50px; transform: rotate(${rotation}deg);">`, 
              size: new naver.maps.Size(30, 30), // 이미지 크기
              origin: new naver.maps.Point(0, 0),
              anchor: new naver.maps.Point(25, 25), // 마커 중심점을 이미지 가운데로 설정
          }
        });

        const circle = new naver.maps.Circle({
          map: map,
          center: carPosition,
          radius: 30,
          strokeColor: '#5347AA',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#CFE7FF',
          fillOpacity: 0,
        });

        return { CarMarker, circle };
      });

      setCarMarkers(newCarMarkers);
      setPrevCoordData(coordData[0]);
      setCircles(newCarMarkers.map(item => item.circle)); // 새로 그린 원을 저장

      // 지도의 중심을 첫 번째 차량의 좌표로 설정
      if (coordData.length > 0) {
        const firstCarPosition = new naver.maps.LatLng(coordData[0].car_lat, coordData[0].car_lon);
        map.setCenter(firstCarPosition);
      }
    }

    if (userData && map) {
      // 기존 사용자 마커 삭제
      userMarkers.forEach(userMarker => {
        if (userMarker && userMarker.setMap) userMarker.setMap(null);
      });

      // 새로운 사용자 좌표로 마커 생성
      const newUserMarkers = userData.map((user) => {
        const userPosition = new naver.maps.LatLng(user.user_lat, user.user_lon);

        return new naver.maps.Marker({
          position: userPosition,
          map: map,
          icon: {
            content: `<img src="/user.gif" alt="beacon" style="width: 50px; height: 50px;">`, 
            size: new naver.maps.Size(30, 30), // 이미지 크기
            origin: new naver.maps.Point(0, 0),
            anchor: new naver.maps.Point(25, 25), // 마커 중심점을 이미지 가운데로 설정
          }
        });
      });

      setUserMarkers(newUserMarkers);
    }
  }, [coordData, userData, map, Carmarkers, circles, naver, prevCoordData, userMarkers ]); // userData 추가

  return (
    <>
      <div ref={mapElement} style={{ minHeight: '100vh' }} />
      {showModal && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px', // 모달 너비
          height: '300px', // 모달 높이 
          borderRadius: '50%', // 원형으로 만들기
          backgroundColor: 'rgba(255, 255, 255, 0)',
          backgroundImage: 'url(/Alert.png)', // 이미지로 배경 설정
          backgroundSize: 'cover', // 이미지가 모달을 완전히 덮도록 설정
          backgroundPosition: 'center', // 이미지 중앙 정렬
        }}>
        </div>
      )}
      
    </>
  );
};

export default App;
