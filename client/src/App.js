import './App.css';
import React, {useState, useEffect} from 'react';
import axios from 'axios';


function App() {
  console.log("안녕");
  const [facilityData, setFacilityData] = useState(null);
  const Url = '/api/hello';
  useEffect(() => {
    console.log("22222");
      const fetchData = async () => {
        try {
          console.log("33333");
          const rankresponse = await axios.get(Url);
          console.log(rankresponse);
          console.log("444");
          const port = rankresponse.data;
  
          setFacilityData(port);
  
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
      fetchData();
      
  })
  return (
      <div>
          <h2>안녕하세요</h2>
          <div>{facilityData}</div>
      </div>
  );
}

export default App;
