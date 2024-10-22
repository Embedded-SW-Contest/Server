import { useEffect, useRef, useState } from 'react';

function App() {
  const mapElement = useRef(null);
  const { naver } = window;
  const [coordData, setCoordData] = useState(null); // 차량 좌표 데이터
  const [userData, setUserData] = useState([]); // 사용자 좌표 데이터
  const [map, setMap] = useState(null);
  const carMarkers = useRef([]); 
  const userMarkers = useRef([]);
  const circles = useRef([]);
  const [showModal, setShowModal] = useState(false); // 모달 표시 여부 관리 상태
  const [shownCarIds, setShownCarIds] = useState(new Set()); // 모달이 표시된 차량 ID 추적

  const sseCarUrl = '/api/cars';
  const sseUserUrl = '/api/users';

  const carEventSource = useRef(null);
  const userEventSource = useRef(null);

  // 두 좌표의 방위각을 계산하는 함수
  const calculateBearing = (lat1, lon1, lat2, lon2) => { 
    const toRadians = (deg) => deg * (Math.PI / 180);
    const toDegrees = (rad) => rad * (180 / Math.PI);

    const dLon = toRadians(lon2 - lon1);
    const lat1Rad = toRadians(lat1);
    const lat2Rad = toRadians(lat2);

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    const bearing = toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360;
  };

  // 차량 데이터 SSE 연결 설정 및 데이터 수신 처리
  useEffect(() => {
    carEventSource.current = new EventSource(sseCarUrl);

    carEventSource.current.onmessage = (event) => {
      console.log('New data received from SSE:', event.data);
      const port = JSON.parse(event.data);
      setCoordData(port);

      // 모달 표시 관리
      const newShownCarIds = new Set(shownCarIds);
      port.forEach(car => {
        if (car.car_flag === 1) {
          if (!newShownCarIds.has(car.car_id)) {
            setShowModal(true);
            newShownCarIds.add(car.car_id);

            setTimeout(() => {
              setShowModal(false);
            }, 3000); // 3초 후 모달 자동 닫기
          }
        } else {
          newShownCarIds.delete(car.car_id);
        }
      });
      setShownCarIds(newShownCarIds);
    };

    carEventSource.current.onerror = (error) => {
      console.error('SSE Error:', error);
    };

    return () => {
      carEventSource.current.close();
    };
  }, []); 

  // 사용자 데이터 SSE 연결 설정 및 데이터 수신 처리
  useEffect(() => {
    userEventSource.current = new EventSource(sseUserUrl);

    userEventSource.current.onmessage = (event) => {
      console.log('New user data received from SSE:', event.data);
      const userData = JSON.parse(event.data);
      setUserData(userData);
    };

    userEventSource.current.onerror = (error) => {
      console.error('User SSE Error:', error);
    };

    return () => {
      userEventSource.current.close();
    };
  }, []); 

   // 지도 및 마커 업데이트
  useEffect(() => {
    if (!mapElement.current || !naver || !coordData) return;

    // 지도 초기화
    if (!map && coordData.length > 0) {
      const firstCarPosition = new naver.maps.LatLng(coordData[0].car_lat, coordData[0].car_lon);
      const newMap = new naver.maps.Map(mapElement.current, {
        mapDataControl: false,
        logoControl: false,
        center: firstCarPosition,
        zoom: 20,
        zoomControl: false,
      });
      setMap(newMap);
    }

    // 차량 마커 및 원 업데이트
    if (coordData && map) {
      coordData.forEach((car, index) => {
        const carPosition = new naver.maps.LatLng(car.car_lat, car.car_lon);

        // 방위각 계산 및 마커 업데이트
        let rotation = 0;
        if (carMarkers.current[index]) {
          const { car_lat, car_lon } = carMarkers.current[index];
          rotation = calculateBearing(car_lat, car_lon, car.car_lat, car.car_lon);
        }

        if (carMarkers.current[index]) {
          carMarkers.current[index].CarMarker.setPosition(carPosition);
          carMarkers.current[index].CarMarker.setIcon({
            content: `<img src="/beacon.png" alt="beacon" style="width: 50px; height: 50px; transform: rotate(${rotation}deg);">`,
            size: new naver.maps.Size(30, 30),
            origin: new naver.maps.Point(0, 0),
            anchor: new naver.maps.Point(25, 25),
          });
          circles.current[index].setCenter(carPosition);
        } else {
          const CarMarker = new naver.maps.Marker({
            position: carPosition,
            map: map,
            icon: {
              content: `<img src="/beacon.png" alt="beacon" style="width: 50px; height: 50px;">`,
              size: new naver.maps.Size(30, 30),
              origin: new naver.maps.Point(0, 0),
              anchor: new naver.maps.Point(25, 25),
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

          carMarkers.current[index] = { CarMarker, car_lat: car.car_lat, car_lon: car.car_lon };
          circles.current[index] = circle;
        }
      });
    }

    // 사용자 마커 업데이트
    if (userData && map) {
      userData.forEach((user, index) => {
        const userPosition = new naver.maps.LatLng(user.user_lat, user.user_lon);

        if (userMarkers.current[index]) {
          userMarkers.current[index].setPosition(userPosition);
        } else {
          const userMarker = new naver.maps.Marker({
            position: userPosition,
            map: map,
            icon: {
              content: `<img src="/user.gif" alt="beacon" style="width: 50px; height: 50px;">`,
              size: new naver.maps.Size(30, 30),
              origin: new naver.maps.Point(0, 0),
              anchor: new naver.maps.Point(25, 25),
            }
          });
          userMarkers.current[index] = userMarker;
        }
      });

      // 기존에 있던 사용자 마커 중 UserData에서 Delete되면 지도에서 제거
      if (userData.length < userMarkers.current.length) {
        for (let i = userData.length; i < userMarkers.current.length; i++) {
          userMarkers.current[i].setMap(null);
        }
        userMarkers.current.splice(userData.length);
      }
    }
  }, [coordData, userData, map, naver]);

  return (
    <>
      <div ref={mapElement} style={{ minHeight: '100vh' }} />
      {showModal && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0)',
          backgroundImage: 'url(/Alert.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
        </div>
      )}
    </>
  );
}

export default App;
